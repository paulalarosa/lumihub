# TypeScript Refactoring Guide

## Overview
Systematic guide to eliminate all `any` types and improve type safety across the codebase.

## Current Status
- **Total `any` types**: 185 (down from 192)
- **Fixed**: 9 types
- **Remaining**: 185 types

## Files with Most `any` Types

Run this to identify problem files:
```bash
for file in $(grep -r "\bany\b" src/ --include="*.ts" --include="*.tsx" -l); do
  count=$(grep -o "\bany\b" "$file" | wc -l)
  echo "$count $file"
done | sort -rn | head -20
```

## Systematic Replacement Strategy

### Phase 1: Error Handlers (Easy Wins)
Replace `catch (error: any)` with `catch (error)` or proper error types.

```typescript
// ❌ Before
try {
  // ...
} catch (error: any) {
  console.error(error.message);
}

// ✅ After
try {
  // ...
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

### Phase 2: API Responses
Use Supabase generated types or custom response types.

```typescript
// ❌ Before
const { data, error } = await supabase.from('clients').select();
const clients: any[] = data || [];

// ✅ After
import { Client } from '@/types';
const { data, error } = await supabase.from('clients').select();
const clients: Client[] = data || [];
```

### Phase 3: Component Props
Define explicit prop interfaces.

```typescript
// ❌ Before
function MyComponent(props: any) {
  return <div>{props.title}</div>;
}

// ✅ After
interface MyComponentProps {
  title: string;
  description?: string;
}

function MyComponent({ title, description }: MyComponentProps) {
  return <div>{title}</div>;
}
```

### Phase 4: Event Handlers
Use React's built-in event types.

```typescript
// ❌ Before
const handleClick = (e: any) => {
  e.preventDefault();
};

// ✅ After
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
};
```

## Common Patterns

### Supabase RPC Responses
```typescript
// Define RPC response type
interface CreateInviteResponse {
  success: boolean;
  invite_link?: string;
  invite_id?: string;
  error?: string;
  existing_assistant?: boolean;
}

// Use in component
const { data } = await supabase.rpc('create_assistant_invite', {
  p_makeup_artist_id: makeupArtistId,
  p_assistant_email: email
});

const response = data as CreateInviteResponse;
if (response.success) {
  // ...
}
```

### Form Data
```typescript
// Use types from api.types.ts
import { EventFormData } from '@/types';

const handleSubmit = (data: EventFormData) => {
  // data is fully typed
};
```

### Unknown vs Any
```typescript
// ❌ Never use any
const data: any = JSON.parse(jsonString);

// ✅ Use unknown and type guards
const data: unknown = JSON.parse(jsonString);
if (typeof data === 'object' && data !== null && 'id' in data) {
  // Now TypeScript knows data has 'id'
}
```

## ESLint Configuration

Add to `.eslintrc.json`:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-return": "warn"
  }
}
```

## Verification

### Check Type Safety
```bash
# Run TypeScript compiler in check mode
npx tsc --noEmit

# Should show 0 errors when complete
```

### Count Remaining `any` Types
```bash
grep -r "\bany\b" src/ --include="*.ts" --include="*.tsx" | wc -l
```

## Priority Files

Based on usage and impact, prioritize these files:

1. **High Priority** (Core functionality):
   - `src/contexts/AuthContext.tsx`
   - `src/features/clients/pages/ClientsPage.tsx`
   - `src/components/agenda/EventDialog.tsx`
   - `src/features/projects/pages/ProjectDetailsPage.tsx`

2. **Medium Priority** (Features):
   - `src/features/portal/`
   - `src/features/financial/`
   - `src/features/assistants/`

3. **Low Priority** (UI Components):
   - `src/components/ui/`
   - `src/components/settings/`

## Progress Tracking

Update `task.md` after each batch of fixes:
```markdown
- [x] Fixed error handlers (X files)
- [x] Fixed API responses (X files)
- [ ] Fixed component props (X files)
- [ ] Fixed event handlers (X files)
```

## Common Pitfalls

### 1. Don't Over-Type
```typescript
// ❌ Too specific
const status: "pending" | "approved" | "rejected" = data.status as "pending" | "approved" | "rejected";

// ✅ Use database types
import { Payment } from '@/types';
const status: Payment['status'] = data.status;
```

### 2. Use Type Guards
```typescript
// ❌ Unsafe
const value = data.value as string;

// ✅ Safe
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

if (isString(data.value)) {
  // value is string here
}
```

### 3. Avoid Type Assertions
```typescript
// ❌ Dangerous
const client = data as Client;

// ✅ Validate
import { z } from 'zod';

const ClientSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  // ...
});

const client = ClientSchema.parse(data);
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
