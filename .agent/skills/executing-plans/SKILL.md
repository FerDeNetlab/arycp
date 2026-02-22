---
name: executing-plans
description: "Executes implementation plans task-by-task with interactive status tracking, blocker management, and session summaries. Use when the user says 'execute the plan', 'start implementing', 'work through the plan', 'let's build this', or 'begin implementation'."
---

# Plan Execution Assistant

Work through implementation plans one task at a time with status tracking.

## When to use this skill
- User has an approved implementation plan ready to execute
- User says "execute the plan", "start implementing", "let's build this"
- Resuming work on a partially completed plan
- Working through a task list interactively

## Hard Rule
- Follow the plan order. Do not skip tasks unless explicitly requested by the user.

## Checklist

- [ ] Load the implementation plan
- [ ] Present the task queue with status overview
- [ ] Execute tasks one at a time with verification
- [ ] Track status (done, in-progress, blocked, skipped)
- [ ] Handle discovered work and blockers
- [ ] Produce session summary

## Workflow

### 1. Load the Plan
- Ask for the plan location or check for `implementation_plan.md` in artifacts
- Parse task list and build ordered queue
- Identify dependencies between tasks

### 2. Present Task Queue
```
### Task Queue
1. [todo] Task: Set up database schema
2. [todo] Task: Create API route
3. [todo] Task: Build UI component
4. [todo] Task: Add tests
```

Status legend: `todo`, `in-progress`, `done`, `blocked`, `skipped`

### 3. Interactive Task Execution
For each task:
1. **Show** the task details, context, and files involved
2. **Reference** relevant design/requirements docs
3. **Execute** the implementation step by step
4. **Verify** — run the verification step from the plan
5. **Update status** — mark as done, in-progress, or blocked
6. **Commit** if the plan includes commit points

### 4. Handle Blockers
- If blocked, record blocker info
- Ask if we should skip to next task or resolve the blocker
- Keep a "Blocked" list with details

### 5. Discovered Work
After each section, ask:
- Were new tasks discovered during implementation?
- Do any existing tasks need scope changes?
- Capture new tasks in a "New Work" list

### 6. Session Summary

```markdown
### Execution Summary
- **Completed**: [list with notes]
- **In Progress**: [list with next steps]
- **Blocked**: [list with blockers]
- **Skipped**: [list with rationale]
- **New Tasks**: [discovered during execution]

### Next Session
- Start from: Task [N]
- Priority items: [list]
```

### 7. Post-Session Actions
Remind the user to:
- Commit completed work
- Push if ready for deploy
- Update any design docs if decisions changed
- Run full test suite

## Key Principles

- **One task at a time** — Focus, complete, verify, move on
- **Verify each step** — Don't accumulate unverified changes
- **Track everything** — Status, blockers, new work
- **Commit often** — Small, focused commits after each task
- **Communicate** — Always explain what you're about to do
