# Universal Error Handling Patterns

These patterns apply to any language or framework.

## Pattern 1: Circuit Breaker

Prevent cascading failures in distributed systems. When a service fails repeatedly, stop calling it temporarily.

```python
from enum import Enum
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"        # Normal operation
    OPEN = "open"            # Failing — reject requests
    HALF_OPEN = "half_open"  # Testing if recovered

class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=timedelta(seconds=60)):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = None

    def call(self, func):
        if self.state == CircuitState.OPEN:
            if datetime.now() - self.last_failure_time > self.timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")
        try:
            result = func()
            self._on_success()
            return result
        except Exception:
            self._on_failure()
            raise

    def _on_success(self):
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
```

## Pattern 2: Graceful Degradation

Provide fallback functionality when the primary path fails.

```python
def with_fallback(primary, fallback, log_error=True):
    try:
        return primary()
    except Exception as e:
        if log_error:
            logger.error(f"Primary failed: {e}")
        return fallback()

# Usage: cache first, then database
profile = with_fallback(
    primary=lambda: fetch_from_cache(user_id),
    fallback=lambda: fetch_from_database(user_id)
)
```

## Pattern 3: Error Categories

Classify errors to determine the correct response:

| Category | Action | Example |
| :--- | :--- | :--- |
| **Recoverable** | Retry or fallback | Network timeout, rate limit |
| **Client error** | Return error to user | Invalid input, not found |
| **Server error** | Log + alert + fallback | Database down, OOM |
| **Programming bug** | Crash + fix | Null pointer, type error |

## Pattern 4: Error Recovery Decision Tree

```
Error occurs
├── Is it a known/expected error?
│   ├── YES → Handle gracefully (fallback, retry, user message)
│   └── NO → Is it recoverable?
│       ├── YES → Log + retry with backoff
│       └── NO → Log + crash + alert
```
