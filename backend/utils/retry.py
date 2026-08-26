import asyncio
from typing import Callable, Any
from functools import wraps
from google.api_core.exceptions import ResourceExhausted

def with_retry(max_retries: int = 5, initial_delay: float = 40.0, backoff_factor: float = 1.5):
    """
    Decorator for retrying async functions when hitting Google API rate limits.
    Default initial delay is 40 seconds because free-tier rate limits often ask to retry in ~40 seconds.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            delay = initial_delay
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except ResourceExhausted as e:
                    if attempt == max_retries:
                        raise e
                    print(f"[RETRY] Rate limit exceeded. Waiting {delay}s before attempt {attempt + 2}/{max_retries + 1}...")
                    await asyncio.sleep(delay)
                    delay *= backoff_factor
                except Exception as e:
                    # Let other exceptions fail fast
                    raise e
        return wrapper
    return decorator
