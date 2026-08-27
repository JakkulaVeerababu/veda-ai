import asyncio
from typing import Callable, Any
from functools import wraps

def with_retry(max_retries: int = 3, initial_delay: float = 2.0, backoff_factor: float = 1.5):
    """
    Generic async retry decorator with exponential backoff.
    Retries on any exception up to max_retries times.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            delay = initial_delay
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries:
                        raise e
                    print(f"[RETRY] Error: {e}. Waiting {delay}s before attempt {attempt + 2}/{max_retries + 1}...")
                    await asyncio.sleep(delay)
                    delay *= backoff_factor
        return wrapper
    return decorator
