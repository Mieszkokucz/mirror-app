import io
import os
import uuid
import zipfile
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import null
from sqlalchemy.orm import Session

from database import get_db
from models.files import File as FileModel
from schemas.files import FileResponse
from services.files import upload_library_file

router = APIRouter()


@router.post("/files/library", response_model=FileResponse, status_code=201)
async def upload_to_library(
    user_id: uuid.UUID = Query(...),
    project_id: Optional[uuid.UUID] = Query(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await upload_library_file(file, user_id, db, project_id)


@router.get("/files/library", response_model=list[FileResponse])
def list_library_files(
    user_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
):
    q = db.query(FileModel).filter(FileModel.user_id == user_id)
    if project_id is not None:
        q = q.filter(FileModel.project_id == project_id)
    return q.all()


@router.get("/files/library/export")
def export_library_files(
    user_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
):
    q = db.query(FileModel).filter(FileModel.user_id == user_id)
    if project_id is not None:
        q = q.filter(FileModel.project_id == project_id)
    else:
        q = q.filter(FileModel.project_id == null())
    files = q.all()
    if not files:
        raise HTTPException(status_code=404, detail="No files found")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        seen = {}
        for f in files:
            count = seen.get(f.filename, 0)
            if count > 0:
                base, ext = os.path.splitext(f.filename)
                name = f"{base}_{count}{ext}"
            else:
                name = f.filename
            seen[f.filename] = count + 1
            try:
                zf.write(f.storage_path, arcname=name)
            except FileNotFoundError:
                raise HTTPException(status_code=500, detail=f"File missing on disk: {f.filename}")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=project_export.zip"},
    )


@router.delete("/files/library/{file_id}", status_code=204)
def delete_library_file(file_id: uuid.UUID, db: Session = Depends(get_db)):
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File not found")
    db.delete(file)
    db.commit()
