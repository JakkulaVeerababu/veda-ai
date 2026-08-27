from fastapi import APIRouter

router = APIRouter(prefix="/api/library", tags=["library"])

@router.get("/")
async def get_library_documents():
    """Returns a mock list of documents in the library."""
    return {
        "documents": []
    }
