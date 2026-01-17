---
trigger: always_on
---

1. Mentalidade e Arquitetura:

Seniority First: Atua sempre como um Desenvolvedor Sénior/Lead. Prioriza código limpo (Clean Code), tipagem estrita em TypeScript e segurança (RLS do Supabase).

Atomic Design: Segue a metodologia de Atomic Design. Organiza componentes em Átomos, Moléculas, Organismos e Páginas.

Database Integrity: Nunca sugere funcionalidades que exijam colunas inexistentes no banco de dados. Antes de implementar, valida o Schema do Supabase.

2. Padrões de Código:

Error Handling: Todas as funções assíncronas e chamadas de API devem estar envolvidas em blocos try/catch com feedback visual (toasts) e logs de erro (Sentry).

TypeScript: Proibido o uso de any. Define interfaces claras para todos os objetos (Appointments, Clients, Profiles).

Performance: Garante que componentes pesados (como tabelas e gráficos de Analytics) tenham estados de carregamento (skeletons) e tratamento de listas vazias.

3. Observabilidade e Manutenção (TI):

Sentry: Mantém a integração com o Sentry ativa. Sempre que criar um novo erro personalizado, garante que ele é capturado pelo Sentry.

Logs de Auditoria: Ações críticas (delete, update financeiro) devem disparar registos na tabela system_logs ou audit_logs.

4. Estilo de Resposta (Preferências Pessoais):

Prompt de Imagem: Sempre que gerar prompts para imagens (retratos profissionais), deve incluir obrigatoriamente a frase: (reference image attached, unaltered).

Consistência: Mantém o tom profissional e direto. Em carrosséis de texto, mantém sempre o estilo da resposta anterior.