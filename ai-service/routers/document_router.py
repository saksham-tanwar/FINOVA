from fastapi import APIRouter, File, HTTPException, UploadFile

from services.document_processor import extract_document_data


router = APIRouter(prefix="/ai", tags=["document"])


@router.post("/document-extract")
async def document_extract(file: UploadFile = File(...)):
    content = await file.read()

    try:
        return extract_document_data(content, file.content_type)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
