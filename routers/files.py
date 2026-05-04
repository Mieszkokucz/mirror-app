from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from database import get_db
from sqlalchemy.orm import Session
from models.files import File as FileModel
from schemas.files import FileResponse
from services.files import upload_library_file
import uuid

router = APIRouter()


@router.post("/files/library", response_model=FileResponse, status_code=201)
async def upload_to_library(
    user_id: uuid.UUID = Query(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await upload_library_file(file, user_id, db)


@router.get("/files/library", response_model=list[FileResponse])
def list_library_files(user_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(FileModel).filter(FileModel.user_id == user_id).all()


@router.delete("/files/library/{file_id}", status_code=204)
def delete_library_file(file_id: uuid.UUID, db: Session = Depends(get_db)):
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File not found")
    db.delete(file)
    db.commit()
