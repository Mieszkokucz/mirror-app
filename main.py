from fastapi import FastAPI
from routers.reflections import router as reflections_router
from routers.chat import router as chat_router


app = FastAPI()

app.include_router(reflections_router)
app.include_router(chat_router)
