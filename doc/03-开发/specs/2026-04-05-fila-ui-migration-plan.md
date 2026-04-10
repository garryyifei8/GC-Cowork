# Fila UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the entire UI to Fila template's design language — flat cards, Outfit font, lighter text colors, tinted table headers, square badges — while keeping the green `#00C875` brand primary.

**Architecture:** Token-first cascade approach. Change CSS variables and constants first (Tasks 1-2), then layout shell (Task 3), then shared atomic widgets (Task 4). After that, view widgets, pages, and card components can be updated in parallel batches (Tasks 5-9). All changes are pure styling — zero functional/API logic changes.

**Tech Stack:** React 19, Tailwind CSS 4, Vite, TypeScript. Google Fonts (Outfit). No new dependencies.

**Spec:** `doc/03-开发/specs/2026-04-04-fila-ui-migration-design.md`

---

## Task 1: Design Tokens (`index.css`)

**Files:**
- Modify: `frontend/src/index.css`

This is the foundation. All `var(--color-*)` references across the codebase will automatically pick up these changes.

- [ ] **Step 1: Update Google Fonts import**

Change line 1 from:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```
to:
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
```

- [ ] **Step 2: Update color tokens in `@theme` block**

Replace the entire `@theme { ... }` block (lines 8-55) with:

```css
@theme {
  /* Primary: Avocado green (keep brand) */
  --color-primary: #00C875;
  --color-primary-light: #33d48f;
  --color-primary-dark: #00a35e;
  --color-primary-50: #e6faf0;
  --color-primary-100: #b3f0d4;
  --color-primary-tint: #E6FAF0;

  /* Secondary: Fila purple */
  --color-secondary: #796DF6;
  --color-secondary-light: #9589f8;

  /* Semantic (Fila-aligned) */
  --color-success: #2ED47E;
  --color-success-light: #6ee09e;
  --color-success-50: #edfcf2;
  --color-warning: #FFB264;
  --color-warning-light: #ffc88a;
  --color-warning-50: #fff8f0;
  --color-danger: #E74C3C;
  --color-danger-light: #f09080;
  --color-danger-50: #fef2f2;
  --color-info: #00CAE3;
  --color-info-light: #4dd8ea;
  --color-info-50: #ecfeff;

  --color-avocado: #00C875;
  --color-pink: #e50073;

  /* Dark mode */
  --color-dark-bg: #1a1d2e;
  --color-dark-surface: #252840;
  --color-dark-surface-hover: #2f3352;
  --color-dark-border: #3a3d56;
  --color-dark-text: #f1f5f9;
  --color-dark-text-secondary: #9699a7;

  /* Light mode (Fila-aligned) */
  --color-light-bg: #EFF3F9;
  --color-light-surface: #ffffff;
  --color-light-surface-hover: #f4f6fc;
  --color-light-border: #E8ECF4;
  --color-light-text: #475569;
  --color-light-text-secondary: #919AA3;

  /* Table */
  --color-table-header: #E6FAF0;

  --font-sans: 'Outfit', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-heading: 'Outfit', ui-sans-serif, system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`
Expected: Zero errors, successful build.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: migrate design tokens to Fila palette (Outfit font, lighter text, flat cards)"
```

---

## Task 2: Color Constants (`constants.ts`)

**Files:**
- Modify: `frontend/src/utils/constants.ts`

Update all hardcoded color maps to align with the new Fila-derived semantic colors.

- [ ] **Step 1: Update STAGE_COLORS**

Replace the entire `STAGE_COLORS` object (lines 26-58) with:

```typescript
export const STAGE_COLORS: Record<string, string> = {
  '立项': '#0086C0',
  '投标': '#2ED47E',
  '签约': '#796DF6',
  '设计': '#00C875',
  '采购': '#FFB264',
  '施工/实施': '#E74C3C',
  '验收': '#FF7A59',
  '结算': '#00CAE3',
  '归档': '#919AA3',
  initiation: '#0086C0',
  bidding: '#2ED47E',
  contract: '#796DF6',
  design: '#00C875',
  procurement: '#FFB264',
  construction: '#E74C3C',
  acceptance: '#FF7A59',
  settlement: '#00CAE3',
  archived: '#919AA3',
  '开发': '#0F79F3',
  '测试': '#FF7A59',
  '调研': '#00CAE3',
  '编制': '#796DF6',
  '申报': '#FFB264',
  '评审': '#E74C3C',
  development: '#0F79F3',
  testing: '#FF7A59',
  research: '#00CAE3',
  compilation: '#796DF6',
  application: '#FFB264',
  review: '#E74C3C',
};
```

- [ ] **Step 2: Update RISK_LEVEL_COLORS**

Replace lines 60-65:

```typescript
export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: '#2ED47E',
  medium: '#FFB264',
  high: '#E74C3C',
  critical: '#9B1B30',
};
```

- [ ] **Step 3: Update STATUS_COLORS**

Replace lines 74-79:

```typescript
export const STATUS_COLORS: Record<string, string> = {
  active: '#2ED47E',
  risk: '#E74C3C',
  planning: '#00CAE3',
  completed: '#919AA3',
};
```

- [ ] **Step 4: Update TASK_STATUS_COLORS**

Replace lines 88-94:

```typescript
export const TASK_STATUS_COLORS: Record<string, string> = {
  todo: '#C4C4C4',
  in_progress: '#FFB264',
  review: '#796DF6',
  done: '#2ED47E',
  blocked: '#E74C3C',
};
```

- [ ] **Step 5: Update PRIORITY_COLORS**

Replace lines 104-108:

```typescript
export const PRIORITY_COLORS: Record<string, string> = {
  high: '#E74C3C',
  medium: '#FFB264',
  low: '#00CAE3',
};
```

- [ ] **Step 6: Update EMPLOYEE_STATUS_COLORS**

Replace lines 150-154:

```typescript
export const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  active: '#2ED47E',
  on_leave: '#FFB264',
  resigned: '#919AA3',
};
```

- [ ] **Step 7: Update ATTENDANCE_STATUS_COLORS**

Replace lines 163-168:

```typescript
export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  normal: '#2ED47E',
  late: '#FFB264',
  absent: '#E74C3C',
  leave: '#0086C0',
};
```

- [ ] **Step 8: Update APPROVAL_STATUS_COLORS**

Replace lines 183-187:

```typescript
export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending: '#FFB264',
  approved: '#2ED47E',
  rejected: '#E74C3C',
};
```

- [ ] **Step 9: Update EXPENSE_STATUS_COLORS**

Replace lines 209-215:

```typescript
export const EXPENSE_STATUS_COLORS: Record<string, string> = {
  draft: '#919AA3',
  submitted: '#0086C0',
  approved: '#2ED47E',
  rejected: '#E74C3C',
  paid: '#00C875',
};
```

- [ ] **Step 10: Update INVOICE_STATUS_COLORS**

Replace lines 223-227:

```typescript
export const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: '#FFB264',
  paid: '#2ED47E',
  overdue: '#E74C3C',
};
```

- [ ] **Step 11: Update PROCESS_STATUS_COLORS**

Replace lines 387-391:

```typescript
export const PROCESS_STATUS_COLORS: Record<string, string> = {
  normal: '#2ED47E',
  issue: '#E74C3C',
  resolved: '#0F79F3',
};
```

- [ ] **Step 12: Update PROCUREMENT_STATUS_COLORS**

Replace lines 351-359:

```typescript
export const PROCUREMENT_STATUS_COLORS: Record<string, string> = {
  planning: '#919AA3',
  bidding: '#0086C0',
  evaluating: '#796DF6',
  contracted: '#0F79F3',
  delivering: '#FFB264',
  inspecting: '#FF7A59',
  completed: '#2ED47E',
};
```

- [ ] **Step 13: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`
Expected: Zero errors.

- [ ] **Step 14: Commit**

```bash
git add frontend/src/utils/constants.ts
git commit -m "style: update all color constants to Fila palette"
```

---

## Task 3: Sidebar & Header (`AppLayout.tsx`)

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx`

Key changes: Fila-style sidebar active (tinted bg, no left border), taller header (68px), borderless search bar.

- [ ] **Step 1: Update sidebar container**

Find the sidebar outer div with `bg-white border-r border-[#E8E8E8]` and update border color:
- `border-[#E8E8E8]` → `border-[#E8ECF4]`

- [ ] **Step 2: Update logo area**

Find the logo container with `h-[56px]` and `border-b border-[#E8E8E8]`:
- `h-[56px]` → `h-[82px]`
- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `text-[#333]` → `text-light-text` (logo text)
- `text-[#6C7688]` → `text-light-text-secondary` (subtitle)
- Add `p-[25px]` padding if not present

- [ ] **Step 3: Update section header labels**

Find section headers with `text-xs font-semibold uppercase text-light-text`:
- Change to: `text-[12px] font-medium uppercase text-light-text-secondary tracking-wider`

- [ ] **Step 4: Update nav item styling — CRITICAL**

This is the biggest sidebar change. Find the nav item active/inactive classes.

**Inactive nav item** — find pattern with `border-l-[3px] border-transparent`:
- Remove `border-l-[3px] border-transparent`
- Change to: `rounded-lg mx-2`
- Text: `text-[14px]` → `text-[15px]`
- Color: `text-[#6C7688]` → `text-light-text`
- Hover: `hover:bg-[#F5F6F8]` → `hover:bg-[#F4F6FC] hover:rounded-lg`

**Active nav item** — find pattern with `bg-[#F5F6F8] text-light-text border-l-[3px] border-primary`:
- Remove `border-l-[3px] border-primary`
- Change `bg-[#F5F6F8]` → `bg-primary-tint`
- Add `rounded-lg mx-2`
- Text color: keep `text-primary` (green)

**Icon styling:**
- Default: change icon color from `#919AA3`/`#6C7688` to `text-light-text`
- Active: keep `text-primary`
- Size: ensure `w-[17px] h-[17px]` or `size={17}`

- [ ] **Step 5: Update settings button**

Find settings button:
- `hover:bg-[#F0F2F8]` → `hover:bg-[#F4F6FC]`
- `text-[#333]` → `text-light-text`

- [ ] **Step 6: Update header bar**

Find header with `h-[55px]` and `border-b border-[#E8E8E8]`:
- `h-[55px]` → `h-[68px]`
- `border-b border-[#E8E8E8]` → `border-b border-white` (invisible border)

- [ ] **Step 7: Update header elements**

- Page title: `text-[16px] font-semibold` → `text-[18px] font-medium`
- Hamburger: `hover:bg-[#F0F2F8] text-[#6C7688]` → `hover:bg-[#F4F6FC] text-light-text`
- Search bar: `bg-[#F5F6FA] border border-[#E8E8E8]` → `bg-[#EFF3F9] border-none rounded-lg h-[42px]`
- Search text: `text-[#6C7688]` → `text-light-text-secondary`
- AI button inactive: `text-[#6C7688] hover:bg-[#F0F2F8]` → `text-light-text hover:bg-[#F4F6FC]`
- Notification button inactive: same change
- `border-2 border-primary/20` on avatar → keep as-is

- [ ] **Step 8: Update content area padding**

If main content area has insufficient padding, ensure `p-[25px]` or equivalent on the content wrapper.

- [ ] **Step 9: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/layout/AppLayout.tsx
git commit -m "style: migrate sidebar and header to Fila design (tinted active, 68px header)"
```

---

## Task 4: Atomic Widgets

**Files:**
- Modify: `frontend/src/widgets/atomic/StatCard.tsx`
- Modify: `frontend/src/widgets/atomic/StatusBadge.tsx`
- Modify: `frontend/src/widgets/atomic/DataTable.tsx`
- Modify: `frontend/src/widgets/atomic/ProgressBar.tsx`
- Modify: `frontend/src/widgets/atomic/SearchBar.tsx`
- Modify: `frontend/src/widgets/atomic/ViewSwitcher.tsx`

These shared components affect the entire app. Each sub-step below is for one file.

### 4a: StatCard.tsx

- [ ] **Step 1: Update StatCard container**

Find card container with `shadow-[0_0_35px_0_rgba(104,134,177,0.15)]`:
- Remove `shadow-[0_0_35px_0_rgba(104,134,177,0.15)]`
- Change `rounded-[5px]` → `rounded-[10px]`
- Change `border-[#E7E8EB]` → `border-[#E8ECF4]`
- Keep `bg-white border p-5`

- [ ] **Step 2: Remove decorative SVG**

Find the SVG element with `opacity-[0.07]` (the decorative circle pattern). Delete the entire SVG block and its container.

- [ ] **Step 3: Update icon position and size**

Find icon container `w-10 h-10 rounded-full`:
- Change to `w-[50px] h-[50px] rounded-full`
- Position: move to right side of the card (flex layout: justify-between)
- Background: use `10%` opacity of the icon color → `style={{ backgroundColor: \`${iconColor}1A\` }}`

- [ ] **Step 4: Update typography**

- Label: `text-[13px] text-[#6C7688]` → `text-[15px] text-light-text-secondary`
- Value: `text-[22px] font-bold` → `text-[26px] font-medium`
- Title (card title): ensure `text-[18px] font-medium text-light-text`

- [ ] **Step 5: Update trend badge**

Find trend badge with `bg-[#27AE6015]` / `bg-[#E5393515]`:
- Positive: `bg-[#2ED47E1A] text-[#2ED47E]`
- Negative: `bg-[#E74C3C1A] text-[#E74C3C]`
- Change from pill badge to inline text: `text-[15px] font-medium` (remove rounded-full, reduce padding)

### 4b: StatusBadge.tsx

- [ ] **Step 6: Update badge shape and size**

Find size classes:
- SM: `px-2.5 py-1 text-xs` → `px-2.5 py-[3px] text-[15px]`
- MD: `px-2.5 py-1 text-[13px]` → `px-3 py-[3px] text-[15px]`
- Border-radius: `rounded-[5px]` → `rounded-[3px]`

- [ ] **Step 7: Update badge variant colors**

Replace the variants object:

```typescript
const variants: Record<string, string> = {
  success:   'bg-[#2ED47E1A] text-[#2ED47E]',
  warning:   'bg-[#FFB2641A] text-[#FFB264]',
  danger:    'bg-[#E74C3C1A] text-[#E74C3C]',
  info:      'bg-[#00CAE31A] text-[#00CAE3]',
  primary:   'bg-[#00C8751A] text-[#00C875]',
  secondary: 'bg-[#796DF61A] text-[#796DF6]',
  indigo:    'bg-[#3538CD1A] text-[#3538CD]',
  orange:    'bg-[#FF7A591A] text-[#FF7A59]',
  pink:      'bg-[#DD25901A] text-[#DD2590]',
  purple:    'bg-[#9B51E01A] text-[#9B51E0]',
  teal:      'bg-[#0E93841A] text-[#0E9384]',
  default:   'bg-[#F4F6FC] text-[#919AA3]',
};
```

Note: Remove the `border-*` classes from each variant — Fila badges have no border.

### 4c: DataTable.tsx

- [ ] **Step 8: Update table container**

Find container with `shadow-[0_0_35px_0_rgba(104,134,177,0.1)]`:
- Remove `shadow-[...]`
- `rounded-lg` → `rounded-[10px]`
- `border-[#E8E8E8]` → `border-[#E8ECF4]`

Also update empty state container the same way.

- [ ] **Step 9: Update table header**

Find header row `bg-[#F5F6FA]`:
- `bg-[#F5F6FA]` → `bg-[#E6FAF0]`

Find header cells `px-4 py-3 text-[12px] font-semibold text-[#6C7688] uppercase tracking-wider border-b border-[#E8E8E8]`:
- `px-4 py-3` → `px-5 py-[18px]`
- `text-[12px] font-semibold` → `text-base font-medium`
- `text-[#6C7688]` → `text-light-text`
- Remove `uppercase tracking-wider`
- `border-[#E8E8E8]` → `border-[#E8ECF4]`

- [ ] **Step 10: Update table body cells**

Find body cells `px-4 py-3 text-[13px] text-[#333333] border-b border-[#F0F0F0]`:
- `px-4 py-3` → `px-5 py-[19px]`
- `text-[13px]` → `text-base`
- `text-[#333333]` → `text-light-text-secondary`
- `border-[#F0F0F0]` → `border-[#E8ECF4]`

Find row hover `hover:bg-[#F8F9FC]`:
- `hover:bg-[#F8F9FC]` → `hover:bg-[#F4F6FC]`

Find sort icon inactive `text-[#C4C4C4]`:
- `text-[#C4C4C4]` → `text-[#919AA3]`

### 4d: ProgressBar.tsx

- [ ] **Step 11: Update progress bar**

- Track: `bg-[#F0F0F0] rounded-full` → `bg-[#F4F6FC] rounded-none`
- Fill: `rounded-full` → `rounded-none`
- Size SM: `h-2` → `h-[5px]`
- Size MD: `h-3` → `h-[5px]`
- Label: `text-[12px] text-[#6C7688]` → `text-[13px] text-light-text-secondary`
- Default colors: `#EF1E1E` → `#E74C3C`, `#2F80ED` → `#00CAE3`

### 4e: SearchBar.tsx

- [ ] **Step 12: Update search bar**

- Container: `bg-white border border-[#E8E8E8] rounded-lg px-3 py-2` → `bg-[#EFF3F9] border-none rounded-lg px-4 py-2`
- Focus: `focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20` → `focus-within:ring-2 focus-within:ring-primary/20`
- Input text: `text-[13px] text-[#333333]` → `text-[15px] text-light-text`
- Placeholder: `placeholder:text-[#B6BBC4]` → `placeholder:text-[#919AA3]`
- Search icon: `text-[#6C7688]` → `text-[#919AA3]`
- Filter button: `border border-[#E8E8E8] bg-white text-[13px] text-[#333333]` → `border border-[#E8ECF4] bg-white text-[15px] text-light-text`
- Dropdown: `border-[#E8E8E8]` → `border-[#E8ECF4]`
- Dropdown item inactive: `text-[#333333] hover:bg-[#F5F6FA]` → `text-light-text hover:bg-[#F4F6FC]`

### 4f: ViewSwitcher.tsx

- [ ] **Step 13: Update view switcher**

- Container: `bg-[#F5F6FA]` → `bg-[#EFF3F9]`
- Button inactive: `text-[13px] text-[#6C7688] hover:text-[#333333]` → `text-[15px] text-light-text-secondary hover:text-light-text`
- Button active: `text-[13px] text-primary` → `text-[15px] text-primary`

- [ ] **Step 14: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`

- [ ] **Step 15: Commit**

```bash
git add frontend/src/widgets/atomic/
git commit -m "style: migrate atomic widgets to Fila design (flat cards, square badges, Fila typography)"
```

---

## Task 5: View Widgets — Task Views

**Files:**
- Modify: `frontend/src/widgets/views/TaskKanban.tsx`
- Modify: `frontend/src/widgets/views/TaskList.tsx`
- Modify: `frontend/src/widgets/views/CalendarView.tsx`

These are the most complex view widgets. Apply Fila patterns throughout.

### 5a: TaskKanban.tsx

- [ ] **Step 1: Update card wrapper**

Find task card: `bg-white border border-[#E7E8EB] rounded-[5px] shadow-[0_1px_1px_0_rgba(0,0,0,0.05)]`:
- Remove `shadow-[0_1px_1px_0_rgba(0,0,0,0.05)]`
- `rounded-[5px]` → `rounded-[10px]`
- `border-[#E7E8EB]` → `border-[#E8ECF4]`
- Hover: remove `hover:shadow-[0_0_35px_0_rgba(104,134,177,0.15)]` → `hover:border-primary/30`

- [ ] **Step 2: Update hardcoded colors**

Apply these replacements across the file:
- `#E53935` → `#E74C3C` (danger)
- `#E2B93B` → `#FFB264` (warning)
- `#27AE60` → `#2ED47E` (success)
- `#E7E8EB` → `#E8ECF4` (border)
- `#6C7688` → use class `text-light-text-secondary`
- `#B6BBC4` → `#919AA3` (placeholder)
- `#F5F6F8` → `#F4F6FC` (bg)
- `#F0F0F0` → `#E8ECF4` (divider)
- `#00C875` → keep (primary)

- [ ] **Step 3: Update tint backgrounds for badges**

Find badge tint backgrounds:
- `#F4FBF7` → `#2ED47E1A`
- `#FEFBF5` → `#FFB2641A`
- `#FEF4F4` → `#E74C3C1A`

- [ ] **Step 4: Update typography**

- `text-[13px]` → `text-[15px]` (body text)
- `text-[14px]` → `text-[15px]` (body text)
- `font-semibold` on card titles → `font-medium`
- `font-bold` on stat values → `font-medium`

### 5b: TaskList.tsx

- [ ] **Step 5: Update card/row wrapper**

Find row: `border border-[#E7E8EB] rounded-[5px]`:
- `rounded-[5px]` → `rounded-[10px]`
- `border-[#E7E8EB]` → `border-[#E8ECF4]`

- [ ] **Step 6: Update all hardcoded colors**

Apply these replacements across the entire file:
- `#E53935` → `#E74C3C`
- `#E2B93B` → `#FFB264`
- `#FDAB3D` → `#FFB264`
- `#2F80ED` → `#00CAE3`
- `#579BFC` → `#0F79F3`
- `#0086C0` → keep
- `#00D3C7` → `#00CAE3`
- `#9B51E0` → `#796DF6`
- `#676879` → `#919AA3`
- `#6C7688` → use class `text-light-text-secondary`
- `#E7E8EB` → `#E8ECF4`
- `#F5F6F8` → `#F4F6FC`
- `#F0F0F0` → `#E8ECF4`
- `#F8F9FC` → `#F4F6FC`
- `#B6BBC4` → `#919AA3`
- `#9CA3AF` → `#919AA3`

- [ ] **Step 7: Update dropdown shadow**

Find `shadow-[0_4px_20px_0_rgba(0,0,0,0.12)]`:
- Change to `shadow-lg`

- [ ] **Step 8: Update typography**

- `text-[13px]` → `text-[15px]`
- `text-[14px]` → `text-[15px]`
- `text-[18px]` → `text-[18px]` (keep section headers)
- `font-semibold` on group headers → `font-medium`
- `font-bold` → `font-medium` (except truly bold emphasis)

### 5c: CalendarView.tsx

- [ ] **Step 9: Update container**

Find `rounded-xl`:
- `rounded-xl` → `rounded-[10px]`

- [ ] **Step 10: Update hardcoded colors**

- `#E53935` → `#E74C3C`
- `#FDAB3D` → `#FFB264`
- `#579BFC` → `#0F79F3`
- `#C4C4C4` → keep

- [ ] **Step 11: Update tooltip shadow**

`shadow-xl` → `shadow-lg`

- [ ] **Step 12: Update typography**

- `text-[12px]` → `text-[13px]`
- `text-[15px]` → keep
- `font-semibold` → `font-medium` (card titles)

- [ ] **Step 13: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`

- [ ] **Step 14: Commit**

```bash
git add frontend/src/widgets/views/TaskKanban.tsx frontend/src/widgets/views/TaskList.tsx frontend/src/widgets/views/CalendarView.tsx
git commit -m "style: migrate task view widgets to Fila design"
```

---

## Task 6: View Widgets — Project Views

**Files:**
- Modify: `frontend/src/widgets/views/ProjectTable.tsx`
- Modify: `frontend/src/widgets/views/ProjectKanban.tsx`
- Modify: `frontend/src/widgets/views/GanttChart.tsx`
- Modify: `frontend/src/widgets/views/StagePipeline.tsx`

### 6a: ProjectTable.tsx

- [ ] **Step 1: Update card wrapper**

Find: `bg-white border border-[#E8E8E8] rounded-lg`:
- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `rounded-lg` → `rounded-[10px]`

- [ ] **Step 2: Update table header**

Find: `bg-[#F5F6FA]` (table header):
- → `bg-[#E6FAF0]`

Find header cell text styles and update:
- `text-[#6C7688]` → `text-light-text`
- font to `font-medium`
- padding to `py-[18px] px-5`

- [ ] **Step 3: Update hardcoded colors**

- `#E2445C` → `#E74C3C`
- `#E8E8E8` → `#E8ECF4`
- `#F5F6FA` (non-header) → `#F4F6FC`
- `#333` → use `text-light-text` class
- `#6C7688` → use `text-light-text-secondary` class

### 6b: ProjectKanban.tsx

- [ ] **Step 4: Update colors**

- `#E53935` → `#E74C3C`
- `#676879` → `#919AA3`
- `#E8E8E8` → `#E8ECF4`
- `#F0F2F8` → `#F4F6FC`
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`
- `#9CA3AF` → `#919AA3`

- [ ] **Step 5: Update card radius**

`rounded-lg` on card containers → `rounded-[10px]`

### 6c: GanttChart.tsx

- [ ] **Step 6: Update container**

Find `rounded-xl`:
- → `rounded-[10px]`
- `border-gray-200` → `border-[#E8ECF4]`

- [ ] **Step 7: Update colors**

- `#E53935` → `#E74C3C`
- `#676879` → `#919AA3`
- `#6BBF59` → `#2ED47E`
- `#9CA3AF` → `#919AA3`

### 6d: StagePipeline.tsx

- [ ] **Step 8: Update container**

Find `border border-[#E8E8E8] rounded-lg`:
- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `rounded-lg` → `rounded-[10px]`

- [ ] **Step 9: Update colors**

- `#6BBF59` → `#2ED47E`
- `#9B51E0` → `#796DF6`
- `#FDAB3D` → `#FFB264`
- `#E53935` → `#E74C3C`
- `#37B4E3` → `#00CAE3`
- `#676879` → `#919AA3`
- `#E8E8E8` → `#E8ECF4`
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`
- `#94a3b8` → `#919AA3`
- `#cbd5e1` → `#E8ECF4`

- [ ] **Step 10: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`

- [ ] **Step 11: Commit**

```bash
git add frontend/src/widgets/views/ProjectTable.tsx frontend/src/widgets/views/ProjectKanban.tsx frontend/src/widgets/views/GanttChart.tsx frontend/src/widgets/views/StagePipeline.tsx
git commit -m "style: migrate project view widgets to Fila design"
```

---

## Task 7: View Widgets — Analytics & Other

**Files:**
- Modify: `frontend/src/widgets/views/RiskHeatmap.tsx`
- Modify: `frontend/src/widgets/views/ResourceHeatmap.tsx`
- Modify: `frontend/src/widgets/views/BudgetOverview.tsx`
- Modify: `frontend/src/widgets/views/ActivityFeed.tsx`
- Modify: `frontend/src/widgets/views/StaffDirectory.tsx`
- Modify: `frontend/src/widgets/views/ProcurementTable.tsx`
- Modify: `frontend/src/widgets/views/TaskDonut.tsx`
- Modify: `frontend/src/widgets/views/ProjectProgress.tsx`

### Global pattern for all files in this task:

**Card wrapper updates** (apply to all files that have these patterns):
- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `rounded-lg` → `rounded-[10px]` (on main container)
- `rounded-xl` → `rounded-[10px]` (on main container)
- Remove any `shadow-[...]` on main containers
- `#333` → use `text-light-text`
- `#6C7688` → use `text-light-text-secondary`
- `#676879` → `#919AA3`
- `font-semibold` on card titles → `font-medium`

### 7a: RiskHeatmap.tsx

- [ ] **Step 1: Update colors**

- `#E53935` → `#E74C3C`
- `#FDAB3D` → `#FFB264`
- `#FFD166` → `#FFD166` (keep — unique midrange yellow)
- `#6BBF59` → `#2ED47E`
- `border-gray-200` → `border-[#E8ECF4]`
- Remove `shadow-md` on hover, `shadow-lg` on tooltip → `shadow-lg` only on tooltip

### 7b: ResourceHeatmap.tsx

- [ ] **Step 2: Update colors**

- `rgba(0,200,117,...)` heatmap gradients: keep as-is (these derive from primary green)
- `#065F46`, `#064E3B` → keep (dark green text on green bg)
- `rgba(229,57,53,0.15)` → `rgba(231,76,60,0.15)` (new danger)
- `#E53935` → `#E74C3C`
- `#9CA3AF` → `#919AA3`
- `#D1D5DB` → `#E8ECF4`
- `border-gray-200` → `border-[#E8ECF4]`

### 7c: BudgetOverview.tsx

- [ ] **Step 3: Update container**

- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `rounded-lg` → `rounded-[10px]`
- `#333` → `text-light-text`

### 7d: ActivityFeed.tsx

- [ ] **Step 4: Same as BudgetOverview**

### 7e: StaffDirectory.tsx

- [ ] **Step 5: Update colors**

- `#E8E8E8` → `#E8ECF4`
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`
- `#9CA3AF` → `#919AA3`

### 7f: ProcurementTable.tsx

- [ ] **Step 6: Update table styling**

If this file has its own table header styling (not using DataTable):
- Add `bg-[#E6FAF0]` to thead
- Update header text to `text-base font-medium text-light-text`
- Cell text: `text-base text-light-text-secondary`
- Cell padding: `py-[19px] px-5`
- `#E8E8E8` → `#E8ECF4`
- `text-[10px]` → `text-[13px]` minimum
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`

### 7g: TaskDonut.tsx

- [ ] **Step 7: Update container and colors**

- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `rounded-lg` → `rounded-[10px]`
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`

### 7h: ProjectProgress.tsx

- [ ] **Step 8: Update colors**

- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `rounded-lg` → `rounded-[10px]`
- `#E2445C` → `#E74C3C`
- `#FDAB3D` → `#FFB264`
- `#676879` → `#919AA3`
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`

- [ ] **Step 9: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`

- [ ] **Step 10: Commit**

```bash
git add frontend/src/widgets/views/RiskHeatmap.tsx frontend/src/widgets/views/ResourceHeatmap.tsx frontend/src/widgets/views/BudgetOverview.tsx frontend/src/widgets/views/ActivityFeed.tsx frontend/src/widgets/views/StaffDirectory.tsx frontend/src/widgets/views/ProcurementTable.tsx frontend/src/widgets/views/TaskDonut.tsx frontend/src/widgets/views/ProjectProgress.tsx
git commit -m "style: migrate analytics view widgets to Fila design"
```

---

## Task 8: Core Pages

**Files:**
- Modify: `frontend/src/pages/Overview.tsx`
- Modify: `frontend/src/pages/Tasks.tsx`
- Modify: `frontend/src/pages/ProjectDetail.tsx`
- Modify: `frontend/src/pages/ProjectsDashboard.tsx`
- Modify: `frontend/src/pages/MyDaily.tsx`

### Global pattern for all page files:

Apply across every file:
- `shadow-[0_0_35px_0_rgba(104,134,177,0.1)]` → remove
- `shadow-[0_0_35px_0_rgba(104,134,177,0.15)]` → remove
- `shadow-[0_0_35px_0_rgba(104,134,177,0.2)]` → remove
- `rounded-lg` on card containers → `rounded-[10px]`
- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `bg-[#F5F6FA]` → `bg-[#EFF3F9]`
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`
- `font-semibold` on card/section titles → `font-medium`
- `font-bold` on stat numbers → `font-medium`

### 8a: Overview.tsx

- [ ] **Step 1: Update KPI card wrappers**

Find all card containers and apply global pattern above.

- [ ] **Step 2: Update gradient section (if present)**

`bg-gradient-to-r from-blue-500 to-indigo-600` → `bg-gradient-to-r from-primary to-primary-dark` (keep green brand)

- [ ] **Step 3: Update table headers in overview**

Any `bg-[#F5F6FA]` on thead → `bg-[#E6FAF0]`

### 8b: Tasks.tsx

- [ ] **Step 4: Update filter/stat pills**

Find stat pills and update:
- `rounded-full` → `rounded-[3px]`
- `bg-[#1a1f36]` (batch action bar) → `bg-[#475569]`

- [ ] **Step 5: Update all task page colors per global pattern**

### 8c: ProjectDetail.tsx

- [ ] **Step 6: Update all card wrappers, tables, badges per global pattern**

This is the largest page. Key targets:
- All `border-[#E8E8E8]` → `border-[#E8ECF4]`
- Tab headers: ensure `font-medium` not `font-semibold`
- Table headers: `bg-[#E6FAF0]`
- KPI grid cards: remove shadows, `rounded-[10px]`

### 8d: ProjectsDashboard.tsx

- [ ] **Step 7: Update per global pattern**

### 8e: MyDaily.tsx

- [ ] **Step 8: Update per global pattern**

- [ ] **Step 9: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pages/Overview.tsx frontend/src/pages/Tasks.tsx frontend/src/pages/ProjectDetail.tsx frontend/src/pages/ProjectsDashboard.tsx frontend/src/pages/MyDaily.tsx
git commit -m "style: migrate core pages to Fila design"
```

---

## Task 9: Secondary Pages & Card Components

**Files:**
- Modify: `frontend/src/pages/FinanceDashboard.tsx`
- Modify: `frontend/src/pages/HRDashboard.tsx`
- Modify: `frontend/src/pages/BiddingDashboard.tsx`
- Modify: `frontend/src/pages/KnowledgeBase.tsx`
- Modify: `frontend/src/pages/LegalDashboard.tsx`
- Modify: `frontend/src/pages/AuditDashboard.tsx`
- Modify: `frontend/src/pages/SupervisionDashboard.tsx`
- Modify: `frontend/src/components/cards/ActionCard.tsx`
- Modify: `frontend/src/components/cards/AlertCard.tsx`
- Modify: `frontend/src/components/cards/ChartCard.tsx`
- Modify: `frontend/src/components/cards/DataCard.tsx`
- Modify: `frontend/src/components/cards/FileCard.tsx`
- Modify: `frontend/src/components/cards/KanbanMiniCard.tsx`
- Modify: `frontend/src/components/cards/ProgressCard.tsx`
- Modify: `frontend/src/components/cards/ReportCard.tsx`
- Modify: `frontend/src/components/cards/TableCard.tsx`
- Modify: `frontend/src/components/cards/TaskListCard.tsx`

### 9a: Secondary pages

- [ ] **Step 1: Apply global pattern to all secondary pages**

Same replacements as Task 8 global pattern. For each page:
- Remove shadows
- `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `rounded-lg` → `rounded-[10px]` on card containers
- `bg-[#F5F6FA]` → `bg-[#EFF3F9]`
- Color updates: `#E53935` → `#E74C3C`, `#FDAB3D` → `#FFB264`, `#E2B93B` → `#FFB264`, `#2F80ED` → `#00CAE3`
- Text: `#333` → `text-light-text`, `#6C7688` → `text-light-text-secondary`
- Font: `font-semibold` → `font-medium` on card titles
- Table headers: `bg-[#E6FAF0]` where applicable

### 9b: Card components

- [ ] **Step 2: Update all card components**

All card components use the pattern `bg-white border border-light-border border-l-4 border-l-[COLOR] rounded-lg`.

For each card file:
- `rounded-lg` → `rounded-[10px]`
- Left accent border colors:
  - `#FF642E` → `#FF7A59`
  - `#A25DDC` → `#796DF6`
  - `#579BFC` → `#0F79F3`
  - `#2F80ED` → `#00CAE3`
  - `#00C875` → keep
- Any internal `#E53935` → `#E74C3C`
- Any `#FDAB3D` → `#FFB264`
- `font-semibold` → `font-medium` on titles

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/FinanceDashboard.tsx frontend/src/pages/HRDashboard.tsx frontend/src/pages/BiddingDashboard.tsx frontend/src/pages/KnowledgeBase.tsx frontend/src/pages/LegalDashboard.tsx frontend/src/pages/AuditDashboard.tsx frontend/src/pages/SupervisionDashboard.tsx frontend/src/components/cards/
git commit -m "style: migrate secondary pages and card components to Fila design"
```

---

## Task 10: Remaining Components

**Files:**
- Modify: `frontend/src/components/tasks/TaskDetailModal.tsx`
- Modify: `frontend/src/components/tasks/TaskCreateDrawer.tsx`
- Modify: `frontend/src/components/ui/NotificationPanel.tsx`
- Modify: `frontend/src/components/ui/NotificationToast.tsx`
- Modify: `frontend/src/components/chat/WelcomeScreen.tsx`

- [ ] **Step 1: TaskDetailModal.tsx**

- Status/Priority selectors: update tint colors to new Fila palette
  - `${color}15` backgrounds: ensure colors are new palette values
  - `${color}30` borders: same
- `#E53935` → `#E74C3C`
- `rounded-full` on status/priority pills → `rounded-[3px]`
- `font-semibold` → `font-medium` on section labels
- Modal container: `rounded-lg` → `rounded-[10px]`
- `#E8E8E8` → `#E8ECF4` on borders
- `#6C7688` → `text-light-text-secondary`
- `#333` → `text-light-text`

- [ ] **Step 2: TaskCreateDrawer.tsx**

Same pattern:
- `#E8E8E8` → `#E8ECF4`
- `rounded-lg` → `rounded-[10px]` on drawer container
- Input borders: `border-[#E8E8E8]` → `border-[#E8ECF4]`
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`

- [ ] **Step 3: NotificationPanel.tsx**

- Panel container: `rounded-lg` → `rounded-[10px]`, remove shadows
- `#E8E8E8` → `#E8ECF4`
- `#333` → `text-light-text`
- `#6C7688` → `text-light-text-secondary`

- [ ] **Step 4: NotificationToast.tsx**

- Toast container: `rounded-lg` → `rounded-[10px]`
- Color updates per Fila palette

- [ ] **Step 5: WelcomeScreen.tsx**

- `#6C7688` → `text-light-text-secondary`
- `#333` → `text-light-text`

- [ ] **Step 6: Verify build**

Run: `cd frontend && npx tsc --noEmit && npx vite build`

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/tasks/ frontend/src/components/ui/ frontend/src/components/chat/WelcomeScreen.tsx
git commit -m "style: migrate modals, drawers, notifications to Fila design"
```

---

## Task 11: Final Verification & Visual QA

- [ ] **Step 1: Full TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 2: Full production build**

Run: `cd frontend && npx vite build`
Expected: Successful build.

- [ ] **Step 3: Visual verification — Dashboard**

Open `http://localhost:5173/` and verify:
- Outfit font loaded (check `document.fonts`)
- Stat cards: flat (no shadow), 10px radius, 26px numbers, 18px titles
- Body background: `#EFF3F9` (slightly bluer than before)
- Text colors: headings `#475569`, body `#919AA3`
- Cards: no shadows, `#E8ECF4` borders

- [ ] **Step 4: Visual verification — Sidebar & Header**

- Sidebar active item: green tint bg `#E6FAF0` + green text, NO left border
- Menu items: 15px, `#475569`
- Header: 68px height, invisible bottom border
- Search bar: `#EFF3F9` bg, no border

- [ ] **Step 5: Visual verification — Tasks page**

Open `http://localhost:5173/tasks`:
- List view: row cards `rounded-[10px]`, text `#919AA3`
- Kanban view: flat cards, updated badge colors
- Calendar view: updated priority colors
- Badges: 3px radius (not pills), 15px font

- [ ] **Step 6: Visual verification — Project detail**

Open `http://localhost:5173/projects/proj-001`:
- Table headers: `#E6FAF0` green tint background
- Pipeline: updated stage colors
- All tabs: consistent Fila styling

- [ ] **Step 7: Commit final state**

If any visual fixes were needed during QA, commit them:
```bash
git add -A
git commit -m "style: visual QA fixes for Fila migration"
```

---

## Parallelization Guide

```
Task 1 (tokens) ──→ Task 2 (constants) ──→ Task 3 (layout)
                                              ↓
                            ┌─────────────────┼──────────────────┐
                            ↓                 ↓                  ↓
                    Task 4 (atomic)    Task 5 (task views)   Task 6 (project views)
                            ↓                 ↓                  ↓
                            └─────────────────┼──────────────────┘
                                              ↓
                            ┌─────────────────┼──────────────────┐
                            ↓                 ↓                  ↓
                    Task 7 (analytics)  Task 8 (core pages)  Task 9 (secondary)
                            ↓                 ↓                  ↓
                            └─────────────────┼──────────────────┘
                                              ↓
                                    Task 10 (components)
                                              ↓
                                    Task 11 (verification)
```

**Sequential dependencies:** Tasks 1→2→3 must be sequential (tokens cascade).

**Parallel batches:**
- Batch A: Tasks 4, 5, 6 (after Task 3)
- Batch B: Tasks 7, 8, 9 (after Batch A or independently)
- Task 10 after Batch B
- Task 11 last

**Recommended subagent grouping for maximum parallelism:**
- Agent 1: Task 4 (atomic widgets)
- Agent 2: Task 5 (task views)
- Agent 3: Task 6 (project views)
- Agent 4: Task 7 (analytics views)
- Agent 5: Task 8 (core pages)
- Agent 6: Task 9 (secondary pages + cards)
- Agent 7: Task 10 (remaining components)
