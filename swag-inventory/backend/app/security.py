from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import SECRET_KEY, TOKEN_HOURS
from .database import get_db
from .models import User

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm="HS256")


def _unauthorized():
    return HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated", headers={"WWW-Authenticate": "Bearer"})


def current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not creds:
        raise _unauthorized()
    try:
        data = jwt.decode(creds.credentials, SECRET_KEY, algorithms=["HS256"])
        user = db.get(User, int(data["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _unauthorized()
    if not user or not user.is_active:
        raise _unauthorized()
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admins only")
    return user


# ---------- branch-level permissions (enforced on the server) ----------
def visible_branch_ids(user: User) -> set[int] | None:
    """None means every branch."""
    if user.role == "admin" or user.all_branches:
        return None
    return {b.id for b in user.branches}


def can_view_branch(user: User, branch_id: int) -> bool:
    ids = visible_branch_ids(user)
    return ids is None or branch_id in ids


def can_edit_branch(user: User, branch_id: int) -> bool:
    return user.role in ("admin", "editor") and can_view_branch(user, branch_id)


def user_out(user: User) -> dict:
    return {
        "id": user.id, "email": user.email, "name": user.name, "role": user.role,
        "all_branches": user.all_branches, "is_active": user.is_active,
        "branch_ids": sorted(b.id for b in user.branches), "created_at": user.created_at,
    }
