# Assistant Portal Architecture

This document outlines the architecture for the new Assistant Portal in Khaos Kontrol (LumiHub).

## Overview
The Assistant Portal allows Makeup Artists (Pros) to invite Assistants to collaborate on their schedule. 
- **Multi-tenancy**: One assistant can work with multiple pros.
- **Granular Access**: Assistants only see appointments they are assigned to, and only for the pros they have active access with.
- **Invite Flow**: Secure token-based invitation system.

## Schema Diagram

```mermaid
erDiagram
    auth_users ||--|| makeup_artists : "has profile"
    auth_users ||--|| assistants : "has profile"
    
    makeup_artists ||--o{ assistant_invites : "sends"
    makeup_artists ||--o{ assistant_access : "grants access"
    makeup_artists ||--o{ appointments : "owns"

    assistants ||--o{ assistant_access : "receives access"
    assistants ||--o{ appointments : "assigned to"

    assistant_invites {
        uuid id
        uuid makeup_artist_id
        string assistant_email
        string invite_token
        string status
        timestamp expires_at
    }

    assistant_access {
        uuid id
        uuid assistant_id
        uuid makeup_artist_id
        string status
    }

    appointments {
        uuid id
        uuid user_id "Pro ID"
        uuid assistant_id "Assigned Assistant"
        ...
    }
```

## Workflows

### 1. Invite Assistant
1. Pro clicks "Invite Assistant".
2. System calls `create_assistant_invite(pro_id, email)`.
3. System generates token and unique link.
4. Email is sent (by App logic) with link.

### 2. Accept Invite
1. Assistant clicks link `.../accept/{token}`.
2. User logs in or signs up.
3. System calls `accept_assistant_invite(token)`.
4. If valid:
   - Links Assistant User to `assistants` profile (creates if needed).
   - Creates `assistant_access` record linking Assistant to Pro.
   - Updates invite status to `accepted`.

### 3. View Schedule (Assistant)
1. Assistant logs in.
2. Queries `appointments`.
3. RLS Policy filters:
   - `assistant_id` matches current user's assistant profile.
   - AND `makeup_artist_id` (via Access table/Pro ID) corresponds to an active `assistant_access` record.

## Security (RLS) policies

| Table | Actor | Policy |
|-------|-------|--------|
| `makeup_artists` | Owner | View/Update own profile |
| `assistants` | Owner | View/Update own profile |
| `assistant_invites` | Pro | View own outgoing invites, Create new |
| `assistant_invites` | Assistant | View invites sent to their email |
| `assistant_access` | Pro | View/Revoke assistants they have access to |
| `assistant_access` | Assistant | View their own connections |
| `appointments` | Assistant | View assigned appointments from valid connections |

## Functions

- `accept_assistant_invite(token)`: Handles acceptance logic transactionally.
- `check_assistant_exists(email)`: Helper to check if email is already in system.
- `create_assistant_invite(pro_id, email)`: Generates invite with validation.

