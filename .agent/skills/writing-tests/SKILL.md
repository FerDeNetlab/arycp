---
name: writing-tests
description: "Guides creation of unit and integration tests with high coverage targets. Generates test cases, edge cases, and coverage strategy. Use when the user says 'write tests', 'add tests', 'test coverage', 'unit test', 'integration test', or 'we need tests for this'."
---

# Test Writing Assistant

Guide test creation for high coverage with structured test case generation.

## When to use this skill
- User wants to add tests for new or existing code
- User says "write tests", "add tests", "test this", "coverage"
- After implementing a feature, before pushing
- Improving test coverage across the codebase

## Hard Rule
- Do not write tests without understanding what the code does first. Read the implementation before generating any test.

## Checklist

- [ ] Gather context (feature, files, environment)
- [ ] Analyze code to identify testable behaviors
- [ ] Generate unit tests (happy path, edge cases, errors)
- [ ] Generate integration tests for cross-component flows
- [ ] Define coverage strategy and missing branches
- [ ] Suggest manual/exploratory test checklist

## Workflow

### 1. Gather Context
- Feature name and what changed
- Target files/components to test
- Existing test setup (framework, utilities, mocks)
- Known flaky or slow tests to avoid

### 2. Analyze Testable Behaviors
For each module/function:
- What are the inputs and outputs?
- What side effects does it have?
- What can go wrong (errors, edge cases)?
- What dependencies does it need (mocks, stubs)?

### 3. Unit Tests

For each function/component, cover:

| Scenario | Example |
|----------|---------|
| **Happy path** | Valid input → expected output |
| **Edge cases** | Empty arrays, null values, boundary numbers |
| **Error handling** | Invalid input → proper error thrown/returned |
| **Async behavior** | Promises resolve/reject correctly |
| **State changes** | Component renders correctly after state update |

Template for each test:
```typescript
describe('[Module/Function Name]', () => {
  it('should [expected behavior] when [condition]', () => {
    // Arrange
    const input = /* test data */;
    // Act
    const result = functionUnderTest(input);
    // Assert
    expect(result).toBe(/* expected */);
  });
});
```

### 4. Integration Tests
- Identify critical flows that span multiple components
- Define setup/teardown steps (database, APIs)
- Test interaction boundaries and data contracts
- Test failure modes (network errors, timeouts, auth failures)

### 5. Coverage Strategy
- Run coverage: `npm run test -- --coverage`
- Identify uncovered files/functions and why
- Prioritize: critical paths > utilities > edge cases
- Target: aim for meaningful coverage, not just line count

### 6. Manual & Exploratory Testing
Propose a checklist for things that can't be automated:
- UX flow testing (does it feel right?)
- Accessibility checks (keyboard nav, screen reader)
- Error state UI (what does the user see when it fails?)
- Browser/device variation testing

## Test Quality Rules

- **Test behavior, not implementation** — Tests should survive refactors
- **One assertion per test** (when practical) — Clear failure messages
- **Descriptive names** — `should return empty array when user has no orders`
- **Arrange-Act-Assert** — Consistent structure in every test
- **No test interdependence** — Each test runs in isolation
- **Mock at boundaries** — Mock external APIs, not internal logic

## Key Principles

- **Read before writing** — Understand the code, then test it
- **Cover the important paths** — Critical flows first, polish later
- **Tests as documentation** — Test names describe what the code does
- **Fast feedback** — Unit tests should run in seconds
