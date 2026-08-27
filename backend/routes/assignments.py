from fastapi import APIRouter

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

@router.get("/")
async def get_assignments():
    """Returns a mock list of assignments."""
    return {
        "active": [
            {
                "id": "asn_1",
                "title": "Algebra Linear Equations Worksheet",
                "class": "10th Grade Math",
                "dueDate": "2024-11-20",
                "submittedCount": 24,
                "totalCount": 30,
                "status": "collecting"
            },
            {
                "id": "asn_2",
                "title": "Physics Lab Report - Pendulum",
                "class": "10th Grade Science",
                "dueDate": "2024-11-25",
                "submittedCount": 5,
                "totalCount": 30,
                "status": "collecting"
            }
        ],
        "graded": [
            {
                "id": "asn_3",
                "title": "Midterm Examination",
                "class": "10th Grade Math",
                "gradedCount": 30,
                "totalCount": 30,
                "averageScore": "82%",
                "status": "completed"
            },
            {
                "id": "asn_4",
                "title": "Trigonometry Basics Quiz",
                "class": "10th Grade Math",
                "gradedCount": 30,
                "totalCount": 30,
                "averageScore": "78%",
                "status": "completed"
            }
        ]
    }
