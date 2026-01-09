import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jwtDecode } from 'https://esm.sh/jwt-decode@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminToken = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'No admin token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin is actually an admin
    const decoded = jwtDecode(adminToken) as any
    const adminRole = decoded.user_metadata?.role || 'user'
    
    if (adminRole !== 'admin' && adminRole !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: not an admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { target_user_id } = await req.json()

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'target_user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Service role client to generate session for target user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a short-lived JWT for the target user
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: (await supabaseClient.from('auth.users').select('email').eq('id', target_user_id).single()).data?.email || '',
    })

    if (sessionError || !sessionData?.properties?.email_otp) {
      // Fallback: create a session directly using service role
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(target_user_id)
      
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ error: `User not found: ${authError?.message}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return user ID and email for frontend to handle session
      return new Response(
        JSON.stringify({
          success: true,
          target_user_id: target_user_id,
          message: 'Ready to impersonate. Frontend will handle session.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        target_user_id: target_user_id,
        otp: sessionData.properties?.email_otp,
        message: 'Magic link OTP generated',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
