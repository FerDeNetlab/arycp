---
name: simplifying-code
description: "Analyzes and simplifies existing implementations to reduce complexity and improve readability. Use when the user says 'simplify this', 'refactor', 'clean up', 'reduce complexity', 'make this simpler', 'improve readability', or 'reduce technical debt'."
---

# Simplify Implementation Assistant

Reduce complexity with an analysis-first approach before changing code.

## When to use this skill
- User wants to simplify or clean up existing code
- Code is hard to understand, maintain, or extend
- User says "simplify", "refactor", "clean up", "too complex"
- Reducing technical debt or improving maintainability

## Hard Rules
- Do not modify code until the user approves a simplification plan.
- Readability over brevity. Some duplication beats the wrong abstraction.

## Checklist

- [ ] Confirm targets, pain points, and constraints
- [ ] Analyze complexity sources and measure impact
- [ ] Apply the Reading Test to each piece
- [ ] Propose simplifications with before/after snippets
- [ ] Prioritize by impact/risk
- [ ] Get user approval before implementing

## Workflow

### 1. Gather Context
- Target file(s) or component(s) to simplify
- Current pain points (hard to understand? maintain? extend?)
- Constraints (backward compatibility, API stability, deadlines)

### 2. Analyze Complexity
Identify sources:
- Deep nesting or long functions
- Duplicate or redundant code
- Tightly coupled components
- Over-engineering or premature optimization
- Magic numbers, hardcoded values

Measure impact:
- Lines of code that could be reduced
- Dependencies that could be removed
- Cognitive load for future maintainers

### 3. The Reading Test
For each piece of code, ask:
1. Can a new team member understand this in under 30 seconds?
2. Does the code flow naturally without jumping to other files?
3. Are there any "wait, what does this do?" moments?
4. Would this code still be clear 6 months from now?

If "no" to any → needs more clarity, not more optimization.

### 4. Propose Simplifications

| Pattern | When to Apply |
|---------|---------------|
| **Extract** | Long functions → smaller, focused functions |
| **Consolidate** | Duplicate code → shared utilities |
| **Flatten** | Deep nesting → early returns, guard clauses |
| **Decouple** | Tight coupling → dependency injection, interfaces |
| **Remove** | Dead code, unused features, excessive abstractions |
| **Replace** | Complex logic → built-in language/library features |

### 5. Prioritize Changes
1. **High impact, low risk** — Do first
2. **High impact, higher risk** — Plan carefully
3. **Low impact, low risk** — Quick wins
4. **Low impact, high risk** — Skip or defer

For each change, specify:
- Before/after code snippets
- Risk level
- Testing requirements

### 6. Validate
- Run existing tests to verify no regressions
- Add tests for new helper functions
- Update docs if interfaces changed

## Anti-Patterns to Avoid

| Anti-Pattern | Better Alternative |
|--------------|--------------------|
| Nested ternaries `a ? b ? c : d : e` | Explicit if/else blocks |
| Chained one-liners `.map().filter().reduce()` | Named intermediate steps |
| Overly short variable names `x`, `z` | Descriptive names `users`, `activeUsers` |
| Premature DRY for 2-3 lines | Some duplication is clearer than wrong abstraction |

## Key Principles

- **Readability > brevity** — Code reads like a story, top to bottom
- **One level of abstraction** — Each function operates at one level
- **Explicit over implicit** — Clear code over clever shortcuts
- **Measure first** — Don't optimize without evidence of a problem
