import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal, Task
from app.goals.schemas import GoalCreate, GoalUpdate, TaskCreate, TaskUpdate

async def get_goals_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[Goal]:
    result = await db.execute(
        select(Goal)
        .filter(Goal.user_id == user_id, Goal.deleted_at == None)
        .order_by(Goal.created_at.desc())
    )
    return list(result.scalars().all())

async def get_goal_by_id(db: AsyncSession, goal_id: uuid.UUID, user_id: uuid.UUID) -> Goal | None:
    result = await db.execute(
        select(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == user_id, Goal.deleted_at == None)
    )
    return result.scalars().first()

async def create_goal(db: AsyncSession, goal_in: GoalCreate, user_id: uuid.UUID) -> Goal:
    db_goal = Goal(
        user_id=user_id,
        title=goal_in.title,
        description=goal_in.description,
        target_date=goal_in.target_date,
        progress=0.0,
        status="todo"
    )
    db.add(db_goal)
    await db.flush()

    if goal_in.tasks:
        for t in goal_in.tasks:
            db_task = Task(
                goal_id=db_goal.id,
                title=t.title,
                description=t.description,
                status="todo",
                due_date=t.due_date
            )
            db.add(db_task)
        await db.flush()
        # Initial progress is 0.0, so no need to recalculate

    await db.commit()
    await db.refresh(db_goal)
    return db_goal

async def update_goal(db: AsyncSession, db_goal: Goal, goal_in: GoalUpdate) -> Goal:
    for field, value in goal_in.model_dump(exclude_unset=True).items():
        setattr(db_goal, field, value)
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal

async def delete_goal(db: AsyncSession, db_goal: Goal) -> None:
    now = datetime.now(timezone.utc)
    db_goal.deleted_at = now
    db.add(db_goal)
    
    # Soft delete all child tasks
    for task in db_goal.tasks:
        if task.deleted_at is None:
            task.deleted_at = now
            db.add(task)
            
    await db.commit()

async def create_task(db: AsyncSession, goal_id: uuid.UUID, task_in: TaskCreate) -> Task:
    db_task = Task(
        goal_id=goal_id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        due_date=task_in.due_date
    )
    db.add(db_task)
    await db.flush()
    await db.commit()
    await db.refresh(db_task)
    return db_task

async def update_task(db: AsyncSession, db_task: Task, task_in: TaskUpdate) -> Task:
    for field, value in task_in.model_dump(exclude_unset=True).items():
        setattr(db_task, field, value)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

async def delete_task(db: AsyncSession, db_task: Task) -> None:
    db_task.deleted_at = datetime.now(timezone.utc)
    db.add(db_task)
    await db.commit()

async def recalculate_goal_progress(db: AsyncSession, goal_id: uuid.UUID) -> None:
    # Refresh to fetch the latest state of relationship tasks
    result = await db.execute(
        select(Goal)
        .filter(Goal.id == goal_id, Goal.deleted_at == None)
    )
    db_goal = result.scalars().first()
    if not db_goal:
        return

    active_tasks = [t for t in db_goal.tasks if t.deleted_at is None]
    total_tasks = len(active_tasks)
    
    if total_tasks > 0:
        completed_tasks = sum(1 for t in active_tasks if t.status == "completed")
        db_goal.progress = round((completed_tasks / total_tasks) * 100, 2)
        
        # Adjust status based on progress
        if db_goal.progress == 100.0:
            db_goal.status = "completed"
        elif db_goal.progress > 0.0:
            db_goal.status = "in_progress"
        else:
            db_goal.status = "todo"
    else:
        db_goal.progress = 0.0
        db_goal.status = "todo"

    db.add(db_goal)
    await db.commit()
