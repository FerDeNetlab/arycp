---
name: reviewing-code
description: "Performs structured local code reviews before pushing changes. Checks design alignment, logic gaps, security, performance, and missing tests. Use when the user says 'review my code', 'code review', 'check before pushing', or 'review this before deploy'."
---

# Code Review Assistant

Structured file-by-file code review before pushing changes.

## When to use this skill
- User wants to review code before pushing or deploying
- User says "review my code", "code review", "check this"
- Before any `git push` to catch issues early
- After implementing a feature, before merging

## Hard Rule
- Do not push or deploy until the user acknowledges review findings.

## Checklist

- [ ] Gather context (feature, files changed, design docs)
- [ ] Get current diff (`git status`, `git diff --stat`)
- [ ] File-by-file review against design intent
- [ ] Check cross-cutting concerns (naming, docs, tests)
- [ ] Summarize findings with priority levels
- [ ] Confirm final checklist with user

## Workflow

### 1. Gather Context
- Brief feature/branch description
- List of modified files
- Relevant design docs or requirements
- Known constraints or risky areas
- Which tests have been run

### 2. Get Current Diff
```bash
git status -sb
git diff --stat
```

### 3. File-by-File Review
For every modified file, check:
- **Design alignment** — Does it match the intended architecture?
- **Logic & edge cases** — Missing null checks, wrong conditions, race conditions?
- **Redundancy** — Duplicate code that should be extracted?
- **Security** — Input validation, auth checks, secrets exposure?
- **Performance** — N+1 queries, unnecessary re-renders, missing memoization?
- **Error handling** — Are errors caught and handled meaningfully?
- **Missing tests** — Is there test coverage for the changes?

### 4. Cross-Cutting Concerns
- Naming consistency with project conventions
- Documentation updated where behavior changed
- Missing tests (unit, integration, E2E)
- Database migration or config updates captured

### 5. Summarize Findings

```markdown
### Summary
- Blocking issues: [count]
- Important follow-ups: [count]
- Nice-to-have improvements: [count]

### Detailed Notes
1. **[File or Component]**
   - Issue: ...
   - Impact: blocking / important / nice-to-have
   - Recommendation: ...

### Recommended Next Steps
- [ ] Address blocking issues
- [ ] Add/adjust tests
- [ ] Rerun test suite
```

### 6. Final Checklist
- Implementation matches design & requirements
- No logic or edge-case gaps
- Security considerations addressed
- Tests cover new/changed behavior
- Documentation updated

## Key Principles

- **Evidence-based** — Point to specific lines, not vague concerns
- **Prioritized** — Blocking > important > nice-to-have
- **Constructive** — Suggest fixes, not just problems
- **Scope-limited** — Review only changed code, don't refactor the world
