from fastapi import FastAPI
from routers.reflections import router as reflections_router
from routers.chat import router as chat_router
from routers.system_prompts import router as system_prompts_router
from routers.files import router as files_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reflections_router)
app.include_router(chat_router)
app.include_router(system_prompts_router)
app.include_router(files_router)
