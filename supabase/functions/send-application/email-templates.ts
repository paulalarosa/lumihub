/**
 * Email templates for KONTROL Studio Pro applications
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
    <title>Nova Aplicação - KONTROL</title>
    <style>
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0;
        padding: 0;
        background-color: #000000;
        color: #e5e5e5;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #0c0c0c;
        border: 1px solid #333;
      }
      .header {
        background-color: #000000;
        padding: 32px 24px;
        text-align: center;
        border-bottom: 1px solid #333;
      }
      .header h1 {
        color: #ffffff;
        font-size: 24px;
        margin: 0;
        font-weight: normal;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
      .content {
        padding: 32px 24px;
      }
      .content h2 {
        color: #ffffff;
        font-size: 16px;
        margin-top: 0;
        margin-bottom: 24px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .content p {
        color: #a3a3a3;
        font-size: 14px;
        line-height: 1.6;
        margin: 12px 0;
      }
      .info-box {
        background-color: #111;
        border-left: 2px solid #fff;
        padding: 16px;
        margin: 20px 0;
      }
      .info-label {
        color: #666;
        font-weight: bold;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 4px;
      }
      .info-value {
        color: #fff;
        font-size: 14px;
      }
      .button-container {
        text-align: center;
        margin: 32px 0;
      }
      .button {
        display: inline-block;
        background-color: #fff;
        color: #000;
        padding: 14px 32px;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 12px;
        font-weight: bold;
      }
      .button:hover {
        background-color: #ccc;
      }
      .footer {
        background-color: #000;
        padding: 24px;
        text-align: center;
        border-top: 1px solid #333;
      }
      .footer p {
        color: #555;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>KONTROL // SYSTEM</h1>
      </div>

      <div class="content">
        <h2>Nova Aplicação Recebida</h2>
        <p>Um novo lead solicitou acesso ao sistema.</p>

        <div class="info-box">
          <div class="info-label">Nome</div>
          <div class="info-value">${props.userName}</div>
        </div>

        <div class="info-box">
          <div class="info-label">Email</div>
          <div class="info-value"><a href="mailto:${props.userEmail}" style="color: #fff; text-decoration: none;">${props.userEmail}</a></div>
        </div>

        ${props.userInstagram ? `
        <div class="info-box">
          <div class="info-label">Instagram</div>
          <div class="info-value"><a href="https://instagram.com/${props.userInstagram.replace('@', '')}" style="color: #fff; text-decoration: none;">@${props.userInstagram.replace('@', '')}</a></div>
        </div>
        ` : ''}

        ${props.userChallenge ? `
        <div class="info-box">
          <div class="info-label">Desafio Principal</div>
          <div class="info-value">${props.userChallenge}</div>
        </div>
        ` : ''}

        <div class="button-container">
          <a href="https://khaoskontrol.com.br/admin" class="button">ACESSAR PAINEL</a>
        </div>
      </div>

      <div class="footer">
        <p>AUTHENTICATED BY KONTROL SYSTEM</p>
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
    <title>Sua aplicação foi recebida - KONTROL</title>
    <style>
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0;
        padding: 0;
        background-color: #000000;
        color: #e5e5e5;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #0c0c0c;
        border: 1px solid #333;
      }
      .header {
        background-color: #000000;
        padding: 40px 24px;
        text-align: center;
        border-bottom: 1px solid #333;
      }
      .header h1 {
        color: #ffffff;
        font-size: 32px;
        margin: 0;
        font-weight: normal;
        letter-spacing: 4px;
        text-transform: uppercase;
      }
      .content {
        padding: 40px 32px;
      }
      .greeting {
        color: #ffffff;
        font-size: 18px;
        margin-bottom: 24px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .content p {
        color: #a3a3a3;
        font-size: 14px;
        line-height: 1.8;
        margin: 16px 0;
      }
      .highlight-box {
        background-color: #111;
        border: 1px solid #333;
        padding: 24px;
        margin: 32px 0;
      }
      .highlight-title {
        color: #fff;
        font-weight: bold;
        margin: 0 0 12px 0;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .highlight-text {
        color: #ccc;
        margin: 0;
        font-size: 13px;
      }
      .steps-list {
        margin: 32px 0;
        padding: 0;
        list-style: none;
      }
      .step-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 16px;
      }
      .step-number {
        color: #fff;
        font-weight: bold;
        margin-right: 16px;
        font-size: 14px;
      }
      .step-text {
        color: #aaa;
        font-size: 13px;
      }
      .button-container {
        text-align: center;
        margin: 40px 0;
      }
      .button {
        display: inline-block;
        background-color: #fff;
        color: #000;
        padding: 16px 40px;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 12px;
        font-weight: bold;
      }
      .button:hover {
        background-color: #ccc;
      }
      .footer {
        background-color: #000;
        padding: 32px;
        text-align: center;
        border-top: 1px solid #333;
      }
      .footer p {
        color: #444;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin: 8px 0;
      }
      .footer-links a {
        color: #666;
        text-decoration: none;
        font-size: 10px;
        text-transform: uppercase;
        margin: 0 8px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>KONTROL</h1>
        <p style="font-size: 10px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: 8px;">Sistema de Gestão de Elite</p>
      </div>

      <div class="content">
        <p class="greeting">Olá, ${props.userName}</p>

        <p>Sua aplicação para acessar o ecossistema <strong>KONTROL</strong> foi recebida com sucesso. Agradecemos seu interesse em profissionalizar sua gestão.</p>

        <div class="highlight-box">
          <div class="highlight-title">Status da Solicitação</div>
          <div class="highlight-text">
            Nossa equipe de admissão analisará seu perfil nas próximas 24 horas. Entraremos em contato via WhatsApp para confirmar seus dados.
          </div>
        </div>

        <ul class="steps-list">
          <li class="step-item">
            <span class="step-number">01</span>
            <span class="step-text"><strong style="color:#fff">Análise de Perfil</strong> — Verificação de alinhamento com a metodologia.</span>
          </li>
          <li class="step-item">
            <span class="step-number">02</span>
            <span class="step-text"><strong style="color:#fff">Briefing Inicial</strong> — Entrevista rápida para entender seus objetivos.</span>
          </li>
          <li class="step-item">
            <span class="step-number">03</span>
            <span class="step-text"><strong style="color:#fff">Acesso Liberado</strong> — Configuração do seu ambiente KONTROL.</span>
          </li>
        </ul>

        <div class="button-container">
          <a href="https://wa.me/5521983604870" class="button">FALAR COM CONCIERGE</a>
        </div>

        <p style="text-align: center; font-size: 11px; color: #555;">
          Dúvidas imediatas? <a href="https://wa.me/5521983604870" style="color: #fff; text-decoration: none;">+55 21 98360-4870</a>
        </p>
      </div>

      <div class="footer">
        <p>KONTROL // KHAOS STUDIO</p>
        <p style="margin-bottom: 24px;">Copyright © 2026</p>
        <div class="footer-links">
          <a href="https://instagram.com/khaos.kontrol">Instagram</a>
          <a href="https://khaoskontrol.com.br">Website</a>
        </div>
      </div>
    </div>
  </body>
</html>
`;
