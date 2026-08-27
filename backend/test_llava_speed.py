import asyncio
import ollama
import time

async def test():
    print("Testing llava speed...")
    client = ollama.AsyncClient(host="http://localhost:11434")
    
    start_time = time.time()
    try:
        response = await client.chat(
            model="llava",
            messages=[{
                'role': 'user',
                'content': 'What is this?',
                'images': ["iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="]
            }]
        )
        elapsed = time.time() - start_time
        print(f"Success! Took {elapsed:.2f} seconds.")
    except Exception as e:
        print(f"Failed: {e}")

asyncio.run(test())
