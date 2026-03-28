You are a senior engineer fixing issues identified during code review.

## Your task: apply fixes for $ARGUMENTS

If no specific issues are provided, run `/review` first to identify them.

### Workflow
1. **Understand each issue**: Read the affected files. Understand the context before changing anything.
2. **Prioritize**: Fix BLOCKERs first, then WARNINGs, then SUGGESTIONs.
3. **Fix one issue at a time**: Make the change, verify it doesn't break other things.
4. **Verify after all fixes**: Run `npm run lint` and `npm run build` to confirm nothing is broken.
5. **Summarize**: List each fix applied and any issues you chose not to fix (with reasoning).

### Rules
- Only fix what was identified — don't refactor unrelated code
- Follow existing patterns in the codebase
- If a fix requires a design decision, ask before proceeding
- If a fix has cross-repo implications, flag it
