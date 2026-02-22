# Python Error Handling Patterns

## Custom Exception Hierarchy

```python
class ApplicationError(Exception):
    """Base exception for all application errors."""
    def __init__(self, message: str, code: str = None, details: dict = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}
        self.timestamp = datetime.utcnow()

class ValidationError(ApplicationError):
    pass

class NotFoundError(ApplicationError):
    pass

class ExternalServiceError(ApplicationError):
    def __init__(self, message: str, service: str, **kwargs):
        super().__init__(message, **kwargs)
        self.service = service
```

## Context Managers for Cleanup

```python
from contextlib import contextmanager

@contextmanager
def database_transaction(session):
    """Ensure transaction is committed or rolled back."""
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
```

## Retry with Exponential Backoff

```python
import time
from functools import wraps

def retry(max_attempts=3, backoff_factor=2.0, exceptions=(Exception,)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        time.sleep(backoff_factor ** attempt)
                        continue
                    raise
            raise last_exception
        return wrapper
    return decorator

@retry(max_attempts=3, exceptions=(NetworkError,))
def fetch_data(url: str) -> dict:
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
```

## Comprehensive Error Handling Example

```python
def process_order(order_id: str) -> Order:
    try:
        if not order_id:
            raise ValidationError("Order ID is required")

        order = db.get_order(order_id)
        if not order:
            raise NotFoundError("Order", order_id)

        try:
            payment_result = payment_service.charge(order.total)
        except PaymentServiceError as e:
            logger.error(f"Payment failed for order {order_id}: {e}")
            raise ExternalServiceError(
                "Payment processing failed",
                service="payment_service",
                details={"order_id": order_id}
            ) from e

        order.status = "completed"
        db.save(order)
        return order

    except ApplicationError:
        raise  # Re-raise known errors
    except Exception as e:
        logger.exception(f"Unexpected error processing order {order_id}")
        raise ApplicationError("Order processing failed", code="INTERNAL_ERROR") from e
```
