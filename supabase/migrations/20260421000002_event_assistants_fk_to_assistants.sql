-- Modelo PIN-only pra assistentes: FK de `event_assistants.assistant_id`
-- aponta pra `assistants.id`, não mais pra `profiles.id`. Isso permite
-- atribuir eventos a assistentes convidadas via PIN (user_id = null,
-- sem profile em auth.users).
--
-- Contexto: `event_assistants` tem 0 rows em prod (conferido 2026-04-21),
-- então a migração é segura — nenhum dado precisa ser remapeado.
--
-- Decisão produto (Paula, 2026-04-21): "o acesso da assistentes é mais
-- limitado e específico focado em ver os atendimentos que as maquiadoras
-- marcaram aquela assistente no dia". Se a assistente quiser virar
-- maquiadora, faz o cadastro normal — não via invite token. Portanto o
-- fluxo auth-based (AcceptInvitePage + assistant_invites) vira dead code.

BEGIN;

-- Derruba a FK antiga (ref profiles.id) e a constraint genérica
-- "assistants" (nome equivocado que também aponta profiles.id pelo que
-- vimos em information_schema — mas é na prática a mesma FK, com nome
-- errado histórico).
ALTER TABLE public.event_assistants
  DROP CONSTRAINT IF EXISTS event_assistants_assistant_id_fkey;

ALTER TABLE public.event_assistants
  DROP CONSTRAINT IF EXISTS assistants;

-- Nova FK: assistant_id → public.assistants(id) com CASCADE.
-- Quando a assistente é deletada, suas atribuições em eventos somem.
ALTER TABLE public.event_assistants
  ADD CONSTRAINT event_assistants_assistant_id_fkey
  FOREIGN KEY (assistant_id)
  REFERENCES public.assistants(id)
  ON DELETE CASCADE;

COMMIT;
