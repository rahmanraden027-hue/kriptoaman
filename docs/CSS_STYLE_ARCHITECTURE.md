# KriptoAman CSS style architecture

## Current release-safe layering

The application currently loads the following style layers in `src/main.jsx`, in order:

1. `src/index.css`
2. `src/styles/workspace-polish.css`
3. `src/styles/admin-suite.css`
4. `src/styles/final-ui-2026.css`
5. `src/styles/final-ui-v2.css`
6. `src/styles/final-ui-v3.css`
7. `src/styles/final-ui-v4.css`
8. `src/styles/final-ui-v5.css`
9. `src/styles/final-ui-v6.css`
10. `src/styles/final-ui-v7.css`
11. `src/styles/final-ui-v8.css`
12. `src/styles/final-ui-v9.css`
13. `src/styles/world-class-ui.css`

`world-class-ui.css` is intentionally last because it contains the current global shell, command surfaces, responsive navigation, safe-area, accessibility, and reduced-motion overrides.

## Safety rule

Do not add `final-ui-v10.css`, `final-ui-v11.css`, or another versioned override file. New shared visual work should go into an existing semantic layer, preferably `world-class-ui.css`, or into a component-local class/module when the change is isolated.

The current versioned layers are treated as legacy compatibility layers until visual regression coverage is available. Removing or reordering them without screenshot/browser validation can change cascade precedence and cause regressions across mobile, desktop, admin, market, portfolio, wallet, or security views.

## Consolidation plan

Consolidation should be incremental:

1. Inventory selectors that are repeated across versioned files.
2. Identify which declaration wins under the current import order.
3. Move only the winning declaration into the semantic destination layer.
4. Validate 360px, 390px, tablet, and desktop layouts before deleting the old declaration.
5. Remove an old stylesheet only when all of its effective declarations have been migrated or proven unused.
6. Run release tests and build after each consolidation batch.

## Release gates

The release contract tests verify that `world-class-ui.css` remains the final style layer and that no new `final-ui-vN.css` layer is silently introduced. CI also lints the global shell and recently modernized international-facing surfaces.

This approach intentionally favors stability over aggressive deletion until browser-level visual regression testing is in place.
