from fastapi import APIRouter

router = APIRouter(prefix="/api/classroom", tags=["classroom"])

@router.get("/students")
async def get_students():
    """Returns a mock list of students in the classroom."""
    return {
        "students": [
            {
                "id": "std_1",
                "name": "Aarav Sharma",
                "grade": "10th",
                "averageScore": 92.5,
                "attendance": "98%",
                "avatar": "https://i.pravatar.cc/150?u=a042581f4e29026704d"
            },
            {
                "id": "std_2",
                "name": "Diya Patel",
                "grade": "10th",
                "averageScore": 88.0,
                "attendance": "95%",
                "avatar": "https://i.pravatar.cc/150?u=a042581f4e29026704e"
            },
            {
                "id": "std_3",
                "name": "Rohan Gupta",
                "grade": "10th",
                "averageScore": 76.2,
                "attendance": "89%",
                "avatar": "https://i.pravatar.cc/150?u=a042581f4e29026704f"
            },
            {
                "id": "std_4",
                "name": "Ananya Singh",
                "grade": "10th",
                "averageScore": 95.8,
                "attendance": "100%",
                "avatar": "https://i.pravatar.cc/150?u=a042581f4e29026704g"
            },
            {
                "id": "std_5",
                "name": "Kabir Das",
                "grade": "10th",
                "averageScore": 64.5,
                "attendance": "82%",
                "avatar": "https://i.pravatar.cc/150?u=a042581f4e29026704h"
            },
            {
                "id": "std_6",
                "name": "Meera Reddy",
                "grade": "10th",
                "averageScore": 89.4,
                "attendance": "96%",
                "avatar": "https://i.pravatar.cc/150?u=a042581f4e29026704i"
            }
        ]
    }
