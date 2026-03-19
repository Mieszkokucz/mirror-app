import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db

import os
from dotenv import load_dotenv

from models.reflections import Users
from models.reflections import DailyReflection


load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")


engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    user = Users(nick="testuser")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    yield user


@pytest.fixture
def test_reflection(db_session, test_user):
    reflection = DailyReflection(
        user_id=test_user.id,
        reflection_type="morning",
        date="2026-03-19",
        content="test",
    )
    db_session.add(reflection)
    db_session.commit()
    db_session.refresh(reflection)

    yield reflection


@pytest.fixture
def test_session(db_session, test_user):
    reflection = DailyReflection(
        user_id=test_user.id,
        reflection_type="morning",
        date="2026-03-19",
        content="test",
    )
    db_session.add(reflection)
    db_session.commit()
    db_session.refresh(reflection)

    yield reflection
