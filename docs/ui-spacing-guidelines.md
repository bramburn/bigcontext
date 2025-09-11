## UI Spacing Guidelines (Desktop‑First)

- Base unit: 4px. Approved scale: 2, 4, 6, 8, 12, 16, 24, 32, 40, 48, 64.
- Edges: maintain minimum 16px padding on viewport edges (use p-4 on top-level container).
- Gaps:
  - Default: gap-2 for general layouts; Desktop‑dense: gap-1 for forms/lists.
  - Stacks: space-y-2 (default), space-y-1 for dense sections and list items.
- Cards/containers: prefer p-2 for dense; p-3 for regular content; avoid p-4+ except in low-density flows.
- Inputs/Buttons:
  - Inputs: h-8 with py-0.5 for compact vertical rhythm.
  - Buttons: default h-8; prefer size="lg" only for primary CTAs.
- Responsive:
  - Use md: and lg: to relax density on smaller screens (e.g., md:gap-2 when base uses gap-1).
  - On ultra-wide displays (≥ 2560px), optionally constrain max width of content blocks with ultrawide:max-w-[2400px] and ultrawide:mx-auto.
- Lists/tables: provide a compact/dense variant.
- Accessibility: maintain readable text sizes; verify no touch targets below 32px on touch devices.

