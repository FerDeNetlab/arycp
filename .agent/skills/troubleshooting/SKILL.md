---
name: troubleshooting-errors
description: "Systematically diagnoses and resolves application errors using structured error handling patterns, retry strategies, and graceful degradation. Use when debugging failures, fixing bugs, handling exceptions, improving error resilience, or when the user says 'it's broken', 'fix this error', or 'troubleshoot'."
---

# Troubleshooting & Error Resolution

## When to use this skill
- User reports a bug, error, or unexpected behavior
- Application is crashing, returning wrong data, or failing silently
- User says "fix this", "it's broken", "troubleshoot", "debug"
- Implementing error handling in new features
- Improving application reliability or resilience
- Handling async, network, or external service failures

## Hard Gate

> **DO NOT** apply a fix without first reproducing and understanding the root cause. A fix without diagnosis often creates new bugs.

## Troubleshooting Checklist

- [ ] **1. Reproduce** — Confirm the error exists and understand the exact symptom
- [ ] **2. Read the error** — Full stack trace, error message, HTTP status, console output
- [ ] **3. Locate the source** — Trace to the exact file, line, and function causing the issue
- [ ] **4. Understand the cause** — Why does this code fail? What assumption is wrong?
- [ ] **5. Check related code** — Are other places using the same pattern? Could they break too?
- [ ] **6. Implement the fix** — Minimal, targeted change that addresses the root cause
- [ ] **7. Verify the fix** — Build succeeds, error is gone, no regressions introduced
- [ ] **8. Confirm with user** — Show proof the fix works (build output, screenshot, test)

## Diagnosis Process

### Step 1: Reproduce
- Run the exact command or action that triggers the error
- Note the **exact** error message, status code, or unexpected behavior
- Check terminal output, browser console, and server logs

### Step 2: Read the Error
Ask yourself:
- What **type** of error is it? (syntax, runtime, network, auth, data)
- What **line/file** does the stack trace point to?
- Is it a **first-party** bug or a **third-party** dependency issue?

### Step 3: Trace to Source
- Follow the stack trace from top to bottom
- Check the data flow: what inputs reach the failing function?
- Use `grep_search` or `view_code_item` to find related usages

### Step 4: Root Cause Analysis
Common root causes by category:

| Category | Common Causes |
| :--- | :--- |
| **Data** | Null/undefined values, wrong types, missing fields |
| **Auth** | Expired tokens, missing permissions, wrong user context |
| **Network** | Timeouts, CORS, wrong URL, API changes |
| **State** | Race conditions, stale cache, out-of-order execution |
| **Config** | Wrong env vars, missing dependencies, version mismatch |
| **Logic** | Wrong condition, off-by-one, missing edge case |

### Step 5: Fix
- Make the **smallest change** that fixes the root cause
- Don't refactor unrelated code in the same fix
- Add guard clauses or validation to prevent recurrence

### Step 6: Verify
- Build the project — exit code 0
- Test the exact scenario that was failing
- Check that related functionality still works

## Error Handling Patterns

For implementing robust error handling, see:
- 👉 **[resources/patterns-typescript.md](resources/patterns-typescript.md)** — Custom errors, Result types, async handling
- 👉 **[resources/patterns-python.md](resources/patterns-python.md)** — Exception hierarchy, retry, circuit breaker
- 👉 **[resources/universal-patterns.md](resources/universal-patterns.md)** — Circuit breaker, error aggregation, graceful degradation

## Best Practices

- **Fail Fast** — Validate input early, fail quickly
- **Preserve Context** — Include stack traces, metadata, timestamps in errors
- **Meaningful Messages** — Explain what happened AND how to fix it
- **Log Appropriately** — Errors = log. Expected failures = don't spam logs
- **Handle at Right Level** — Catch where you can meaningfully handle
- **Clean Up Resources** — Use try-finally, context managers, defer
- **Don't Swallow Errors** — Log or re-throw, never silently ignore
- **Type-Safe Errors** — Use typed/custom errors when possible

## Common Pitfalls

| Pitfall | Why It's Bad |
| :--- | :--- |
| `catch (e) {}` empty blocks | Silently hides real bugs |
| Catching too broadly | `except Exception` masks programming errors |
| Logging AND re-throwing | Creates duplicate log entries |
| Not cleaning up resources | Leaks file handles, DB connections |
| `"Error occurred"` messages | Useless for debugging — be specific |
| Ignoring async errors | Unhandled promise rejections crash apps |

## Key Principles

- **One fix at a time** — Don't bundle unrelated changes
- **Prove it's fixed** — Build output, test result, or screenshot
- **Prevent recurrence** — Add validation, types, or guards
- **Document the fix** — Commit message explains the WHY, not just the WHAT
