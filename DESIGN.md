# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-07-11
- Primary product surfaces: single-page, full-screen self-guided teaching experience
- Evidence reviewed: current React/CSS site, prior HyperFrames motion direction, user feedback requesting beginner clarity, Claude-like hierarchy, and a single 3D simulation asset-management case

## Brand

- Personality: patient technical tutor, warm editorial notebook, quietly confident
- Trust signals: realistic asset records, explicit command comparisons, visible inputs/outputs, concrete verification evidence
- Avoid: dense admin dashboards, neon cyberpunk styling, unexplained 3D jargon, equal-weight card grids, decorative motion without teaching value

## Product goals

- Goals: help first-time Codex users independently understand six capabilities without a presenter, by following development of a 3D simulation asset-management website
- Non-goals: building a production WebGL engine, exhaustive CLI reference, copying another product’s visual identity
- Success signals: viewers can explain which command to use for understanding, planning, long execution, browser validation, review, and debugging

## Concept model

- Page title: `Codex小技巧`
- Mermaid turns long text into a flowchart people can review together.
- Plan lists what to do, in what order, and how to check completion before coding starts.
- UltraGoal persists the project plan and progress, resumes across sessions, retries failed work, supports evidence-backed steering, and only finishes after testing and independent review pass.
- Browser completes full browser-based test flows and can create, format, fill, and verify authorized Feishu cloud documents.
- CodeReview asks independent reviewers to find problems before code is merged.
- Debugger reproduces a bug, follows the clues, proves the real cause, and prevents it from returning.
- Unifying thesis: first understand the work, then let AI do it, and finally verify the result.

## Personas and jobs

- Primary personas: developers, technical artists, simulation teams, and product teammates new to Codex/OMX
- User jobs: choose the right command, copy a useful prompt, understand expected outputs, and see why OMX adds value
- Key contexts of use: internal sharing, onboarding, live presentation, self-guided reading

## Information architecture

- Primary navigation: linear chapters with keyboard, wheel, and chapter rail
- Core screens: cover, platform brief, Mermaid, Plan, Goal comparison, Browser demo, Review comparison, Debugger, summary
- Content hierarchy: one large teaching statement → one concrete 3D asset example → one takeaway or recommendation

## Design principles

- One idea per scene; hide secondary detail until the primary point is understood
- Demonstrate every command inside the same asset lifecycle: upload → convert → preview → review → publish
- Compare native Codex and OMX with parallel structure and an explicit recommendation
- Give every capability the same four-part anatomy: what it does, when to use it, what to tell AI, and what the user receives
- Tradeoff: less reference density in exchange for beginner comprehension

## Visual language

- Color: warm paper `#F4F0E8`, ink `#282522`, muted clay `#756D65`, coral `#D97757`, sage `#78917A`, pale panels `#E9E2D7`, dark 3D viewport `#252826`
- Typography: Georgia-style editorial serif for teaching statements; Geist sans for explanation; Geist Mono for commands, asset IDs, and evidence
- Spacing/layout rhythm: generous outer margins, 8px rhythm, asymmetric 40/60 and 45/55 split frames
- Shape/radius/elevation: mostly square editorial panels, small radii on controls and asset cards, restrained shadows
- Motion: two-phase 720ms paper cover; the old page is fully covered before the scene changes, so scenes never overlap. Inside each scene, the mouse wheel advances one semantic reveal at a time; only after the final reveal does the next wheel action change chapter. Upward scrolling reverses the sequence.
- Imagery/iconography: CSS 3D model proxy, metadata panels, flow diagrams; no stock art or authored SVG

## Components

- Existing components to reuse: chapter navigation, command copy surface, progress footer
- New/changed components: capability anatomy strip, native-vs-OMX comparison spread, asset lifecycle diagram, interactive 3D viewer proxy, review verdict, debugger trace
- Variants and states: active chapter, reveal step, recommended option, wheel-controlled Mermaid iteration, wheel-controlled browser-test progress, viewer angle, copied prompt
- Token/component ownership: CSS variables in `app/globals.css`; teaching content in `app/page.tsx`

## Accessibility

- Target standard: WCAG AA where practical
- Keyboard/focus behavior: arrow/Page keys navigate; all controls use native buttons
- Contrast/readability: dark ink on warm paper; high-contrast code panels
- Screen-reader semantics: labeled chapter navigation and live scene updates
- Reduced motion: `prefers-reduced-motion` collapses animation duration

## Responsive behavior

- Supported devices: desktop presentation first; tablet/mobile reading supported
- Layout adaptations: split frames stack; chapter rail becomes compact; comparison columns become vertical
- Touch/hover differences: wheel, arrow keys, and footer arrows all advance the same reveal state; chapter navigation jumps to a chapter; prompt copy remains an explicit button

## Interaction states

- Loading: static first frame
- Empty: asset library explains what will appear after upload
- Error: failed conversion or missing texture state is described in plain language
- Success: approved/published state shows evidence
- Disabled: lower contrast while preserving labels
- Offline/slow network: self-contained after load

## Content voice

- Tone: plain Chinese, short sentences, jargon explained immediately
- Terminology: “PLAN x Mermaid”; “原生 Goal” vs “OMX UltraGoal”; “快速 Review” vs “OMX CodeReview”
- Microcopy: every scene first answers “它能帮你做什么”，then shows the 3D asset case, a prompt, and the result

## Implementation constraints

- Framework: vinext/React with repo-native CSS
- Tokens: one warm editorial palette; coral for action; sage for verified success
- Performance: no added dependencies and no infinite animations
- Compatibility: Cloudflare Worker-compatible build; localhost fallback retained
- Verification: lint, build, rendered HTML assertions, local HTTP check

## Open questions

- [ ] Whether to add presenter notes in a later iteration / owner: user / impact: optional
