from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
import os
import glob
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter()

class BlogPostCreate(BaseModel):
    slug: str
    title: str
    description: str
    author: str
    content: str
    date: Optional[str] = None

# Temporary directory for blog posts until we switch to DB
# For this monorepo setup where frontend is parallel to backend parent, we traverse up
BLOG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../../kuantra-website/src/content/blog"))

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_blog_post(post: BlogPostCreate, current_user: User = Depends(get_current_user)):
    """
    Create a new blog post markdown file.
    Only authenticated users can do this.
    """
    if not os.path.exists(BLOG_DIR):
        try:
            os.makedirs(BLOG_DIR, exist_ok=True)
        except Exception as e:
            pass # Ignore if we can't create, let open() fail later if still doesn't exist
            
    file_path = os.path.join(BLOG_DIR, f"{post.slug}.md")
    
    if os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Blog post with this slug already exists.")
        
    import datetime
    post_date = post.date or datetime.datetime.now().strftime("%Y-%m-%d")
    
    markdown_content = f"""---
title: {post.title}
description: {post.description}
date: {post_date}
author: {post.author}
---

{post.content}
"""
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write blog post: {e}")
        
    return {"message": "Blog post created successfully", "slug": post.slug}

@router.get("/")
async def list_blog_posts(current_user: User = Depends(get_current_user)):
    """List all blog posts from the directory."""
    if not os.path.exists(BLOG_DIR):
        return []
        
    posts = []
    for file_path in glob.glob(f"{BLOG_DIR}/*.md"):
        slug = os.path.basename(file_path).replace(".md", "")
        posts.append({"slug": slug})
        
    return posts
