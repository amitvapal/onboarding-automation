from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .routes import documents, extraction, vendors

app = FastAPI()

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

app.include_router(extraction.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(documents.router, prefix="/api")

if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/favicon.ico")
    def favicon() -> FileResponse:
        return FileResponse(STATIC_DIR / "favicon.ico")

    @app.get("/")
    def index() -> FileResponse:
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        if full_path.startswith("api/") or full_path.startswith("assets/"):
            raise HTTPException(status_code=404)
        return FileResponse(STATIC_DIR / "index.html")