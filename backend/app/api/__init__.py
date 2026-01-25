from fastapi import APIRouter

from app.api import auth, users, kids, records, community, ai

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(kids.router)
api_router.include_router(records.router)
api_router.include_router(community.router)
api_router.include_router(ai.router)
