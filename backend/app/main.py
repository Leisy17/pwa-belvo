from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <- importar

from app.controllers import auth as auth_controller
from app.controllers import banks as banks_controller

app = FastAPI(title="PWA Belvo Backend")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://fabulous-inspiration-production-b1f5.up.railway.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller.router, prefix="/api")
app.include_router(banks_controller.router, prefix="/api")
app.include_router(banks_controller.accounts_router, prefix="/api")

@app.get("/api/health", tags=["health"])  # pragma: no cover
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
