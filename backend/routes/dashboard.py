from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/")
async def get_dashboard_data():
    """Returns mock data for the Home Dashboard."""
    return {
        "stats": {
            "totalStudents": 145,
            "averageGrade": 82.4,
            "assignmentsPending": 12,
            "classesActive": 5
        },
        "recentActivity": [
            {"id": "act_1", "type": "grading_complete", "title": "Physics Midterm", "time": "2 hours ago", "icon": "check"},
            {"id": "act_2", "type": "new_submission", "title": "Algebra Worksheet 4", "time": "5 hours ago", "icon": "file"},
            {"id": "act_3", "type": "system", "title": "VedaAI model updated", "time": "1 day ago", "icon": "zap"}
        ],
        "upcomingTasks": [
            {"id": "task_1", "title": "Grade Biology Essays", "dueDate": "Tomorrow"},
            {"id": "task_2", "title": "Prepare Chemistry Quiz", "dueDate": "In 3 days"}
        ]
    }
