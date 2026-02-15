-- Inserir templates padrão para cada usuário (ou criar função para isso)
CREATE OR REPLACE FUNCTION create_default_templates(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO message_templates (user_id, name, trigger_type, channel, subject, body, variables)
  VALUES
  (
    p_user_id,
    'Confirmação de Reserva',
    'booking_confirmation',
    'whatsapp',
    NULL,
    'Olá {client_name}! 👋' || chr(10) || chr(10) ||
    'Sua reserva está confirmada! 🎉' || chr(10) || chr(10) ||
    '📅 Data: {event_date}' || chr(10) ||
    '🕐 Horário: {event_time}' || chr(10) ||
    '📍 Local: {event_location}' || chr(10) || chr(10) ||
    'Estou muito animada para deixar você ainda mais linda! ✨' || chr(10) || chr(10) ||
    'Qualquer dúvida, é só chamar!' || chr(10) || chr(10) ||
    '{makeup_artist_name}' || chr(10) ||
    '{makeup_artist_phone}',
    '["client_name", "event_date", "event_time", "event_location", "makeup_artist_name", "makeup_artist_phone"]'::jsonb
  ),
  (
    p_user_id,
    'Lembrete 7 Dias Antes',
    'reminder_7days',
    'whatsapp',
    NULL,
    'Oi {client_name}! ' || chr(10) || chr(10) ||
    'Falta só 1 semana para o grande dia! 🗓️' || chr(10) || chr(10) ||
    'Vamos confirmar alguns detalhes?' || chr(10) ||
    '📅 {event_date} às {event_time}' || chr(10) ||
    '📍 {event_location}' || chr(10) || chr(10) ||
    '💄 DICAS PRÉ-EVENTO:' || chr(10) ||
    '✓ Durma bem na semana' || chr(10) ||
    '✓ Beba bastante água' || chr(10) ||
    '✓ Evite mudanças na pele (novos produtos)' || chr(10) ||
    '✓ Chegue com o rosto limpo e hidratado' || chr(10) || chr(10) ||
    'Nos vemos em breve! ✨',
    '["client_name", "event_date", "event_time", "event_location"]'::jsonb
  ),
  (
    p_user_id,
    'Lembrete 24h Antes',
    'reminder_24h',
    'whatsapp',
    NULL,
    '🎊 AMANHÃ É O GRANDE DIA! 🎊' || chr(10) || chr(10) ||
    'Oi {client_name}!' || chr(10) || chr(10) ||
    'Últimas orientações:' || chr(10) ||
    '✅ Lave o cabelo hoje (não amanhã)' || chr(10) ||
    '✅ Vista uma blusa com abertura frontal' || chr(10) ||
    '✅ Não use creme no rosto amanhã' || chr(10) ||
    '✅ Chegue 5min antes do horário' || chr(10) || chr(10) ||
    '📍 Endereço: {event_location}' || chr(10) ||
    '🕐 Horário: {event_time}' || chr(10) || chr(10) ||
    'Mal posso esperar! 💖',
    '["client_name", "event_date", "event_time", "event_location"]'::jsonb
  ),
  (
    p_user_id,
    'Pedido de Avaliação',
    'post_event_review',
    'whatsapp',
    NULL,
    'Oi {client_name}! 💕' || chr(10) || chr(10) ||
    'Espero que seu dia tenha sido MARAVILHOSO! ' || chr(10) || chr(10) ||
    '🌟 Sua opinião é muito importante!' || chr(10) || chr(10) ||
    'Pode avaliar nosso serviço?' || chr(10) ||
    '{review_link}' || chr(10) || chr(10) ||
    'E se tiver fotos, adoraria ver! 📸' || chr(10) ||
    'Posso compartilhar no meu Instagram? ' || chr(10) || chr(10) ||
    'Beijos! 💋' || chr(10) ||
    '{makeup_artist_name}',
    '["client_name", "review_link", "makeup_artist_name"]'::jsonb
  ),
  (
    p_user_id,
    'Reengajamento 30 Dias',
    'reengagement_30days',
    'whatsapp',
    NULL,
    'Oi {client_name}! ' || chr(10) || chr(10) ||
    'Saudades! 💕' || chr(10) || chr(10) ||
    'Já faz um mês desde {event_type}... Como você está?' || chr(10) || chr(10) ||
    'Estou com algumas novidades:' || chr(10) ||
    '✨ {current_promotion}' || chr(10) || chr(10) ||
    'Que tal marcarmos um make mais casual? Café? Aniversário?' || chr(10) || chr(10) ||
    'Me chama quando quiser! ' || chr(10) ||
    '{makeup_artist_name}',
    '["client_name", "event_type", "current_promotion", "makeup_artist_name"]'::jsonb
  );
END;
$$;

-- Trigger to create default templates for new users (optional but recommended)
CREATE OR REPLACE FUNCTION trigger_create_default_templates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_default_templates(NEW.id);
  RETURN NEW;
END;
$$;

-- Attach to auth.users if possible, otherwise application layer handles it
-- For now we just keep the function available for manual calling or app hook
