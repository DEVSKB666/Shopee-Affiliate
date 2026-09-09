# Admin Dashboard Page Overrides

> **PROJECT:** Support Link
> **Page Type:** Dashboard / Data View
> Rules here **override** `MASTER.md` for `/admin` layout density only. Color tokens now match the global dark MASTER.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1400px
- **Grid:** KPI cards 2–3 columns; data tables full width with horizontal scroll under 768px
- **Shell:** Sticky sidebar on desktop, compact chip nav on mobile
- **Density:** High — compact table rows, 8–12px cell padding rhythm

### Color Overrides

Admin is **dark OLED** so white-on-white cards are gone. Keep Flame as the only filled CTA.

| Role | Hex | Token |
|------|-----|-------|
| Background | `#071018` | `--canvas` |
| Card | `#102433` | `--paper-2` |
| Foreground | `#F4F7FB` | `--ink` |
| Muted text | `#C5D0DC` | `--mute` (≥4.5:1 on canvas) |
| Border | `#2C4558` | `--border` |
| CTA | `#EE4D2D` | `--flame` |
| Success | `#3DCE9A` | `--jade` |
| Wait | `#F0C14A` | `--gold` |

### Component Overrides

- KPI cards: tinted surface + left accent, numeric value + text label (color is not the only signal)
- Data tables: sticky header, zebra rows, hover highlight, `overflow-x-auto`
- Destructive delete: confirm dialog (Esc, focus trap, focus return) + toast. Never delete on first click
- Gold filled controls use `--teak` text, not `--ink` (ink is light in admin)
- No overshoot motion on tables

### Typography Overrides

Keep Anuphan / Taviraj / IBM Plex Mono from Master. Tabular nums on KPI values and clocks.
