-- Adicionar novos campos de horários específicos para eventos de casamento
ALTER TABLE public.events 
ADD COLUMN arrival_time time without time zone,
ADD COLUMN making_of_time time without time zone,
ADD COLUMN ceremony_time time without time zone,
ADD COLUMN advisory_time time without time zone,
ADD COLUMN address text;

-- Migrar dados de start_time para ceremony_time (horário principal)
UPDATE public.events SET ceremony_time = start_time WHERE start_time IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.events.arrival_time IS 'Horário de chegada ao local';
COMMENT ON COLUMN public.events.making_of_time IS 'Horário do making of';
COMMENT ON COLUMN public.events.ceremony_time IS 'Horário oficial do casamento';
COMMENT ON COLUMN public.events.advisory_time IS 'Horário da assessoria';
COMMENT ON COLUMN public.events.address IS 'Endereço completo para integração GPS';