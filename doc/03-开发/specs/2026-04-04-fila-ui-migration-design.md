# Fila UI Design Migration Spec

> Reference: https://templates.envytheme.com/fila/project-management.html
> Date: 2026-04-04
> Decision: Keep green primary `#00C875`, adopt Fila's layout/typography/component design language
> Scope: Full migration — tokens, sidebar, header, all pages, all components, all widgets

---

## 1. Design Token Layer (`index.css`)

### 1.1 Color Palette

| Token | Current | New | Source |
|---|---|---|---|
| `--color-primary` | `#00C875` | `#00C875` | Keep (brand) |
| `--color-primary-light` | `#33d48f` | `#33d48f` | Keep |
| `--color-primary-dark` | `#00a35e` | `#00a35e` | Keep |
| `--color-primary-50` | `#e6faf0` | `#e6faf0` | Keep |
| `--color-primary-100` | `#b3f0d4` | `#b3f0d4` | Keep |
| `--color-secondary` | `#2E37A4` | `#796DF6` | Fila purple |
| `--color-secondary-light` | `#4b53b8` | `#9589f8` | Lighter purple |
| `--color-light-bg` | `#F5F6FA` | `#EFF3F9` | Fila body bg |
| `--color-light-surface` | `#ffffff` | `#ffffff` | Same |
| `--color-light-surface-hover` | `#f0f2f8` | `#f4f6fc` | Fila light bg |
| `--color-light-border` | `#E8E8E8` | `#E8ECF4` | Fila-style blue-gray border |
| `--color-light-text` | `#1a1f36` | `#475569` | Fila heading color (slate-600) |
| `--color-light-text-secondary` | `#6b7280` | `#919AA3` | Fila body text |
| NEW `--color-primary-tint` | — | `#E6FAF0` | Green 10% tint (sidebar active, table header) |
| NEW `--color-table-header` | — | `#E6FAF0` | Table header bg |
| `--color-success` | `#27AE60` | `#2ED47E` | Fila green |
| `--color-success-light` | `#6fcf8a` | `#6ee09e` | Lighter |
| `--color-warning` | `#E2B93B` | `#FFB264` | Fila orange |
| `--color-warning-light` | `#f0d06e` | `#ffc88a` | Lighter |
| `--color-danger` | `#E53935` | `#E74C3C` | Fila red |
| `--color-danger-light` | `#ff7575` | `#f09080` | Lighter |
| `--color-info` | `#2F80ED` | `#00CAE3` | Fila teal |
| `--color-info-light` | `#66a3f2` | `#4dd8ea` | Lighter |

### 1.2 Typography

- **Font Family**: `Inter` → `Outfit` (Google Fonts import)
- **Root font-size**: Keep `15px`
- **Heading weight**: `600` → `500` (Fila uses fw-500)
- **Heading scale**:
  - Card title / H3: `18px`, weight `500`
  - Stat number / H2: `26px`, weight `500`
  - Section header: `15px`, weight `500`
  - Body text: `15px`, weight `400`
  - Small text / caption: `13px`

### 1.3 Card Style

| Property | Current | New |
|---|---|---|
| `box-shadow` | `0 0 35px rgba(104,134,177,0.15)` | `none` |
| `border-radius` | `8px` (rounded-lg) | `10px` |
| `border` | `1px solid #E8E8E8` | `1px solid #E8ECF4` |
| `padding` | varies (p-4/p-5) | `20px` (p-5) |

### 1.4 Badge Style

| Property | Current | New |
|---|---|---|
| `border-radius` | pill (`rounded-full`) | `3px` (`rounded-sm`) |
| `padding` | `px-2.5 py-1` | `3px 10px` (`px-2.5 py-0.5`) |
| `font-size` | `text-xs` (12px) | `15px` (`text-[15px]`) |
| Style | tinted bg + color text | Same pattern, 10% opacity bg |

### 1.5 Progress Bar

| Property | Current | New |
|---|---|---|
| Height | varies | `5px` (h-[5px]) |
| Border-radius | rounded | `0` (square ends) |
| Track bg | `#e5e7eb` | `#F4F6FC` |

---

## 2. Sidebar (`AppLayout.tsx`)

### 2.1 Structure

```
┌──────────────────────────────┐
│ [Logo]  Avocado              │ ← 25px padding, 82px height
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ MAIN                         │ ← 12px uppercase gray label
│  📊 Dashboard      ← active │ ← green bg tint + green text
│  ✓  Tasks                    │
│  📅 Daily                    │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ PROJECT MANAGEMENT           │
│  📁 Projects                 │
│  💰 Finance                  │
│  🏗️ Bidding                  │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ ENTERPRISE                   │
│  👥 HR                       │
│  📖 Knowledge                │
│ ...                          │
└──────────────────────────────┘
```

### 2.2 Sidebar Style Changes

| Element | Current | New (Fila-style) |
|---|---|---|
| Width | 260px / 70px collapsed | Same |
| Background | white | white |
| Active item | left-border green + green text | `bg-[#E6FAF0]` rounded-lg + `#00C875` text, NO left border |
| Menu text | `text-sm` (14px) `#475569` | `15px` `#475569` |
| Menu text active | `#00C875` | `#00C875` |
| Icon size | varies | `17px` |
| Icon color default | `#919AA3` | `#475569` (same as text) |
| Icon color active | `#00C875` | `#00C875` |
| Section label | `text-xs #919AA3` | `12px uppercase #919AA3 tracking-wider` |
| Item padding | `px-3 py-2` | `px-4 py-2.5` |
| Item border-radius | none | `8px` (rounded-lg) |
| Hover | `bg-light-surface-hover` | `bg-[#F4F6FC]` rounded-lg |
| Logo padding | varies | `25px` all sides |
| Logo height | varies | `82px` |

### 2.3 Remove Project Quick-links

Current sidebar shows 6 recent projects with colored dots. This is NOT in Fila. **Decision**: Keep them but style as sub-items under "Projects" menu group with Fila's indented style.

---

## 3. Header Bar

### 3.1 Style Changes

| Element | Current | New (Fila-style) |
|---|---|---|
| Height | `55px` | `68px` |
| Background | white | white |
| Border-bottom | `1px solid #E8E8E8` | `1px solid white` (invisible) |
| Box-shadow | none | none |
| Padding | varies | `13px 25px` |
| Title font | `text-lg font-semibold` | `18px font-medium #475569` |
| Search bar | existing | `bg-[#EFF3F9] border-none rounded-lg h-[42px] px-4` |
| Action icons | existing | `20px` size, `#475569` color, hover `#00C875` |
| User avatar | existing | `40px` circle |

---

## 4. StatCard Widget

### 4.1 Layout (Fila pattern)

```
┌──────────────────────────────────────────┐
│ Card Title               18px, #475569    │
│                                           │
│ 705                  [  Icon  ]           │
│ ↑ 12% Projects this month   ○ colored bg │
│                                           │
└──────────────────────────────────────────┘
```

### 4.2 Changes

| Element | Current | New |
|---|---|---|
| Container | shadow + border | flat, 10px radius, `border: 1px solid #E8ECF4` |
| Title | varies | `18px`, `500`, `#475569` |
| Number | varies | `26px`, `500`, `#475569` |
| Trend | colored pill badge | inline text `15px` with colored arrow icon |
| Sub-text | varies | `15px`, `#919AA3` |
| Icon | left-side circle | right-side, `50px` circle, `10%` opacity colored bg |
| Decorative SVG | circle pattern | Remove (Fila has none) |

---

## 5. DataTable / Project Table

### 5.1 Table Style

| Element | Current | New (Fila-style) |
|---|---|---|
| Container | card wrapper | Same card with 10px radius |
| Header bg | white/transparent | `#E6FAF0` (primary tint) |
| Header text | `text-sm` | `16px`, `500`, `#475569` |
| Header padding | varies | `18px 20px` |
| Cell text | `text-sm` | `16px`, `400`, `#919AA3` |
| Cell padding | varies | `19px 20px` |
| Row border | `border-b` | `border-b border-[#E8ECF4]` |
| Row hover | varies | `bg-[#F4F6FC]` |
| Checkbox | existing | `18px`, `accent-color: #00C875` |
| Action icons | varies | `20px` icons, `#919AA3`, hover `#00C875` |

### 5.2 Pagination

| Element | Current | New |
|---|---|---|
| Button shape | varies | `4px` radius, `36px` square |
| Active | varies | `bg-[#00C875] text-white` |
| Inactive | varies | `bg-white border border-[#E0E0E0] text-[#919AA3]` |
| Font-size | varies | `14px` |

---

## 6. StatusBadge Widget

### 6.1 Style Changes

All variants switch from pill to slightly-rounded:

```
border-radius: 3px  (was: full/pill)
padding: 3px 10px
font-size: 15px
background: color at 10% opacity
text: color at 100%
no border
```

### 6.2 Color Mapping Update

| Status | Current Color | New Color (Fila-aligned) |
|---|---|---|
| success/done | `#27AE60` | `#2ED47E` |
| warning/in_progress | `#E2B93B` / `#FDAB3D` | `#FFB264` |
| danger/blocked | `#E53935` | `#E74C3C` |
| info/completed | `#2F80ED` | `#00CAE3` |
| primary | `#00C875` | `#00C875` (keep) |

---

## 7. Chart Colors

Fila uses: `#0F79F3` (blue), `#796DF6` (purple), `#00CAE3` (teal)

Our adaptation: `#00C875` (green), `#796DF6` (purple), `#00CAE3` (teal)

Additional chart colors when needed:
- `#FFB264` (orange)
- `#E74C3C` (red)
- `#0F79F3` (blue, as accent)

---

## 8. Page-Level Changes

### 8.1 Overview (Dashboard)

- Stat cards: Adopt Fila 4-column grid layout with new StatCard style
- Charts: Update colors to new palette
- Activity feed, risk cards: Apply new card/text styles
- "Projects Overview" section header: `18px, 500, #475569` with "View All >" link

### 8.2 Tasks Page

- Filter bar: Apply new badge style (3px radius, 15px font)
- ViewSwitcher: Style as Fila-like toggle buttons
- Task list/kanban/calendar: Inherit new card, badge, text styles
- Batch action bar: `bg-[#475569]` (Fila heading color for dark accent)

### 8.3 ProjectDetail

- Tab navigation: Fila-style underline tabs
- Stage pipeline: Use new progress bar style (5px, square)
- All sub-sections: New card, table, badge styles
- Procurement table, budget table: New table header bg

### 8.4 All Other Pages (Finance, HR, Bidding, Knowledge, Legal, Audit, etc.)

- Apply new token-based styles automatically via CSS variable changes
- Tables: New header bg, cell padding
- Cards: Flat style, 10px radius
- Badges: 3px radius, 15px font

---

## 9. Constants Update (`constants.ts`)

### 9.1 Status Colors

Update all color constants to Fila palette:

| Constant | Key Changes |
|---|---|
| `TASK_STATUS_COLORS` | `in_progress: #FFB264`, `done: #2ED47E`, `blocked: #E74C3C` |
| `PRIORITY_COLORS` | `high: #E74C3C`, `medium: #FFB264`, `low: #00CAE3` |
| `STAGE_COLORS` | Update to Fila-aligned palette |
| `STATUS_COLORS` | `active: #2ED47E`, `risk: #E74C3C`, `planning: #00CAE3` |
| `RISK_LEVEL_COLORS` | Align with new semantic tokens |
| All others | Align with new `success/warning/danger/info` values |

---

## 10. Replacement Rules Summary

| Pattern | Current | New |
|---|---|---|
| Font family | Inter | Outfit |
| Card shadow | `shadow-[0_0_35px...]` | Remove (no shadow) |
| Card radius | `rounded-lg` (8px) | `rounded-[10px]` |
| Card padding | `p-4` / varies | `p-5` (20px) |
| Badge radius | `rounded-full` | `rounded-sm` (3px) |
| Badge font | `text-xs` (12px) | `text-[15px]` |
| Table header bg | white | `bg-[#E6FAF0]` |
| Table header text | `text-sm` | `text-base font-medium` |
| Table cell text | `text-sm` | `text-base text-[#919AA3]` |
| Table cell padding | varies | `py-[19px] px-5` |
| Heading color | `text-light-text` (was #1a1f36) | `text-light-text` (now #475569) |
| Body text color | `text-light-text-secondary` (was #6b7280) | `text-light-text-secondary` (now #919AA3) |
| Stat number | varies | `text-[26px] font-medium` |
| Card title | varies | `text-[18px] font-medium` |
| Progress bar height | varies | `h-[5px]` |
| Progress bar radius | rounded | `rounded-none` |
| Sidebar active | left-border + green text | `bg-primary-tint rounded-lg` + green text |
| Header height | `55px` | `68px` |
| Search input | bordered | `bg-[#EFF3F9] border-none rounded-lg` |
| `#27AE60` (success) | → | `#2ED47E` |
| `#E2B93B` (warning) | → | `#FFB264` |
| `#E53935` (danger) | → | `#E74C3C` |
| `#2F80ED` (info) | → | `#00CAE3` |
| `#2E37A4` (secondary) | → | `#796DF6` |

---

## 11. Files Affected

### Token Layer (2 files)
- `frontend/src/index.css` — Design tokens, font import, card/badge base styles
- `frontend/src/utils/constants.ts` — All color constant maps

### Layout (1 file)
- `frontend/src/components/layout/AppLayout.tsx` — Sidebar + Header

### Atomic Widgets (6 files)
- `frontend/src/widgets/atomic/StatCard.tsx`
- `frontend/src/widgets/atomic/StatusBadge.tsx`
- `frontend/src/widgets/atomic/DataTable.tsx`
- `frontend/src/widgets/atomic/ProgressBar.tsx`
- `frontend/src/widgets/atomic/SearchBar.tsx`
- `frontend/src/widgets/atomic/ViewSwitcher.tsx`

### View Widgets (~15 files)
- `TaskKanban.tsx`, `TaskList.tsx`, `CalendarView.tsx`
- `ProjectTable.tsx`, `ProjectKanban.tsx`
- `GanttChart.tsx`, `StagePipeline.tsx`
- `RiskHeatmap.tsx`, `ResourceHeatmap.tsx`
- `BudgetOverview.tsx`, `ActivityFeed.tsx`
- `StaffDirectory.tsx`, `ProcurementTable.tsx`
- `TaskDonut.tsx`, `ProjectProgress.tsx`

### Pages (~12 files)
- `Overview.tsx`, `Tasks.tsx`, `ProjectDetail.tsx`
- `ProjectsDashboard.tsx`, `MyDaily.tsx`
- `FinanceDashboard.tsx`, `HRDashboard.tsx`
- `BiddingDashboard.tsx`, `KnowledgeBase.tsx`
- `LegalDashboard.tsx`, `AuditDashboard.tsx`
- `SupervisionDashboard.tsx`

### Card Components (~10 files)
- All `components/cards/*.tsx`

### Other Components
- `TaskDetailModal.tsx`, `TaskCreateDrawer.tsx`
- `NotificationPanel.tsx`, `NotificationToast.tsx`

**Estimated total: ~46 files, ~800+ line changes**

---

## 12. Verification

1. `npx tsc --noEmit` — zero errors
2. `npx vite build` — successful build
3. Browser verification:
   - `/` — Dashboard stat cards flat, Outfit font, new color palette
   - `/tasks` — List/kanban/calendar views with new badge/table styles
   - `/projects/proj-001` — Tabs, pipeline, tables with Fila style
   - Sidebar — Green tint active highlight, no left border
   - Header — 68px height, borderless search, proper spacing
