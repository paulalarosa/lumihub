import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Resend from "https://esm.sh/resend@1.4.0";

// Email template functions
const adminNotificationTemplate = (props: Record<string, string>): string => `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Aplicação - Lumi Studio Pro</title>
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #050505 0%, #374151 100%);
        padding: 32px 24px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        font-size: 28px;
        margin: 0;
        font-weight: 600;
      }
      .content {
        padding: 32px 24px;
      }
      .content h2 {
        color: #050505;
        font-size: 18px;
        margin-top: 0;
        margin-bottom: 16px;
      }
      .content p {
        color: #374151;
        font-size: 14px;
        line-height: 1.6;
        margin: 12px 0;
      }
      .info-box {
        background-color: #fafafa;
        border-left: 4px solid #050505;
        padding: 16px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .info-label {
        color: #050505;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .info-value {
        color: #374151;
        font-size: 14px;
        margin-top: 4px;
      }
      .info-value a {
        color: #050505;
        text-decoration: none;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 24px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .footer p {
        color: #9ca3af;
        font-size: 12px;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>✨ Nova Aplicação Studio Pro</h1>
      </div>
      <div class="content">
        <h2>Uma nova maquiadora está interessada em Studio Pro!</h2>
        <p>Você recebeu uma nova aplicação para o plano Studio Pro. Veja os detalhes abaixo:</p>

        <div class="info-box">
          <div class="info-label">Nome</div>
          <div class="info-value">${props.name}</div>
        </div>

        <div class="info-box">
          <div class="info-label">Email</div>
          <div class="info-value"><a href="mailto:${props.email}">${props.email}</a></div>
        </div>

        ${props.instagram ? `
        <div class="info-box">
          <div class="info-label">Instagram</div>
          <div class="info-value"><a href="https://instagram.com/${props.instagram.replace('@', '')}" target="_blank">@${props.instagram.replace('@', '')}</a></div>
        </div>
        ` : ''}

        ${props.challenge ? `
        <div class="info-box">
          <div class="info-label">Maior Desafio</div>
          <div class="info-value">${props.challenge}</div>
        </div>
        ` : ''}
      </div>
      <div class="footer">
        <p>© 2026 Lumi. Plataforma para Maquiadoras e Beauty Artists Profissionais.</p>
      </div>
    </div>
  </body>
</html>
`;

const userConfirmationTemplate = (props: Record<string, string>): string => `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recebemos sua Aplicação - Lumi Studio Pro</title>
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #050505 0%, #374151 100%);
        padding: 32px 24px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        font-size: 28px;
        margin: 0;
        font-weight: 600;
      }
      .header p {
        color: #e5e7eb;
        font-size: 14px;
        margin: 8px 0 0 0;
      }
      .content {
        padding: 32px 24px;
      }
      .greeting {
        color: #050505;
        font-size: 16px;
        margin-bottom: 16px;
      }
      .content p {
        color: #374151;
        font-size: 14px;
        line-height: 1.6;
        margin: 12px 0;
      }
      .content strong {
        color: #050505;
      }
      .highlight-box {
        background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
        border-left: 4px solid #050505;
        padding: 16px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .next-steps ol {
        color: #374151;
        font-size: 13px;
        padding-left: 20px;
        margin: 0;
      }
      .next-steps li {
        margin-bottom: 8px;
        line-height: 1.5;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 24px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .footer p {
        color: #9ca3af;
        font-size: 12px;
        margin: 6px 0;
      }
      .footer a {
        color: #25d366;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>Aplicação Recebida! ✨</h1>
        <p>Seu interesse em Studio Pro foi registrado com sucesso</p>
      </div>
      <div class="content">
        <p class="greeting">Olá ${props.name},</p>
        <p>Muito obrigada por sua aplicação para <strong>Studio Pro</strong>! Estamos entusiasmadas em explorar como Lumi pode transformar a gestão do seu negócio de beleza.</p>

        <div class="highlight-box">
          <div class="next-steps">
            <ol>
              <li><strong>Entrevista Rápida:</strong> Conhecer melhor você e seus desafios</li>
              <li><strong>Demo Personalizada:</strong> Mostrar as features mais relevantes para seu negócio</li>
              <li><strong>Plano Customizado:</strong> Proposta adaptada ao seu caso específico</li>
              <li><strong>Suporte Premium:</strong> Onboarding completo e acesso à nossa concierge</li>
            </ol>
          </div>
        </div>

        <p style="text-align: center; margin: 24px 0;">
          <a href="https://wa.me/5521983604870" style="background: #25d366; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Iniciar Conversa no WhatsApp</a>
        </p>

        <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 13px;">
          <strong>Dúvidas?</strong> Você pode responder este email ou entrar em contato no <a href="https://wa.me/5521983604870">WhatsApp</a> a qualquer momento.
        </p>
      </div>
      <div class="footer">
        <p><strong>Lumi — Plataforma para Maquiadoras Profissionais</strong></p>
        <p>CRM, Agenda, Pagamentos e Tudo Mais para Escalar seu Negócio</p>
      </div>
    </div>
  </body>
</html>
`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { name, email, instagram, challenge } = body;
    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const RESEND_TO = Deno.env.get('RESEND_TO');

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!RESEND_TO) {
      return new Response(JSON.stringify({ error: 'RESEND_TO (recipient) not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const resend = new Resend(RESEND_API_KEY);

    // Send admin notification
    const adminSend = await resend.emails.send({
      from: 'Lumi <no-reply@lumihub.app>',
      to: RESEND_TO,
      subject: `✨ Nova aplicação Studio Pro — ${name}`,
      html: adminNotificationTemplate({ name, email, instagram: instagram || '', challenge: challenge || '' }),
    });

    // Send user confirmation
    const userSend = await resend.emails.send({
      from: 'Lumi <no-reply@lumihub.app>',
      to: email,
      subject: 'Recebemos sua aplicação! — Lumi Studio Pro',
      html: userConfirmationTemplate({ name, email, instagram: instagram || '', challenge: challenge || '' }),
    });

    return new Response(JSON.stringify({ ok: true, admin: adminSend, user: userSend }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

