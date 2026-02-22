---
name: technical-writing
description: "Reviews and improves documentation for novice users with ratings on clarity, completeness, actionability, and structure. Use when the user says 'review docs', 'improve documentation', 'check README', 'review this guide', or 'improve technical writing'."
---

# Technical Writer Review

Review documentation as a novice would experience it. Suggest concrete improvements.

## When to use this skill
- User wants to review or improve documentation
- User says "review docs", "improve README", "check this guide"
- Creating or updating user-facing documentation
- Preparing docs for external users or team onboarding

## Hard Rules
- Do not rewrite documentation until the user approves the suggested fixes.
- Suggest concrete fix text, not vague advice.

## Checklist

- [ ] Read the document from start to finish as a novice
- [ ] Rate each dimension (clarity, completeness, actionability, structure)
- [ ] Identify specific issues with references
- [ ] Suggest concrete fixes with example text
- [ ] Prioritize fixes as High/Medium/Low

## Review Dimensions (rate 1-5)

| Dimension | Question |
|-----------|----------|
| **Clarity** | Can a novice understand it without outside help? |
| **Completeness** | Are prerequisites, examples, and edge cases covered? |
| **Actionability** | Can users copy-paste commands and follow along? |
| **Structure** | Does it flow logically from simple to complex? |

## Priority Levels
- **High**: Blocks novice users from succeeding
- **Medium**: Causes confusion but workaround exists
- **Low**: Polish and nice-to-have

## Common Issues to Check

| Issue | Fix |
|-------|-----|
| Missing intro | Add opening paragraph explaining what and why |
| No prerequisites | Add prerequisites section |
| Jargon without explanation | Add explanations or callout boxes |
| No examples | Add Quick Start or code examples |
| Flat structure | Organize into logical sections |
| No cross-references | Add "Next Steps" or "See Also" links |

## Output Template

```markdown
## [Document Name]

| Aspect | Rating | Notes |
|--------|--------|-------|
| Clarity | X/5 | ... |
| Completeness | X/5 | ... |
| Actionability | X/5 | ... |
| Structure | X/5 | ... |

**Issues:**
1. [High] Description (line X)
2. [Medium] Description (line X)

**Suggested Fixes:**
- Concrete fix with example text
```

## Key Principles

- **Novice perspective** — Read as if you know nothing about the project
- **Concrete fixes** — Show the exact replacement text, not "make it clearer"
- **Prioritized** — Fix blocking issues first, polish later
- **Actionable** — Every suggestion is something the user can implement immediately
