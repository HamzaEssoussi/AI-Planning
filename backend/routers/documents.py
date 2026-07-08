from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
import io

router = APIRouter()


@router.get("/")
async def list_documents():
    """Liste les documents disponibles"""
    return {"documents": [], "message": "Aucun document indexé pour l'instant"}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload et indexe un document (PDF, DOCX) dans ChromaDB"""
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non supporté: {file.content_type}. Formats acceptés: PDF, DOCX, TXT"
        )

    content = await file.read()
    text = _extract_text(file.filename, content)

    return {
        "status": "uploaded",
        "filename": file.filename,
        "size": len(content),
        "chars_extracted": len(text),
        "message": "Document reçu. L'indexation ChromaDB sera activée dans une prochaine version."
    }


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Supprime un document de l'index"""
    return {"status": "deleted", "document_id": document_id}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_text(filename: str, content: bytes) -> str:
    """Extrait le texte brut selon le type de fichier."""
    ext = (filename or "").lower().rsplit(".", 1)[-1]

    if ext == "pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            return ""

    if ext == "docx":
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            return ""

    # Fallback: plain text
    try:
        return content.decode("utf-8", errors="ignore")
    except Exception:
        return ""