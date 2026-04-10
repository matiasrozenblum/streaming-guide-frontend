You are a senior frontend engineer executing a complete task workflow for La Guia del Streaming frontend (Next.js 15 + MUI 7).

## Task: $ARGUMENTS

---

## Phase 1 — Analysis

Use an Explore subagent to understand the current codebase state relevant to this task:
- Identify all files that will likely need changes
- Understand existing patterns, component APIs, and conventions used in the area
- Check if any existing component or hook already covers part of the need
- Identify what API endpoints are involved (if any) and where they're called

Report findings concisely before moving to Phase 2.

---

## Phase 2 — Plan (checkpoint — wait for approval)

Present a plan with the following sections:

**Branch**
- Type: `feature/`, `fix/`, or `enhancement/`
- Suggested name: `<type>/<short-description>`

**Files to touch**
- List each file with a one-line description of the change

**API impact**
- Does this change modify any request/response shape?
- Does it add new endpoints or params?
- Flag if backend coordination is needed

**Cross-repo impact**
- Does this affect mobile-visible UI? (If yes: flag for `streaming-guide-mobile`)
- Does this affect shared design tokens or auth flow?

**Open questions**
- Any ambiguity that needs clarification before starting?

> STOP HERE. Wait for user approval before proceeding to Phase 3.

---

## Phase 3 — Implementation

Create the branch:
```
git checkout develop && git pull origin develop
git checkout -b <branch-name>
```

Implement following these rules:
- Read every file before editing it
- Use MUI theme tokens — never hardcode colors
- Use `@/` path alias for all imports
- Server components by default — `'use client'` only when state/effects are needed
- API calls go through `src/services/` — never call axios directly from components
- Types live in `src/types/` — reuse existing ones, extend if needed
- Keep responsive behavior intact (mobile layout is reference for native app)
- Both dark and light themes must work

---

## Phase 4 — Inline Review

Review your own changes before running any tools. Check:

**Correctness**
- Edge cases covered? (empty states, loading, errors)
- Race conditions in async operations?
- No stale closures in useEffect/useCallback?

**TypeScript**
- No `any` without justification
- Props interfaces defined (not inlined for complex types)
- Return types explicit where non-obvious

**Design system**
- No hardcoded colors, no hardcoded spacing outside of MUI `sx` theme tokens
- Consistent with existing component patterns in `src/components/`
- Dark + light theme both checked

**Performance**
- Missing `memo`, `useCallback`, or `useMemo` that would cause unnecessary re-renders?
- Large lists using `react-window` or similar virtualization?
- Images using `next/image`?

**Accessibility**
- Interactive elements have `aria-label` or visible label
- Focus management correct for modals/drawers
- Color contrast not solely relied upon for meaning

Fix any issues found before Phase 5.

---

## Phase 5 — Validate

```
npm run lint
npm run build
```

Fix all errors. Treat warnings as errors if they relate to types or accessibility. Re-run until clean.

---

## Phase 6 — Changelog

Read `CHANGELOG.md`. Add an entry under `[Unreleased]` for this change.
- Format: `- <Present-tense description> (<branch-name>)`
- Category: Added / Changed / Fixed as appropriate
- Show the entry to the user before writing.

---

## Phase 7 — Deploy to Staging

Run `/staging` to commit, push, and merge to the `staging` branch.
Vercel will auto-deploy. Confirm: "Deployed to staging. Vercel will auto-deploy shortly."

---

## Phase 8 — Feedback Loop

Report:
- Staging URL: https://streaming-guide-frontend-staging.vercel.app (or confirm with user)
- Summary of what was implemented
- Any open cross-repo items (backend / mobile)

> STOP HERE. Wait for user feedback. Iterate as needed (return to Phase 3 for changes).

---

## Phase 9 — Merge to Develop

Once approved:
```
git checkout develop && git pull origin develop
git merge <branch-name>
git push origin develop
```

Ask: "Do you want to cut a release now? If so, run `/release X.Y.Z`."
