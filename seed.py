from database import SessionLocal
from models.reflections import Users


def seed():
    db = SessionLocal()
    user_id = "b2769e58-414b-4d6e-b7b2-643db1616bda"
    existing = db.query(Users).filter(Users.id == user_id).first()
    if not existing:
        db.add(Users(id=user_id, nick="FirstUser"))
        db.commit()
    db.close()


if __name__ == "__main__":
    seed()
