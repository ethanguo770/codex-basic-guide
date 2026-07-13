# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-07-12
- Primary surface: a full-screen, self-guided teaching experience
- Evidence reviewed: the current React/CSS implementation, prior HyperFrames direction, user feedback from live reading, and the official ReactBits component index

## Brand

- Personality: a patient technical tutor presented as a warm editorial notebook; quietly confident rather than theatrical
- Trust signals: realistic asset records, explicit command comparisons, visible inputs and outputs, and concrete verification evidence
- Visual hierarchy: Claude-like clarity—one dominant idea, one supporting example, then a compact takeaway
- Avoid: dense dashboards, neon styling, unexplained 3D jargon, equal-weight card grids, decorative motion without teaching value, and autoplay

## Product goals

- Help first-time Codex users understand five practical workflows without a presenter.
- Teach every workflow through one continuous example: developing a 3D simulation asset-management website.
- Let the reader control the pace with the wheel or keyboard, one meaningful reveal at a time.
- Success means the reader can choose PLAN x Flowchart, OMX UltraGoal, Browser, OMX CodeReview, or Debugger and knows what input and output to expect.

## Concept model

- Page title: `Codex小技巧`
- PLAN x 流程图（Mermaid）: AI writes a plan and draws matching diagrams; people review the diagrams, correct omissions, and approve the synchronized plan before code changes begin.
- OMX UltraGoal: turns a long objective into durable execution that can resume, retry, react to evidence, test, and independently review the result before completion.
- Browser: performs complete web test flows and can write an authorized Feishu document from a copied document URL, then verify the saved result.
- OMX CodeReview: asks independent code and architecture reviewers to find problems before merge.
- Debugger: reproduces the bug, follows evidence to the real cause, applies the smallest useful fix, and adds a regression test.
- Unifying thesis: first understand the work, then let AI do it, and finally verify the result.

## Information architecture

- Primary navigation: linear chapters controlled by keyboard, wheel, footer controls, or the chapter rail.
- Core scenes: cover, platform brief, PLAN x Flowchart, UltraGoal, Browser, OMX CodeReview, Debugger, real case, summary, appendix.
- Capability-scene hierarchy: plain-language purpose → concrete problem → why this command fits → input → visible AI action → result.
- Scene 06 is the validating project recap: a connected five-stage relay shows how each result becomes the next capability's input.
- The summary is a selection map: the reader starts with “where am I stuck?” and reaches the matching command.
- Previously revealed content remains readable as context; it may recede, but never below comfortable reading contrast.

## Design principles

- One idea per reveal step; secondary detail waits until the primary point is understood.
- Explain the command before showing its prompt, logs, or implementation evidence.
- Teach command choice with a problem signal that distinguishes it from the other four capabilities.
- Demonstrate every command in the same asset lifecycle: upload → convert → preview → review → publish.
- Compare native Codex and OMX with parallel language and an explicit recommendation.
- Give each capability the same five-part teaching path: the problem, why the command fits, what to tell AI, what AI does, and the result.
- Trade reference density for beginner comprehension.

## Visual language

- Color: warm paper `#F4F0E8`, ink `#282522`, muted clay `#756D65`, coral `#D97757`, sage `#78917A`, pale panels `#E9E2D7`, dark viewport `#252826`.
- Typography: Georgia-style editorial serif for teaching statements; Geist Sans for explanation; Geist Mono for commands and evidence.
- Layout: generous margins, an 8px rhythm, and asymmetric 40/60 or 45/55 split frames.
- Shape: mostly square editorial panels, restrained radii, and quiet shadows.

## Motion contract

- Motion is manually controlled. A wheel gesture advances exactly one semantic step; trackpad inertia must not skip several steps.
- On narrow layouts, the lesson's own vertical scroll consumes the gesture first; the tutorial advances only after a new gesture at the top or bottom boundary.
- Cross-page transitions may vary by meaning—editorial wipe, comparison split, or action sweep—but always fully cover the old scene before revealing the new one.
- Inside a scene, current content uses a subtle ReactBits-inspired focus ring and settling entrance. Earlier content remains at roughly 70% or greater visual prominence so it stays readable.
- Diagrams draw their paths, Browser emphasizes the active automation phase, and Debugger reveals evidence in sequence. Motion explains the concept rather than decorating it.
- Do not use scroll-triggered stacks because the desktop surface intentionally has no native page scroll.
- Do not use infinite, cursor-chasing, glare, particle, or background animations.
- `prefers-reduced-motion` collapses all animation durations.

## ReactBits adoption decision

- Use ReactBits as an interaction reference, not as a runtime dependency.
- Adapt the intent of Animated Content, Spotlight Card, True Focus, and Stepper with small repo-native CSS and state already present in the guide.
- Avoid Scroll Reveal and Scroll Stack because their continuous-scroll model conflicts with the guide's discrete wheel-controlled teaching steps.
- Avoid visual-effects components whose motion competes with the lesson content.

## Components and states

- Reuse: chapter rail, command copy surface, progress footer, comparison spread, rendered flowchart, asset viewer proxy, review verdict, and debugger trace.
- Core teaching components: the single-canvas five-step `BeginnerPath`, the connected `project-relay`, and the problem-to-command `decision-map`.
- States: unrevealed, current, past-but-readable, recommended, copied, testing, passed, and transition-covering.
- Parent sections must remain current for as long as any nested child is still revealing.
- Interactive controls remain clickable even after surrounding reference content is no longer the current focus.

## Accessibility

- Target: WCAG AA where practical.
- Keyboard: arrow keys, Page keys, Home, and End navigate; controls remain native buttons and links.
- Screen readers: chapter navigation and current steps use `aria-current`; dedicated live regions announce only the newly revealed teaching content.
- Contrast: dark ink on warm paper and high-contrast code panels; dimming never hides required reading.
- Reduced motion: supported through `prefers-reduced-motion`.

## Responsive behavior

- Desktop presentation is primary; tablet and mobile reading remain supported.
- Desktop scenes fit inside the viewport at common 16:9 resolutions without vertical page scrolling.
- Split frames stack on narrow screens, the chapter rail becomes compact, and mobile lesson content may scroll within the scene.
- Wheel, keyboard, footer arrows, and chapter navigation all resolve to the same reveal state model.

## Implementation constraints

- Framework: vinext/React with repo-native CSS.
- No new animation dependency for this iteration; ReactBits patterns are copied conceptually and implemented locally.
- No infinite animations.
- Cloudflare Worker-compatible build and localhost fallback are retained.
- Verification: lint, build, rendered HTML assertions, executable wheel-routing tests, local HTTP smoke test, and viewport checks.

## Open questions

- [ ] Whether to add presenter notes in a later iteration / owner: user / impact: optional
