/**
 * Email templates for Lumi Studio Pro applications
 * Used by the send-application Supabase Edge Function
 */

interface EmailTemplateProps {
  userName: string;
  userEmail: string;
  userInstagram?: string;
  userChallenge?: string;
}

export const adminNotificationTemplate = (props: EmailTemplateProps): string => `
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
      .button-container {
        text-align: center;
        margin: 24px 0;
      }
      .button {
        display: inline-block;
        background-color: #050505;
        color: #ffffff;
        padding: 12px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
      }
      .button:hover {
        background-color: #374151;
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
          <div class="info-value">${props.userName}</div>
        </div>

        <div class="info-box">
          <div class="info-label">Email</div>
          <div class="info-value"><a href="mailto:${props.userEmail}" style="color: #050505; text-decoration: none;">${props.userEmail}</a></div>
        </div>

        ${props.userInstagram ? `
        <div class="info-box">
          <div class="info-label">Instagram</div>
          <div class="info-value"><a href="https://instagram.com/${props.userInstagram.replace('@', '')}" style="color: #050505; text-decoration: none;">@${props.userInstagram.replace('@', '')}</a></div>
        </div>
        ` : ''}

        ${props.userChallenge ? `
        <div class="info-box">
          <div class="info-label">Maior Desafio</div>
          <div class="info-value">${props.userChallenge}</div>
        </div>
        ` : ''}

        <div class="button-container">
          <a href="https://lumihub.vercel.app/admin" class="button">Revisar Aplicação</a>
        </div>

        <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <strong>Próximos Passos:</strong><br>
          Revise a aplicação, entre em contato com a candidata no WhatsApp e agende uma demonstração personalizada do Studio Pro.
        </p>
      </div>

      <div class="footer">
        <p>© 2026 Lumi. Plataforma para Maquiadoras e Beauty Artists Profissionais.</p>
      </div>
    </div>
  </body>
</html>
`;

export const userConfirmationTemplate = (props: EmailTemplateProps): string => `
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
      .highlight-box {
        background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
        border-left: 4px solid #050505;
        padding: 16px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .highlight-title {
        color: #050505;
        font-weight: 600;
        margin: 0 0 8px 0;
        font-size: 14px;
      }
      .highlight-text {
        color: #374151;
        margin: 0;
        font-size: 13px;
      }
      .next-steps {
        background-color: #fafafa;
        padding: 20px;
        border-radius: 8px;
        margin: 24px 0;
      }
      .next-steps h3 {
        color: #050505;
        font-size: 14px;
        margin-top: 0;
        margin-bottom: 12px;
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
      .button-container {
        text-align: center;
        margin: 24px 0;
      }
      .button {
        display: inline-block;
        background-color: #050505;
        color: #ffffff;
        padding: 12px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
      }
      .button:hover {
        background-color: #374151;
      }
      .whatsapp-link {
        color: #25d366;
        text-decoration: none;
        font-weight: 600;
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
      .footer-social {
        margin-top: 12px;
      }
      .footer-social a {
        color: #374151;
        text-decoration: none;
        font-size: 12px;
        margin: 0 8px;
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
        <p class="greeting">Olá ${props.userName},</p>

        <p>Muito obrigada por sua aplicação para <strong>Studio Pro</strong>! Estamos entusiasmadas em explorar como Lumi pode transformar a gestão do seu negócio de beleza.</p>

        <div class="highlight-box">
          <div class="highlight-title">O que acontece agora?</div>
          <div class="highlight-text">
            Nosso time vai revisar sua aplicação e você será contatada em <strong>até 24 horas</strong> pelo WhatsApp para:
          </div>
        </div>

        <div class="next-steps">
          <h3>Próximas Etapas</h3>
          <ol>
            <li><strong>Entrevista Rápida:</strong> Conhecer melhor você e seus desafios</li>
            <li><strong>Demo Personalizada:</strong> Mostrar as features mais relevantes para seu negócio</li>
            <li><strong>Plano Customizado:</strong> Proposta adaptada ao seu caso específico</li>
            <li><strong>Suporte Premium:</strong> Onboarding completo e acesso à nossa concierge</li>
          </ol>
        </div>

        <div class="button-container">
          <a href="https://wa.me/5521983604870" class="button">Iniciar Conversa no WhatsApp</a>
        </div>

        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 24px 0;">
          Ou abra um chat direto: <a href="https://wa.me/5521983604870" class="whatsapp-link">+55 21 98360-4870</a>
        </p>

        <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 13px;">
          <strong>Dúvidas?</strong> Você pode responder este email ou entrar em contato no <a href="https://wa.me/5521983604870" class="whatsapp-link">WhatsApp</a> a qualquer momento. Estamos aqui para ajudar!
        </p>
      </div>

      <div class="footer">
        <p><strong>Lumi — Plataforma para Maquiadoras Profissionais</strong></p>
        <p>CRM, Agenda, Pagamentos e Tudo Mais para Escalar seu Negócio</p>
        <div class="footer-social">
          <a href="https://instagram.com/lumiapp">Instagram</a> •
          <a href="https://lumihub.vercel.app">Website</a> •
          <a href="https://wa.me/5521983604870">WhatsApp</a>
        </div>
      </div>
    </div>
  </body>
</html>
`;
