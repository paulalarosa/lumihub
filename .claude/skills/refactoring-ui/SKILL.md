---
name: refactoring-ui
description: Apply Industrial Noir design principles to Khaos Kontrol UI — black/white palette, font-serif for display, font-mono for labels, rounded-none, consistent spacing. Use when building or reviewing UI components.
---

# Refactoring UI — Khaos Kontrol Design System

## Core Principles

### Palette (strict — no exceptions)
- Background: `bg-black` / `bg-[#050505]` / `bg-background`
- Text primary: `text-white`
- Text secondary: `text-white/40` to `text-white/60`
- Borders: `border-white/10` (subtle) / `border-white/20` (visible)
- Interactive hover: `hover:border-white/40` / `hover:bg-white/[0.04]`
- Destructive only: `text-red-500` / `border-red-500/20`
- Success only: `text-green-500`
- **No cyan, no purple, no blue accents**

### Typography
- **Display / headings**: `font-serif` — italic for hero text
- **UI labels / tags / badges**: `font-mono text-[10px] uppercase tracking-widest`
- **Body text**: `font-sans font-light text-white/60`
- **Button text**: `font-mono uppercase tracking-widest text-xs`

### Shape & Borders
- All elements: `rounded-none` (no border-radius — ever)
- Cards: `border border-white/10 bg-white/[0.02]`
- Inputs: `bg-white/[0.04] border-white/10 h-10 rounded-none`
- Buttons primary: `bg-white text-black hover:bg-white/90`

### Spacing Hierarchy
- Section padding: `py-20` to `py-24`
- Card padding: `p-6` to `p-8`
- Form gap: `space-y-4`
- Grid gaps: `gap-4` (tight) / `gap-6` (standard) / `gap-8` (loose)

### Component Patterns

**Empty state:**
```tsx
<div className="text-center py-20 border border-white/5">
  <Icon className="h-8 w-8 text-white/10 mx-auto mb-4" />
  <p className="font-mono text-xs text-white/30 uppercase tracking-widest">TÍTULO</p>
  <p className="text-white/20 text-sm mt-2">Descrição concisa.</p>
</div>
```

**Data table row:**
```tsx
<tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
```

**Badge / tag:**
```tsx
<span className="font-mono text-[9px] uppercase tracking-widest border border-white/20 px-2 py-0.5 text-white/60">
  LABEL
</span>
```

**Sheet (edit panel) — preferred over Dialog for forms:**
```tsx
<SheetContent side="right" className="w-full sm:max-w-md bg-black border-l border-white/20 text-white p-0 overflow-y-auto">
```

### What NOT to do
- Never add `rounded-md`, `rounded-lg`, `rounded-xl` — always `rounded-none`
- Never use color accents (cyan, teal, indigo, purple) — only white opacity variants
- Never use `shadow-*` — flat design
- Never mix font families on the same UI element
- Never add comments explaining WHAT the code does — only WHY if non-obvious
