from datetime import datetime
from fastapi import APIRouter, HTTPException, Response
from models.schemas import ExportRequest
from services.xml_generator import MSProjectXMLGenerator
from services.excel_generator import ExcelGenerator
from services.pdf_generator import PDFGenerator

router = APIRouter()
xml_generator = MSProjectXMLGenerator()
excel_generator = ExcelGenerator()
pdf_generator = PDFGenerator()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_tasks(request: ExportRequest) -> list:
    tasks = []
    for module in request.estimation_result.modules:
        for phase in module.phases:
            tasks.append({
                "name": f"{module.module} - {phase.phase}",
                "duration_days": max(1, int(phase.jh / 8)),
                "resources": ["Consultant"],
                "predecessors": [],
            })
    return tasks


def _project_name(request: ExportRequest) -> str:
    if request.wizard_state.project_info:
        return request.wizard_state.project_info.project_title
    return "Projet"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/xml")
async def export_xml(request: ExportRequest):
    """Génère un fichier MS Project XML"""
    try:
        tasks = _build_tasks(request)
        xml = xml_generator.generate(
            project_name=_project_name(request),
            tasks=tasks,
            resources=["Consultant", "Project Manager", "QA"],
            project_start_date=datetime.now().strftime("%Y-%m-%d"),
        )
        return Response(
            content=xml,
            media_type="application/xml",
            headers={"Content-Disposition": "attachment; filename=project.xml"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/excel")
async def export_excel(request: ExportRequest):
    """Génère un fichier Excel avec le récapitulatif de l'estimation"""
    try:
        content = excel_generator.generate(
            project_name=_project_name(request),
            wizard_state=request.wizard_state,
            estimation_result=request.estimation_result,
        )
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=estimation.xlsx"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf")
async def export_pdf(request: ExportRequest):
    """Génère un fichier PDF récapitulatif du projet"""
    try:
        content = pdf_generator.generate(
            project_name=_project_name(request),
            wizard_state=request.wizard_state,
            estimation_result=request.estimation_result,
        )
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=estimation.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))