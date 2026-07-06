from typing import Any

from fastapi import APIRouter, Depends

from app.ai.schemas import AIChatRequest, AIChatResponse, SuggestedGoal, SuggestedTask
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.post("/chat", response_model=AIChatResponse)
async def post_ai_chat(
    payload: AIChatRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    msg = payload.message.lower()
    
    # 1. Parse intent and customize template response
    if "python" in msg:
        response_text = (
            "Excellent choice! Python is one of the most versatile languages, perfect for backend development, "
            "data science, and automation. I've designed a specialized learning path to get you from absolute "
            "basics to object-oriented programming. Review the suggested goal blueprint below!"
        )
        suggested_goals = [
            SuggestedGoal(
                title="Master Python Programming",
                description="Acquire core Python scripting competencies, OOP principles, and basic automation logic.",
                tasks=[
                  SuggestedTask(title="Install Python 3.11 & configure VS Code environment"),
                  SuggestedTask(title="Learn variables, data types, and list operations"),
                  SuggestedTask(title="Build a command-line calculator with control flows"),
                  SuggestedTask(title="Understand function definitions, args/kwargs, and scopes"),
                  SuggestedTask(title="Implement OOP classes, inheritance, and exception handling"),
                ]
            )
        ]
    elif "flutter" in msg or "dart" in msg or "mobile" in msg:
        response_text = (
            "Mobile development with Flutter is highly lucrative and offers amazing developer velocity. "
            "To help you build premium responsive layouts and manage state cleanly, I have generated a "
            "learning plan centering on Dart, Riverpod, and Hive offline caches."
        )
        suggested_goals = [
            SuggestedGoal(
                title="Master Dart & Flutter Development",
                description="Scaffold responsive layouts, integrate Riverpod state, and implement offline caching structures.",
                tasks=[
                  SuggestedTask(title="Download Flutter SDK & configure Android Emulator / Xcode"),
                  SuggestedTask(title="Learn Dart async/await, futures, and stream behaviors"),
                  SuggestedTask(title="Build a multi-viewport app layout with Cupertino icons"),
                  SuggestedTask(title="Connect flutter_riverpod provider state streams"),
                  SuggestedTask(title="Configure local Hive storage box caches"),
                ]
            )
        ]
    elif "fitness" in msg or "health" in msg or "workout" in msg or "gym" in msg:
        response_text = (
            "Productivity isn't just about code—maintaining physical wellness directly drives mental clarity and focus. "
            "I've compiled a balanced wellness goal to establish positive exercise, hydration, and sleep habits."
        )
        suggested_goals = [
            SuggestedGoal(
                title="Physical Strength & Wellness routine",
                description="Establish a consistent routine focusing on exercise, hydration, and restorative sleep patterns.",
                tasks=[
                  SuggestedTask(title="Complete 3 strength training workouts this week"),
                  SuggestedTask(title="Drink 3 liters of water daily"),
                  SuggestedTask(title="Limit screen time 1 hour before sleeping"),
                  SuggestedTask(title="Log a minimum of 7.5 hours of sleep nightly"),
                  SuggestedTask(title="Do a 15-minute mobility stretching routine"),
                ]
            )
        ]
    else:
        # Default productivity suggestions
        response_text = (
            "Welcome! I am your Progression AI Coach. You can ask me to plan custom learning milestones (e.g. "
            "'learn python', 'build a mobile app') or structure productivity routines. Based on your prompt, "
            "I've generated a high-impact daily focus routine to boost your completion velocity."
        )
        suggested_goals = [
            SuggestedGoal(
                title="Boost Daily Focus & Velocity",
                description="Maximize productivity using distraction blockings, priority scoping, and end-of-day reviews.",
                tasks=[
                  SuggestedTask(title="Determine top 3 priority tasks before noon"),
                  SuggestedTask(title="Block 2 hours of distraction-free deep work"),
                  SuggestedTask(title="Limit social media/news checks to 15 mins daily"),
                  SuggestedTask(title="Perform a 10-minute end-of-day progression log"),
                ]
            )
        ]

    return AIChatResponse(
        response=response_text,
        suggested_goals=suggested_goals
    )
