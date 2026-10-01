from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Branch, User
from ..schemas import UserCreate, UserOut, UserUpdate
from ..security import hash_password, require_admin, user_out

router = APIRouter(prefix="/api/users", tags=["users"])


def _branches(db: Session, ids: list[int]) -> list[Branch]:
    found = db.scalars(select(Branch).where(Branch.id.in_(ids))).all() if ids else []
    if len(found) != len(set(ids)):
        raise HTTPException(400, "Unknown branch selected")
    return list(found)


def _active_admins(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.role == "admin", User.is_active.is_(True)))


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return [user_out(u) for u in db.scalars(select(User).order_by(User.name)).all()]


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    email = body.email.strip().lower()
    if "@" not in email:
        raise HTTPException(400, "Invalid email")
    if db.scalar(select(User).where(func.lower(User.email) == email)):
        raise HTTPException(409, "A user with this email already exists")
    user = User(email=email, name=body.name.strip(), password_hash=hash_password(body.password), role=body.role,
                all_branches=body.all_branches, is_active=body.is_active)
    user.branches = _branches(db, body.branch_ids)
    db.add(user)
    db.commit()
    return user_out(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), me: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    losing_admin = (body.role is not None and body.role != "admin") or body.is_active is False
    if user.role == "admin" and losing_admin:
        if user.id == me.id:
            raise HTTPException(400, "You cannot remove your own admin access")
        if _active_admins(db) <= 1:
            raise HTTPException(400, "At least one active admin is required")
    if body.email is not None:
        email = body.email.strip().lower()
        other = db.scalar(select(User).where(func.lower(User.email) == email, User.id != user.id))
        if other:
            raise HTTPException(409, "A user with this email already exists")
        user.email = email
    if body.name is not None:
        user.name = body.name.strip()
    if body.password:
        user.password_hash = hash_password(body.password)
    if body.role is not None:
        user.role = body.role
    if body.all_branches is not None:
        user.all_branches = body.all_branches
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.branch_ids is not None:
        user.branches = _branches(db, body.branch_ids)
    db.commit()
    return user_out(user)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), me: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == me.id:
        raise HTTPException(400, "You cannot delete yourself")
    if user.role == "admin" and user.is_active and _active_admins(db) <= 1:
        raise HTTPException(400, "At least one active admin is required")
    db.delete(user)
    db.commit()
