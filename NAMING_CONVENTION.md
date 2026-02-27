# LumiHub - Naming Convention

## Regra Principal

**Código-fonte e lógica em INGLÊS. UI/texto visível ao utilizador em PORTUGUÊS.**

## Detalhes

| Camada | Idioma | Exemplos |
|---|---|---|
| Tabelas DB | Inglês | `wedding_clients`, `events`, `projects` |
| Colunas DB | Inglês | `full_name`, `event_date`, `payment_status` |
| Variáveis | Inglês | `clientData`, `eventDate`, `isLoading` |
| Funções | Inglês | `fetchClients()`, `handleSubmit()` |
| Interfaces/Types | Inglês | `ClientCardProps`, `EventFormData` |
| Componentes | Inglês | `EventCard`, `CheckoutDialog` |
| Rotas URL | Português | `/clientes`, `/agenda`, `/projetos` |
| Textos UI | Português | `"Criar Evento"`, `"Salvar"` |
| Toasts/Alertas | Português | `"Evento criado com sucesso!"` |
| Nomes de ficheiros | Inglês | `ClientService.ts`, `useEvents.ts` |

## Proibido

- Variáveis em português: ~~`nomeCliente`~~ → `clientName`
- Misturar idiomas no mesmo identifier: ~~`getClienteById`~~ → `getClientById`

## Aceitável

- Termos de domínio em português quando não há tradução direta: `noivas`, `making_of`
- Slugs de URL em português (SEO): `/agenda`, `/clientes`
