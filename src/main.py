"""
AI原生项目协作平台 — FastAPI application entry point.
P0 Foundation: conversational engine + agent skeleton + knowledge base stub.
"""

import os

# ── Supabase store patching (MUST happen before route imports) ──
if os.environ.get("USE_SUPABASE", "false").lower() in ("true", "1", "yes"):
    try:
        from src.stores import patch_stores_for_supabase

        patch_stores_for_supabase()
    except Exception as e:
        print(f"⚠️ Supabase store patch failed: {e}, using memory stores")

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.routes import (
    audit,
    auth,
    chat,
    dashboard,
    documents,
    finance,
    health,
    hr,
    knowledge,
    legal,
    oa,
    projects,
    supervision,
    suppliers,
    ws,
)
from src.api.routes import settings as settings_routes
from src.core.config import settings
from src.core.exceptions import (
    PlatformError,
    http_exception_handler,
    platform_error_handler,
    unhandled_exception_handler,
)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-native project collaboration platform for government bond consulting and EPC projects.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(PlatformError, platform_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError) -> JSONResponse:
    """Return structured 422 errors with field-level detail."""
    errors = []
    for err in exc.errors():
        errors.append(
            {
                "field": ".".join(str(loc) for loc in err["loc"]),
                "message": err["msg"],
                "type": err["type"],
            }
        )
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "detail": {"errors": errors},
        },
    )


app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(projects.task_router, prefix="/api")
app.include_router(projects.activity_router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(hr.router, prefix="/api")
app.include_router(finance.router, prefix="/api")
app.include_router(oa.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(legal.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(supervision.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(settings_routes.router, prefix="/api")
app.include_router(ws.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    import os

    use_sb = os.environ.get("USE_SUPABASE", "false").lower() in ("true", "1", "yes")

    if use_sb:
        # Supabase mode — verify connection (stores already patched at import time)
        try:
            from src.db.client import get_client

            db = get_client()
            r = db.table("projects").select("id").execute()
            print(f"✅ Supabase mode — {len(r.data)} projects in database")
        except Exception as e:
            print(f"⚠️ Supabase connection failed: {e}")
            print("   Data may be unavailable. Restart without USE_SUPABASE=true to use memory stores.")
            use_sb = False

    if not use_sb:
        # In-memory mode — seed all stores
        from src.stores.activity_store import seed_activities
        from src.stores.document_store import seed_documents
        from src.stores.project_store import seed_projects
        from src.stores.task_store import seed_tasks

        seed_projects()
        seed_tasks()
        seed_activities()
        seed_documents()

        from src.stores.audit_store import seed_audit_reports as seed_audit
        from src.stores.finance_store import seed_finance
        from src.stores.hr_store import seed_hr
        from src.stores.legal_store import seed_contracts as seed_legal
        from src.stores.oa_store import seed_oa
        from src.stores.process_store import seed_processes
        from src.stores.procurement_store import seed_procurement
        from src.stores.supervision_store import seed_supervision_records as seed_supervision
        from src.stores.supplier_store import seed_suppliers

        seed_hr()
        seed_finance()
        seed_oa()
        seed_procurement()
        seed_processes()
        seed_legal()
        seed_audit()
        seed_supervision()
        seed_suppliers()
        print("✅ In-memory stores seeded")

    # Register automation rules (works in both modes)
    from src.workflow.automation import register_preset_rules

    register_preset_rules()

    # Initialize RAG singleton (pgvector or memory based on VECTOR_DB_BACKEND)
    from src.knowledge.dependencies import init_rag
    try:
        await init_rag()
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("RAG init failed: %s", exc)


@app.on_event("shutdown")
async def _shutdown_rag() -> None:
    from src.knowledge.dependencies import shutdown_rag
    await shutdown_rag()


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.app_name} v{settings.app_version}"}
