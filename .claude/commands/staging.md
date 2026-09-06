Deploy current branch changes to staging environment.

## Context
Merging to `staging` branch triggers an automatic deploy on Vercel (staging environment).

## Steps

### 1. Validate state
- Run `git status` and `git diff --stat` to see what will be committed.
- Confirm you are NOT on `develop`, `staging`, or `main` branch.
- If there are no changes to commit, ask the user if they want to just merge the existing commits to staging.

### 2. Commit changes
- Analyze the diff and generate a concise, meaningful commit message.
- Show the proposed commit message to the user and ask for confirmation before committing.
- Run `git add -A && git commit -m "<message>"`.

### 3. Push feature branch
- Run `git push origin <current-branch>`.

### 4. Merge to staging
- Run: `git checkout staging && git pull origin staging`
- Run: `git merge -X theirs <feature-branch>`
- If there are merge conflicts, resolve them favoring the feature branch changes.
- **Before pushing, check `CHANGELOG.md`** — see the warning below. Run
  `git diff HEAD^1 HEAD -- CHANGELOG.md` and confirm the only change is the
  entry this branch adds. If entries that were already on staging disappeared,
  restore them from `git show HEAD^1:CHANGELOG.md`, then `git add CHANGELOG.md
  && git commit --amend --no-edit`.
- Run: `git push origin staging`

### 5. Return to feature branch
- Run: `git checkout <feature-branch>`

### 6. Report
- Confirm: "Deployed to staging. Vercel will auto-deploy shortly."
- Show the commit hash and summary of what was deployed.

## Important
- Always confirm the commit message with the user before committing.
- If any git operation fails, stop and explain what went wrong. Do NOT force-push.
- The staging branch uses `-X theirs` strategy to always prefer the feature branch changes.

### `-X theirs` and CHANGELOG.md
`-X theirs` resolves every conflicting hunk in favor of the feature branch, and
that is wrong for `CHANGELOG.md`. Feature branches are cut from `develop`, where
`[Unreleased]` does not have the entries that other branches already merged into
`staging`. So a branch that adds its own `[Unreleased]` entry conflicts with
those, `-X theirs` picks the branch's version, and the other entries are deleted
with no conflict shown.

`.gitattributes` sets `CHANGELOG.md merge=union`, which makes git concatenate
both sides instead of choosing one. The union driver takes precedence over
`-X theirs`, so entries are no longer lost. It merges *textually*, though: the
result can have sections out of order, duplicated `### Added` headers, or missing
blank lines. Always read the merged `[Unreleased]` section and tidy it before
pushing — union protects the content, not the formatting.
