from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/")
async def get_dashboard_data():
    """Returns mock data for the Home Dashboard."""
    return {
        "stats": {
            "totalStudents": 0,
            "averageGrade": 0,
            "assignmentsPending": 0,
            "classesActive": 0
        },
        "recentActivity": [],
        "upcomingTasks": []
    }
