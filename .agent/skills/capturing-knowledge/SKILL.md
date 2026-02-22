---
name: capturing-knowledge
description: "Captures structured knowledge about code entry points — modules, files, functions, or APIs — and creates documentation with dependency analysis and mermaid diagrams. Use when the user says 'document this', 'explain this module', 'map this code', 'how does this work', or 'capture knowledge'."
---

# Knowledge Capture Assistant

Build structured understanding of code entry points with an analysis-first workflow.

## When to use this skill
- User asks to document, understand, or map a module, file, or function
- User says "how does this work?", "document this", "explain this code"
- Onboarding onto a new part of the codebase
- Creating reference documentation for a component

## Hard Rule
- Do not create documentation until the entry point is validated and analysis is complete.

## Checklist

- [ ] Confirm entry point (file, folder, function, API)
- [ ] Validate it exists; resolve ambiguity
- [ ] Collect source context (purpose, exports, patterns)
- [ ] Analyze dependencies up to depth 3
- [ ] Synthesize explanation with diagrams
- [ ] Create documentation file
- [ ] Summarize insights and suggest next dives

## Workflow

### 1. Gather & Validate
- Confirm entry point, purpose, and desired depth
- Verify it exists; resolve ambiguity or suggest alternatives
- Ask: What is the goal? (understand, debug, refactor, onboard?)

### 2. Collect Source Context
- Summarize purpose, exports, key patterns
- **Files**: Core logic, helper functions, constants
- **Folders**: Structure, key modules, relationships
- **Functions/APIs**: Signature, parameters, return values, error handling

### 3. Analyze Dependencies
- Build dependency view up to depth 3
- Track visited nodes to avoid loops
- Categorize: imports, function calls, services, external packages
- Exclude external systems or generated code

### 4. Synthesize
- **Overview**: Purpose, language, high-level behavior
- **Core logic**: Execution flow, key patterns
- **Error handling**: How failures are managed
- **Security/Performance**: Notable considerations
- **Risks**: Improvements or issues discovered during analysis

### 5. Create Documentation
- Normalize name to kebab-case (`calculateTotalPrice` → `calculate-total-price`)
- Create `docs/knowledge-{name}.md` with sections:
  - Overview
  - Implementation Details
  - Dependencies
  - Visual Diagrams (mermaid)
  - Additional Insights
  - Metadata (date, depth, files touched)
  - Next Steps
- Include mermaid diagrams when they clarify flows or relationships

### 6. Review & Next Actions
- Summarize key insights and open questions
- Suggest related areas for deeper dives
- Confirm file path and remind to commit

## Output Template

```markdown
# Knowledge: [Entry Point Name]

## Overview
[Purpose, language, high-level behavior]

## Implementation Details
[Core logic, execution flow, patterns]

## Dependencies
[Categorized dependency list]

## Visual Diagrams
[Mermaid diagrams for flows and relationships]

## Additional Insights
[Security, performance, risks, improvements]

## Metadata
- **Date**: [analysis date]
- **Depth**: [1-3]
- **Files touched**: [count]

## Next Steps
[Suggested follow-ups and related areas]
```

## Key Principles

- **Analysis before documentation** — Understand first, write second
- **Depth control** — Don't go deeper than needed
- **Visual when helpful** — Mermaid diagrams for complex flows
- **Actionable** — Include next steps and improvement suggestions
