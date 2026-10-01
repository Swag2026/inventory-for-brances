from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Asset, Branch, Choice, User
from ..schemas import BranchIn, BranchOut, ChoiceIn, ChoiceOut
from ..security import current_user, require_admin

router = APIRouter(prefix="/api", tags=["setup"])


# ---------- branches ----------
@router.get("/branches", response_model=list[BranchOut])
def list_branches(db: Session = Depends(get_db), _: User = Depends(current_user)):
    # names are needed everywhere (request targets, labels); asset data stays permission-filtered
    return db.scalars(select(Branch).order_by(Branch.name)).all()


@router.post("/branches", response_model=BranchOut, status_code=201)
def create_branch(body: BranchIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    name = body.name.strip()
    if db.scalar(select(Branch).where(Branch.name == name)):
        raise HTTPException(409, "Branch already exists")
    brand = body.brand.strip() or name.split("-")[0].strip()
    b = Branch(name=name, brand=brand)
    db.add(b)
    db.commit()
    return b


@router.patch("/branches/{branch_id}", response_model=BranchOut)
def update_branch(branch_id: int, body: BranchIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    b = db.get(Branch, branch_id)
    if not b:
        raise HTTPException(404, "Branch not found")
    name = body.name.strip()
    if db.scalar(select(Branch).where(Branch.name == name, Branch.id != b.id)):
        raise HTTPException(409, "Branch already exists")
    b.name, b.brand = name, body.brand.strip() or name.split("-")[0].strip()
    db.commit()
    return b


@router.delete("/branches/{branch_id}", status_code=204)
def delete_branch(branch_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    b = db.get(Branch, branch_id)
    if not b:
        raise HTTPException(404, "Branch not found")
    if db.scalar(select(func.count()).select_from(Asset).where(Asset.branch_id == b.id)):
        raise HTTPException(400, "Branch still has assets — move or delete them first")
    db.delete(b)
    db.commit()


# ---------- dropdown choices ----------
@router.get("/choices", response_model=list[ChoiceOut])
def list_choices(db: Session = Depends(get_db), _: User = Depends(current_user)):
    return db.scalars(select(Choice).order_by(Choice.kind, Choice.sort, Choice.id)).all()


@router.post("/choices", response_model=ChoiceOut, status_code=201)
def add_choice(body: ChoiceIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    value = body.value.strip()
    if db.scalar(select(Choice).where(Choice.kind == body.kind, Choice.value == value)):
        raise HTTPException(409, "Option already exists")
    last = db.scalar(select(func.max(Choice.sort)).where(Choice.kind == body.kind)) or 0
    c = Choice(kind=body.kind, value=value, sort=last + 1)
    db.add(c)
    db.commit()
    return c


@router.delete("/choices/{choice_id}", status_code=204)
def delete_choice(choice_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    c = db.get(Choice, choice_id)
    if not c:
        raise HTTPException(404, "Option not found")
    db.delete(c)
    db.commit()
