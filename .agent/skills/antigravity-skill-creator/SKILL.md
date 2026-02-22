---
name: creating-agent-skills
description: "Generates high-quality .agent/skills/ directories for the Antigravity agent. Use when the user asks to create, build, or scaffold a new skill, workflow, or agent capability."
---

# Antigravity Skill Creator

## When to use this skill
- User asks to **create a new skill**
- User asks to **scaffold an agent capability**
- User mentions building a workflow, automation, or reusable agent task

## Core Structural Requirements

Every skill must follow this folder hierarchy:

```
.agent/skills/<skill-name>/
├── SKILL.md          # Required: Main logic and instructions
├── scripts/          # Optional: Helper scripts
├── examples/         # Optional: Reference implementations
└── resources/        # Optional: Templates or assets
```

## YAML Frontmatter Standards

The `SKILL.md` must start with YAML frontmatter:

- **name**: Gerund form (e.g., `testing-code`, `managing-databases`). Max 64 chars. Lowercase, numbers, and hyphens only. No "claude" or "anthropic".
- **description**: Written in **third person**. Must include specific triggers/keywords. Max 1024 chars.

Example:
```yaml
---
name: testing-react-components
description: "Automates React component testing with Vitest. Use when the user mentions unit tests, component tests, or test coverage for React."
---
```

## Writing Principles

- **Conciseness**: Assume the agent is smart. Focus only on the unique logic of the skill.
- **Progressive Disclosure**: Keep `SKILL.md` under 500 lines. Link to secondary files (e.g., `[See ADVANCED.md](ADVANCED.md)`) only one level deep if more detail is needed.
- **Forward Slashes**: Always use `/` for paths, never `\`.
- **Degrees of Freedom**:
    - **Bullet Points** → High-freedom tasks (heuristics)
    - **Code Blocks** → Medium-freedom (templates)
    - **Specific Bash Commands** → Low-freedom (fragile operations)

## Workflow & Feedback Loops

For complex skills, include:

1. **Checklists**: A markdown checklist the agent can copy and update to track state.
2. **Validation Loops**: A "Plan-Validate-Execute" pattern (e.g., run a script to check config BEFORE applying changes).
3. **Error Handling**: Scripts should be "black boxes" — tell the agent to run `--help` if unsure.

## Output Template

When creating a skill, output in this format:

```markdown
---
name: [gerund-name]
description: "[3rd-person description with triggers]"
---

# [Skill Title]

## When to use this skill
- [Trigger 1]
- [Trigger 2]

## Workflow
[Checklist or step-by-step guide]

## Instructions
[Specific logic, code snippets, or rules]

## Resources
- [Link to scripts/ or resources/ if applicable]
```

## Checklist for Creating a Skill

- [ ] Determine skill name (gerund, lowercase, hyphens)
- [ ] Write description with trigger keywords
- [ ] Define when to use (triggers)
- [ ] Write workflow steps or checklist
- [ ] Write core instructions/logic
- [ ] Add scripts/ if automation is needed
- [ ] Add examples/ if reference implementations help
- [ ] Add resources/ if templates/assets are needed
- [ ] Verify SKILL.md is under 500 lines
- [ ] Use forward slashes for all paths
