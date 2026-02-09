# Supabase Database Structure

## Overview
Khaos Kontrol uses Supabase (PostgreSQL) as the backend database with Row Level Security (RLS) for multi-tenant data isolation.

## Core Tables

### User Management
| Table | Description |
|-------|-------------|
| `profiles` | User profiles linked to `auth.users` |
| `user_roles` | User role assignments (admin, user, etc.) |
| `user_integrations` | External integrations (Google Calendar, etc.) |

### Clients & Projects
| Table | Description |
|-------|-------------|
| `wedding_clients` | Client records with bride portal access |
| `projects` | Project records linked to clients |
| `briefings` | Project briefing documents |
| `contracts` | Client contracts with digital signatures |

### Events & Calendar
| Table | Description |
|-------|-------------|
| `events` | Calendar events and appointments |
| `event_assistants` | Many-to-many: events ↔ assistants |
| `appointments` | Legacy appointments (consider merging with events) |

### Financial
| Table | Description |
|-------|-------------|
| `transactions` | Income and expense records |
| `invoices` | Client invoices |
| `wallets` | User wallet accounts |
| `payouts` | Payout requests |

### Team Management
| Table | Description |
|-------|-------------|
| `assistants` | Assistant invitations and registrations |
| `team_members` | Team member relationships |
| `team_invites` | Pending team invitations |

### Services
| Table | Description |
|-------|-------------|
| `services` | Service catalog |
| `project_services` | Services linked to projects |

### System
| Table | Description |
|-------|-------------|
| `system_config` | Application configuration |
| `system_logs` | System event logs |
| `analytics_logs` | User analytics events |

## Row Level Security (RLS)

All tables have RLS enabled. Common patterns:

### Owner Access
```sql
CREATE POLICY "Users own data" ON table_name
USING (auth.uid() = user_id);
```

### Admin Access
```sql
CREATE POLICY "Admins full access" ON table_name
USING (public.is_admin());
```

### Public Portal Access
```sql
CREATE POLICY "Portal read" ON table_name
FOR SELECT TO anon
USING (true);
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `get_bride_dashboard_data(uuid, text)` | Fetch bride portal data with PIN validation |
| `validate_bride_pin(uuid, text)` | Validate bride access PIN |
| `handle_new_user()` | Trigger: create profile on user signup |
| `is_admin()` | Check if current user is admin |

## Migrations

Location: `/supabase/migrations/`

Naming convention: `YYYYMMDD_description.sql`

### Running Migrations

```bash
# Link to Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Reset database (DESTRUCTIVE!)
supabase db reset
```

## Important Notes

> ⚠️ The `clients` is a VIEW, not a table. It aliases `profiles`.

> ⚠️ `wedding_clients` is the actual clients table.

> ⚠️ Always backup before running migrations in production.
