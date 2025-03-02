# File: main.py
from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, HTTPException


from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid  # Add this import for UUID generation

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, ResponseValidationError
import sys
import os
import traceback

# Import our processing modules
from pdf_processor import process_pdf
from book_analyzer import analyze_book
from vn_generator import generate_visual_novel

# Create the FastAPI app - THIS WAS MISSING
app = FastAPI(title="PlotTwist API", description="API for converting books to visual novels")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
            "http://localhost:8080", 
            "http://127.0.0.1:8080",
            "https://plottwist.onrender.com"  # Add your frontend URL
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Book(BaseModel):
    id: str
    title: str
    author: str
    file_path: str
    status: str  # 'uploading', 'processing', 'analyzing', 'generating', 'ready'
    progress: int  # 0-100
    script_id: Optional[str] = None
    error: Optional[str] = None

class Character(BaseModel):
    id: str
    image: str

class DialogueChoice(BaseModel):
    text: str
    nextScene: str

class DialogueLine(BaseModel):
    speaker: str
    text: str
    character: Optional[str] = None
    choices: Optional[List[DialogueChoice]] = None

class Scene(BaseModel):
    id: str
    background: str
    characters: List[Character] = []
    dialogue: List[DialogueLine] = []

class VNScript(BaseModel):
    id: str
    book_id: str
    title: Optional[str] = None
    scenes: List[Scene] = []

# In-memory storage (replace with database in production)
books = {}
scripts = {}

# Create upload directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)

# Background task to process book
async def process_book_task(book_id: str, file_path: str):
    try:
        # Update status to processing
        books[book_id]["status"] = "processing"
        books[book_id]["progress"] = 10
        print(f"Processing book {book_id}: Extracting PDF content")
        
        # Extract text from PDF
        book_content = await process_pdf(file_path)
        books[book_id]["progress"] = 30
        print(f"Processing book {book_id}: PDF extraction complete, analyzing content")
        
        # Analyze book content
        books[book_id]["status"] = "analyzing"
        book_analysis = await analyze_book(book_content)
        books[book_id]["progress"] = 60
        print(f"Processing book {book_id}: Analysis complete, generating script")
        
        # Generate visual novel script
        books[book_id]["status"] = "generating"
        vn_script = await generate_visual_novel(book_analysis)
        books[book_id]["progress"] = 90
        print(f"Processing book {book_id}: Script generation complete")
        
        # Save the generated script
        script_id = str(uuid.uuid4())
        
        # Format script according to our model structure
        formatted_script = {
            "id": script_id,
            "book_id": book_id,
            "title": vn_script.get("title", books[book_id]["title"]),
            "scenes": []
        }
        
        # Ensure scenes have the correct structure
        for scene in vn_script.get("scenes", []):
            formatted_scene = {
                "id": scene["id"],
                "background": scene["background"],
                "characters": [],
                "dialogue": []
            }
            
            # Format characters
            for char in scene.get("characters", []):
                formatted_scene["characters"].append({
                    "id": char["id"],
                    "image": char["image"]
                })
            
            # Format dialogue
            for dialogue in scene.get("dialogue", []):
                formatted_dialogue = {
                    "speaker": dialogue["speaker"],
                    "text": dialogue["text"]
                }
                
                # Add optional fields if present
                if "character" in dialogue:
                    formatted_dialogue["character"] = dialogue["character"]
                
                if "choices" in dialogue:
                    formatted_dialogue["choices"] = []
                    for choice in dialogue["choices"]:
                        formatted_dialogue["choices"].append({
                            "text": choice["text"],
                            "nextScene": choice["nextScene"]
                        })
                
                formatted_scene["dialogue"].append(formatted_dialogue)
            
            formatted_script["scenes"].append(formatted_scene)
        
        scripts[script_id] = formatted_script
        
        # Update book status to ready
        books[book_id]["status"] = "ready"
        books[book_id]["progress"] = 100
        books[book_id]["script_id"] = script_id
        print(f"Processing book {book_id}: Complete! Book is ready")
        
    except Exception as e:
        # Handle errors
        books[book_id]["status"] = "error"
        books[book_id]["error"] = str(e)
        print(f"Error processing book {book_id}: {e}")
        import traceback
        traceback.print_exc()

@app.get("/")
async def root():
    return {"message": "API is running"}
    
# Routes
@app.post("/api/books/upload", response_model=Book)
async def upload_book(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    author: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        # Print debugging info
        print(f"Received upload request - Title: {title}, Author: {author}, File: {file.filename}")
        
        # Generate unique ID for the book
        book_id = str(uuid.uuid4())
        
        # Save uploaded file
        file_path = f"uploads/{book_id}.pdf"
        try:
            contents = await file.read()
            print(f"File size: {len(contents)} bytes")
            with open(file_path, "wb") as buffer:
                buffer.write(contents)
            print(f"File saved to {file_path}")
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
        
        # Create book record
        book = {
            "id": book_id,
            "title": title,
            "author": author,
            "file_path": file_path,
            "status": "uploading",
            "progress": 0
        }
        books[book_id] = book
        
        # Start processing in background
        background_tasks.add_task(process_book_task, book_id, file_path)
        
        return book
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


@app.get("/api/books", response_model=List[Book])
async def get_books():
    return list(books.values())

@app.get("/api/books/{book_id}", response_model=Book)
async def get_book(book_id: str):
    if book_id not in books:
        raise HTTPException(status_code=404, detail="Book not found")
    return books[book_id]

@app.get("/api/books/{book_id}/script", response_model=VNScript)
async def get_script(book_id: str):
    if book_id not in books:
        raise HTTPException(status_code=404, detail="Book not found")
    
    book = books[book_id]
    if book["status"] != "ready":
        raise HTTPException(status_code=400, detail="Script not ready")
    
    script_id = book.get("script_id")
    if not script_id or script_id not in scripts:
        raise HTTPException(status_code=404, detail="Script not found")
    
    # Get the raw script
    raw_script = scripts[script_id]
    
    # Format it according to our model
    formatted_script = {
        "id": raw_script["id"],
        "book_id": book_id,
        "title": raw_script.get("title", book["title"]),
        "scenes": []
    }
    
    # Format each scene to match our Scene model
    for scene in raw_script.get("scenes", []):
        formatted_scene = {
            "id": scene["id"],
            "background": scene["background"],
            "characters": [],
            "dialogue": []
        }
        
        # Format characters
        for char in scene.get("characters", []):
            formatted_scene["characters"].append({
                "id": char["id"],
                "image": char["image"]
            })
        
        # Format dialogue
        for dialogue in scene.get("dialogue", []):
            formatted_dialogue = {
                "speaker": dialogue["speaker"],
                "text": dialogue["text"]
            }
            
            # Add optional fields if present
            if "character" in dialogue:
                formatted_dialogue["character"] = dialogue["character"]
            
            if "choices" in dialogue:
                formatted_dialogue["choices"] = []
                for choice in dialogue["choices"]:
                    formatted_dialogue["choices"].append({
                        "text": choice["text"],
                        "nextScene": choice["nextScene"]
                    })
            
            formatted_scene["dialogue"].append(formatted_dialogue)
        
        formatted_script["scenes"].append(formatted_scene)
    
    return formatted_script


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    error_details = []
    for error in exc.errors():
        error_details.append({
            "loc": error["loc"],
            "msg": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": error_details
        }
    )

@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(request, exc):
    error_details = []
    for error in exc.errors():
        error_details.append({
            "loc": error["loc"],
            "msg": error["msg"],
            "type": error["type"]
        })
    
    print("Response validation error:")
    for error in error_details:
        print(f"- Path: {'.'.join(str(x) for x in error['loc'])}, Message: {error['msg']}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "The server encountered an error while processing your request.",
            "errors": error_details
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    # Print the full traceback for debugging
    print("Unhandled exception:")
    traceback.print_exception(type(exc), exc, exc.__traceback__)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred.",
            "error": str(exc)
        }
    )

@app.get("/api/scenes/{scene_id}", response_model=Scene)
async def get_scene(scene_id: str, book_id: str):
    """
    Dynamically generate a scene if it doesn't already exist.
    Used for runtime scene generation when players reach new scenes.
    """
    if book_id not in books:
        raise HTTPException(status_code=404, detail="Book not found")
    
    book = books[book_id]
    
    # Check if we have a script for this book
    script_id = book.get("script_id")
    if not script_id or script_id not in scripts:
        raise HTTPException(status_code=404, detail="Script not found")
    
    script = scripts[script_id]
    
    # Check if this scene already exists in the script
    scene = next((s for s in script["scenes"] if s["id"] == scene_id), None)
    if scene:
        return scene
    
    # If scene doesn't exist, generate it
    try:
        # Initialize OpenAI client
        client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", "your-openai-api-key"))
        
        # Generate the new scene
        new_scene = await vn_generator.generate_next_scene(scene_id, client)
        
        # Add the scene to the script
        script["scenes"].append(new_scene)
        
        # Update the scene graph in the generator
        vn_generator.update_scene_graph(script)
        
        return new_scene
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate scene: {str(e)}")
        
# Serve static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)