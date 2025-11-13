## Scope

- Audit and optimize memoization and re-renders for `components/Sidebar.tsx` and `components/ui/**`.
- Target high-churn areas: route-driven Sidebar, un-memoized context/provider values, and widely used presentational primitives.

## Findings (Key References)

- Route-driven re-renders and derived values:
  - `usePathname` updates on navigation: `components/Sidebar.tsx:41`, `components/Sidebar.tsx:79`.
  - Derived `activeRoute` recomputed each render: `components/Sidebar.tsx:42–45`, `components/Sidebar.tsx:80–83`.
  - Inline `onClick={() => setOpen((prev) => !prev)}` causes new closures: `components/Sidebar.tsx:110`.
- Broad provider updates:
  - `SidebarProvider` context value includes many dependencies causing frequent updates: `components/ui/sidebar.tsx:119–130`.
- Non-memoized provider value:
  - `Carousel` provider object recreated each render (consumers always re-render): `components/ui/carousel.tsx:123–149`.
- Form contexts re-created per render:
  - `FormFieldContext` and `FormItemContext` values not memoized: `components/ui/form.tsx:38–41`, `components/ui/form.tsx:82–85`.
- Widely used primitives without `React.memo`:
  - `Button` forwardRef, no memo: `components/ui/button.tsx:46–57`.
  - `TabsList`, `TabsTrigger`, `TabsContent` wrappers: `components/ui/tabs.tsx:10–52`.
  - `Table`, `TableRow` and peers: `components/ui/table.tsx:5–66`.
  - Heavy UI: `ChartTooltipContent`, `ChartLegendContent` not memoized: `components/ui/chart.tsx:105–257`, `components/ui/chart.tsx:261–317`.

## Changes to Implement

- Sidebar.tsx (client):
  - Memoize derived values:
    - `activeRoute = useMemo(() => findActiveRoute(pathname), [pathname])` to stabilize across renders.
    - Optionally precompute `routes` map output with `useMemo` keyed by `activeRoute.href`.
  - Memoize event handlers:
    - `const handleRouteClick = useCallback(() => setOpen(false), [])` replace inline `onClick` at `components/Sidebar.tsx:110`.
  - Wrap components with memo:
    - `export default React.memo(DesktopSidebar)`; `export const MobileSidebar = React.memo(MobileSidebar)` to ignore parent re-renders when props are stable.
- UI Sidebar Provider:
  - Reduce context churn:
    - Keep `setOpen` and `toggleSidebar` memoized (already at `components/ui/sidebar.tsx:77–99`).
    - Split mobile-only state into a separate context to prevent unrelated consumer re-renders; or narrow `contextValue` dependencies and memoize sub-values.
- Carousel provider:
  - Memoize provider value with `useMemo` (depend on `api`, callbacks, state flags) so consumers don’t re-render unnecessarily.
  - Optional: split context into "controls" (callbacks + flags) and "data" (ref/API) for finer-grained updates.
- Form contexts:
  - Wrap `value={{ name }}` and `value={{ id }}` in `useMemo` so identity is stable when inputs don’t change.
- UI primitives (low-risk memo):
  - Wrap pure forwardRef components with `React.memo`:
    - `Button` (`components/ui/button.tsx:46–57`), `TabsList/Trigger/Content` (`components/ui/tabs.tsx:10–52`), `Table` and rows (`components/ui/table.tsx:5–66`).
  - Heavy UI components:
    - `ChartTooltipContent` and `ChartLegendContent` memoized to avoid redundant work when props are unchanged.

## Verification

- Add re-render counters (development-only) to `Sidebar`, `Button`, `TabsTrigger`, and `ChartTooltipContent` to confirm reductions.
- Use React DevTools Profiler to compare commit counts before/after on navigation and common interactions.
- Smoke test critical flows: navigation, open/close sidebar, carousel scrolling, forms typing.

## Rollout

- Implement low-risk memoization first (`Sidebar.tsx` callbacks/derived values, memo wrappers for primitives).
- Then provider value memoization for `carousel` and `form`.
- Consider context splitting in `ui/sidebar.tsx` if profiler still shows broad consumer re-renders.

## Risks & Mitigations

- Stale closures: ensure `useMemo`/`useCallback` deps are accurate.
- Over-memoization: keep memo on pure components; avoid memo where props are frequently changing or rely on referential equality for effects.
- API changes from context splitting: apply incrementally and update consumers.

If you approve, I’ll implement the changes above with careful, file-scoped updates and provide profiler screenshots/notes to validate the improvements.
