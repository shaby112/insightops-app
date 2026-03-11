from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.v1.endpoints import chat, connections, conversations, dashboards, semantic, sync, blog
from app.db.models import User

api_router = APIRouter()
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(connections.router, prefix="/connections", tags=["connections"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(dashboards.router, prefix="/dashboards", tags=["dashboards"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(semantic.router, prefix="/semantic", tags=["semantic"])
api_router.include_router(blog.router, prefix="/blog", tags=["blog"])


@api_router.get("/me", tags=["authentication"])
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "clerk_id": current_user.clerk_id,
    }
