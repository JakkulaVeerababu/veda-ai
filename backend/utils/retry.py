import asyncio
import re
from typing import Callable, Any
from functools import wraps

def with_retry(max_retries: int = 5, initial_delay: float = 2.0, backoff_factor: float = 1.5):
    """
    Generic async retry decorator with exponential backoff.
    Retries on any exception up to max_retries times.
    Intelligently parses Google API 429 quota wait times.
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
                    
                    error_str = str(e)
                    # Check if API tells us exactly how long to wait
                    match = re.search(r"Please retry in (\d+(?:\.\d+)?)s", error_str)
                    
                    wait_time = delay
                    if match:
                        api_wait = float(match.group(1)) + 1.0 # Add 1s buffer
                        wait_time = max(delay, api_wait)
                        
                    print(f"[RETRY] 429 Quota Exceeded. API requested wait. Sleeping for {wait_time:.1f}s before attempt {attempt + 2}/{max_retries + 1}...")
                    await asyncio.sleep(wait_time)
                    delay *= backoff_factor
        return wrapper
    return decorator
