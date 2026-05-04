import hashlib
import os
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from models.files import File, MessageAttachment

UPLOAD_DIR = "uploads"


async def upload_library_file(
    file: UploadFile, user_id: uuid.UUID, db: Session
) -> File:
    contents = await file.read()
    content_hash = hashlib.sha256(contents).hexdigest()

    ext = os.path.splitext(file.filename)[1]
    storage_path = f"{UPLOAD_DIR}/{user_id}/{uuid.uuid4()}{ext}"

    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    with open(storage_path, "wb") as f:
        f.write(contents)

    db_file = File(
        user_id=user_id,
        filename=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type,
        size_bytes=len(contents),
        content_hash=content_hash,
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


async def upload_message_attachment(
    file: UploadFile, message_id: uuid.UUID, db: Session
) -> MessageAttachment:
    contents = await file.read()

    ext = os.path.splitext(file.filename)[1]
    storage_path = f"{UPLOAD_DIR}/attachments/{message_id}/{uuid.uuid4()}{ext}"

    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    with open(storage_path, "wb") as f:
        f.write(contents)

    db_attachment = MessageAttachment(
        message_id=message_id,
        filename=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type,
        size_bytes=len(contents),
    )
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment
