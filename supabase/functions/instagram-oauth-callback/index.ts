import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;
const REDIRECT_URI = Deno.env.get("INSTAGRAM_REDIRECT_URI")!;

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state"); // user_id encoded

        if (!code || !state) {
            return new Response("Missing code or state", { status: 400 });
        }

        // 1. Trocar code por access token
        const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: INSTAGRAM_APP_ID,
                client_secret: INSTAGRAM_APP_SECRET,
                grant_type: "authorization_code",
                redirect_uri: REDIRECT_URI,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(tokenData.error_message || "Failed to get access token");
        }

        // Short-lived token
        const shortToken = tokenData.access_token;
        const userId = tokenData.user_id;

        // 2. Trocar por long-lived token (60 dias)
        const longTokenResponse = await fetch(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortToken}`
        );

        const longTokenData = await longTokenResponse.json();
        const accessToken = longTokenData.access_token;
        const expiresIn = longTokenData.expires_in; // seconds

        // 3. Buscar dados do perfil
        const profileResponse = await fetch(
            `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
        );

        const profile = await profileResponse.json();

        // 4. Buscar followers count (requer Instagram Graph API)
        const insightsResponse = await fetch(
            `https://graph.instagram.com/${userId}?fields=followers_count,follows_count&access_token=${accessToken}`
        );

        const insights = await insightsResponse.json();

        // 5. Salvar conexão no banco
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        const { error } = await supabase
            .from("instagram_connections")
            .upsert({
                user_id: state, // decoded user_id
                instagram_user_id: userId,
                username: profile.username,
                access_token: accessToken,
                token_expires_at: expiresAt.toISOString(),
                followers_count: insights.followers_count || 0,
                following_count: insights.follows_count || 0,
                media_count: profile.media_count || 0,
                scopes: ["instagram_basic", "instagram_content_publish"],
                is_connected: true,
                last_synced_at: new Date().toISOString(),
            })
            .eq("user_id", state);

        if (error) throw error;

        // Redirecionar de volta ao app
        return Response.redirect(`${Deno.env.get("APP_URL")}/integracoes?instagram=success`, 302);
    } catch (error: any) {
        console.error("Instagram OAuth error:", error);
        return Response.redirect(`${Deno.env.get("APP_URL")}/integracoes?instagram=error`, 302);
    }
});
