from fastapi import APIRouter

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

@router.get("/")
async def get_assignments():
    """Returns a mock list of assignments."""
    return {
        "active": [],
        "graded": []
    }
