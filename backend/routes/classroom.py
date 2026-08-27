from fastapi import APIRouter

router = APIRouter(prefix="/api/classroom", tags=["classroom"])

@router.get("/students")
async def get_students():
    """Returns a mock list of students in the classroom."""
    return {
        "students": []
    }
