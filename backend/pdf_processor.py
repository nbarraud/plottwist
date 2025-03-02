# File: pdf_processor.py
import asyncio
from pypdf import PdfReader
import io

async def process_pdf(file_path: str) -> dict:
    """
    Extract text and structure from a PDF file
    Returns dictionary with raw text and metadata
    """
    # Run PDF processing in a separate thread to avoid blocking
    def extract_text():
        try:
            text_content = []
            metadata = {}
            
            # Open and read the PDF file
            with open(file_path, "rb") as file:
                pdf = PdfReader(file)
                
                # Extract metadata
                if pdf.metadata:
                    metadata = {
                        "title": pdf.metadata.get("/Title", ""),
                        "author": pdf.metadata.get("/Author", ""),
                        "pages": len(pdf.pages)
                    }
                else:
                    metadata = {
                        "title": "",
                        "author": "",
                        "pages": len(pdf.pages)
                    }
                
                # Extract text from each page
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        text_content.append({
                            "page": i + 1,
                            "content": text
                        })
                    else:
                        text_content.append({
                            "page": i + 1,
                            "content": f"[Page {i+1} has no extractable text]"
                        })
                
                # If no text was extracted at all, add a placeholder
                if not text_content:
                    text_content.append({
                        "page": 1,
                        "content": "This document appears to have no extractable text content."
                    })
                
            return {
                "metadata": metadata,
                "content": text_content
            }
        except Exception as e:
            print(f"Error extracting PDF content: {str(e)}")
            # Return minimal content to avoid breaking the pipeline
            return {
                "metadata": {"title": "", "author": "", "pages": 0},
                "content": [{"page": 1, "content": "Error extracting content from PDF."}]
            }
    
    # Run in thread pool to avoid blocking the event loop
    return await asyncio.to_thread(extract_text)