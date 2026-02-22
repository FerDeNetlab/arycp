---
name: writing-plans
description: "Creates detailed, step-by-step implementation plans from specs or requirements. Use when the user has an approved design, spec, or feature request and needs a structured plan before touching code. Activates after brainstorming or when the user says 'make a plan' or 'plan this out'."
---

# Writing Implementation Plans

## When to use this skill
- User has an approved design or spec ready to implement
- User says "make a plan", "plan this out", or "break this down"
- After the brainstorming skill produces a design
- Before starting any multi-step implementation

## Overview

Write comprehensive implementation plans assuming the executor has **zero context** for the codebase. Document everything: which files to touch, exact code, how to test it. Give the whole plan as **bite-sized tasks**.

Principles: **DRY. YAGNI. Frequent commits.**

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

## Checklist

- [ ] Read approved design/spec
- [ ] Break work into bite-sized tasks (2-5 min each)
- [ ] For each task: list exact file paths, code, and verification steps
- [ ] Write plan header with goal, architecture, and tech stack
- [ ] Save plan as implementation_plan.md artifact
- [ ] Present plan to user for approval
- [ ] Offer execution approach

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**

| Step | Example |
| :--- | :--- |
| Write the failing test | One step |
| Run it to verify it fails | One step |
| Implement minimal code to pass | One step |
| Run tests to verify they pass | One step |
| Commit | One step |

If a step takes more than 5 minutes, **break it down further**.

## Plan Document Structure

Every plan MUST start with this header:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

Each task follows this template:

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ext`
- Modify: `exact/path/to/existing.ext` (lines ~X-Y)
- Test: `tests/exact/path/to/test.ext`

**Step 1: [Action]**

```language
// Exact code to write or change
```

**Step 2: Verify**

Run: `exact command here`
Expected: [What success looks like]

**Step 3: Commit**

```bash
git add <files>
git commit -m "feat: descriptive message"
```
````

## Plan Quality Rules

- **Exact file paths** — Always. Never say "the config file", say `src/config/database.ts`
- **Complete code** — Write the actual code in the plan, not "add validation logic"
- **Exact commands** — Include the full command with expected output
- **No ambiguity** — If someone can misinterpret a step, it needs more detail
- **Dependencies first** — Order tasks so each builds on the previous
- **Test coverage** — Every feature task should have a verification step

## Execution Handoff

After saving the plan, present it to the user for approval:

```
Plan complete and saved. Ready to begin implementation?

I'll execute task-by-task with verification between each step.
```

## Key Principles

- **Bite-sized** — Each task is 2-5 minutes of focused work
- **Self-contained** — Each task has everything needed to execute it
- **Ordered** — Dependencies resolved by task ordering
- **Verifiable** — Every task ends with a way to confirm it worked
- **DRY** — Don't repeat patterns; reference earlier tasks
- **YAGNI** — Only plan what's needed for the current feature
