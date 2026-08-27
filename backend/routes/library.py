from fastapi import APIRouter

router = APIRouter(prefix="/api/library", tags=["library"])

@router.get("/")
async def get_library_documents():
    """Returns a mock list of documents in the library."""
    return {
        "documents": [
            {
                "id": "doc_1",
                "title": "CBSE 10th Math Previous Year (2023)",
                "type": "Question Paper",
                "size": "2.4 MB",
                "date": "2024-01-15"
            },
            {
                "id": "doc_2",
                "title": "Science Rubric - Final Exam",
                "type": "Grading Rubric",
                "size": "850 KB",
                "date": "2024-02-10"
            },
            {
                "id": "doc_3",
                "title": "English Literature Assignment Template",
                "type": "Template",
                "size": "1.2 MB",
                "date": "2024-03-05"
            },
            {
                "id": "doc_4",
                "title": "History Chapter 4 Notes",
                "type": "Study Material",
                "size": "4.1 MB",
                "date": "2024-03-20"
            }
        ]
    }
