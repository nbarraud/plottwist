# File: book_analyzer.py
import asyncio
import json
import re
import os
from typing import Dict, List, Any
from openai import AsyncOpenAI  # For OpenAI models

# Import Google Gemini library for better analysis
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Google Generative AI package not available. To install: pip install google-generativeai")

async def analyze_book(book_content: dict) -> dict:
    """
    Analyze the book content using AI to extract characters, settings, and plot
    Returns structured book data
    """
    # Try Gemini first if available, then fall back to OpenAI
    if GEMINI_AVAILABLE and os.environ.get("GEMINI_API_KEY"):
        try:
            return await analyze_with_gemini(book_content)
        except Exception as e:
            print(f"Gemini analysis failed: {str(e)}. Falling back to OpenAI.")
            return await analyze_with_openai(book_content)
    else:
        return await analyze_with_openai(book_content)

async def analyze_with_gemini(book_content: dict) -> dict:
    """
    Use Google's Gemini for deep contextual analysis of the book
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    
    # Configure Gemini
    genai.configure(api_key=api_key)
    
    # Extract text from the book content
    book_text = ""
    for page in book_content["content"]:
        book_text += page["content"] + "\n\n"
    
    # For large books, take strategic samples
    sample_text = book_text
    if len(book_text) > 30000:  # Gemini can handle more context
        first_part = book_text[:8000]
        middle_part = book_text[len(book_text)//2-4000:len(book_text)//2+4000]
        last_part = book_text[-8000:]
        sample_text = f"{first_part}\n\n[...]\n\n{middle_part}\n\n[...]\n\n{last_part}"
    
    print(f"Analyzing book with Gemini: {len(sample_text)} characters of text")
    
    # Create prompt for Gemini
    prompt = f"""
    You are a literary analyst with expertise in deep narrative analysis. Your task is to thoroughly analyze this book excerpt and create a comprehensive breakdown suitable for adaptation into an interactive visual novel.

    BOOK METADATA:
    Title: {book_content["metadata"].get("title", "Unknown")}
    Author: {book_content["metadata"].get("author", "Unknown")}
    Pages: {book_content["metadata"].get("pages", 0)}
    
    BOOK EXCERPT:
    {sample_text}
    
    IMPORTANT: Extract the following elements with deep detail:
    
    1. CHARACTERS: For each major character (at least 5):
       - Name and role in the story
       - Detailed physical description
       - Personality traits and defining characteristics
       - Speech patterns and typical expressions
       - Motivations and desires
       - Relationships with other characters
       - Arc throughout the story
    
    2. SETTINGS: For each important location (at least 3):
       - Name and physical description
       - Atmosphere and mood
       - Significance to the plot
       - Cultural or historical context
    
    3. PLOT ANALYSIS:
       - Detailed summary capturing the essence of the story
       - Clear identification of the central conflict
       - Well-defined story arc with at least 8 key plot points
       - Potential branching points where the story could go in different directions
       - Major themes and motifs
       - Significant symbols or objects
       - Tone and atmosphere
    
    FORMAT YOUR RESPONSE AS A JSON OBJECT with this exact structure:
    
    {{
    "characters": [
        {{
        "id": "char_id",
        "name": "Full Name",
        "role": "Role in story",
        "description": "Detailed physical description",
        "personality": "Detailed personality traits",
        "speech_patterns": "How they typically speak",
        "motivations": "What drives them",
        "relationships": "Connections to other characters",
        "arc": "Character development through the story",
        "importance": "high/medium/low"
        }}
    ],
    "settings": [
        {{
        "id": "setting_id",
        "name": "Setting Name",
        "description": "Detailed physical description",
        "atmosphere": "Mood and feeling of the place",
        "significance": "Importance to the plot"
        }}
    ],
    "plot": {{
        "summary": "Comprehensive plot summary capturing all major elements",
        "central_conflict": "Main tension driving the story",
        "key_points": [
        "First major plot point",
        "Second major plot point",
        "etc."
        ],
        "branching_points": [
        {{
            "description": "Potential choice point",
            "options": ["Option 1", "Option 2", "Option 3"]
        }}
        ]
    }},
    "themes": ["theme1", "theme2", "etc."],
    "symbols": ["symbol1", "symbol2", "etc."],
    "tone": "Overall tone of the story"
    }}
    
    Focus on providing DEEP, RICH DETAILS for each element. No generalities or placeholders.
    """
    
    # Create a Gemini model instance with thinking capabilities
    model = genai.GenerativeModel('gemini-2.0-flash-thinking-exp-01-21')
    
    # Generate content with the model
    response = model.generate_content(prompt)
    
    # Process the response
    try:
        # Extract the JSON part from the response
        analysis_text = response.text
        
        # Look for JSON content within the response
        json_match = re.search(r'```json\s*(.*?)\s*```', analysis_text, re.DOTALL)
        if json_match:
            analysis_text = json_match.group(1)
        
        # Try to parse as JSON
        analysis_data = json.loads(analysis_text)
        
        # Validate and clean up the analysis data
        analysis_data = validate_analysis_data(analysis_data, book_content)
        return analysis_data
        
    except Exception as e:
        print(f"Error processing Gemini response: {str(e)}")
        # Print the first 200 characters of the response for debugging
        print(f"Response preview: {response.text[:200]}...")
        raise e

async def analyze_with_openai(book_content: dict) -> dict:
    """
    Use OpenAI for book analysis as a fallback
    """
    try:
        # Initialize OpenAI client
        api_key = os.environ.get("OPENAI_API_KEY", "your-openai-api-key")
        client = AsyncOpenAI(api_key=api_key)
        
        # Extract text from the book content
        book_text = ""
        for page in book_content["content"]:
            book_text += page["content"] + "\n\n"
        
        # Better text sampling for large books
        sample_text = book_text
        if len(book_text) > 12000:
            # Take beginning, 2 middle sections, and end
            first_part = book_text[:3000]
            middle_part1 = book_text[len(book_text)//3:len(book_text)//3 + 3000]
            middle_part2 = book_text[2*len(book_text)//3:2*len(book_text)//3 + 3000]
            last_part = book_text[-3000:]
            sample_text = f"{first_part}\n\n[...]\n\n{middle_part1}\n\n[...]\n\n{middle_part2}\n\n[...]\n\n{last_part}"
        
        print(f"Analyzing book with OpenAI: {len(sample_text)} characters of text")
        
        # Create a comprehensive prompt for literary analysis
        prompt = f"""
        You are a literary analyst with expertise in deep narrative analysis. Analyze this book excerpt and create a detailed breakdown suitable for adaptation into an interactive visual novel.

        BOOK METADATA:
        Title: {book_content["metadata"].get("title", "Unknown")}
        Author: {book_content["metadata"].get("author", "Unknown")}
        Pages: {book_content["metadata"].get("pages", 0)}
        
        BOOK EXCERPT:
        {sample_text}
        
        IMPORTANT: Extract the following elements with deep detail:
        
        1. CHARACTERS: For each major character (at least 5 if present):
           - Name and role in the story
           - Physical description
           - Personality traits
           - Speech patterns and expressions
           - Motivations and desires
           - Relationships with other characters
        
        2. SETTINGS: For each important location (at least 3):
           - Name and physical description
           - Atmosphere and mood
           - Significance to the plot
        
        3. PLOT ANALYSIS:
           - Detailed summary capturing the essence of the story
           - Central conflict
           - Key plot points (at least 8)
           - Potential branching points for an interactive story
           - Major themes and motifs
           - Tone and atmosphere
        
        FORMAT YOUR RESPONSE AS A JSON OBJECT using this structure:
        
        {{
          "characters": [
            {{
              "id": "char_id",
              "name": "Full Name",
              "role": "Role in story",
              "description": "Physical description",
              "personality": "Personality traits",
              "speech_patterns": "How they typically speak",
              "motivations": "What drives them",
              "relationships": "Connections to other characters",
              "importance": "high/medium/low"
            }}
          ],
          "settings": [
            {{
              "id": "setting_id",
              "name": "Setting Name",
              "description": "Physical description",
              "atmosphere": "Mood and feeling of the place",
              "significance": "Importance to the plot"
            }}
          ],
          "plot": {{
            "summary": "Comprehensive plot summary",
            "central_conflict": "Main tension driving the story",
            "key_points": [
              "First major plot point",
              "Second major plot point",
              "etc."
            ],
            "branching_points": [
              {{
                "description": "Potential choice point",
                "options": ["Option 1", "Option 2", "Option 3"]
              }}
            ]
          }},
          "themes": ["theme1", "theme2", "etc."],
          "tone": "Overall tone of the story"
        }}
        
        Provide DEEP, RICH DETAILS for each element. No generalities or placeholders.
        """
        
        # Make the API call to OpenAI with increased token limits
        response = await client.chat.completions.create(
            model="gpt-4-turbo",  # Using the most capable model for analysis
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a literary analyst with expertise in deep narrative analysis."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower temperature for more consistent formatting
            max_tokens=3500,  # Increased to ensure complete response
            timeout=90  # Extended timeout for longer processing
        )
        
        # Parse the response with better error handling
        analysis_text = response.choices[0].message.content
        
        try:
            print(f"Received analysis from OpenAI ({len(analysis_text)} chars)")
            analysis_data = json.loads(analysis_text)
            
            # Validate and clean up the analysis data
            analysis_data = validate_analysis_data(analysis_data, book_content)
            return analysis_data
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error at position {e.pos}: {e.msg}")
            print(f"Response snippet near error: '{analysis_text[max(0, e.pos-30):min(len(analysis_text), e.pos+30)]}'")
            
            # Try to fix the JSON
            try:
                fixed_text = attempt_json_repair(analysis_text)
                if fixed_text != analysis_text:
                    analysis_data = json.loads(fixed_text)
                    print("Successfully fixed and parsed JSON")
                    analysis_data = validate_analysis_data(analysis_data, book_content)
                    return analysis_data
            except:
                print("Failed to fix JSON, falling back to placeholder")
            
            # Fall back to placeholder
            return await placeholder_analysis(book_content)
            
    except Exception as e:
        print(f"Error in OpenAI book analysis: {str(e)}")
        # Return placeholder analysis on any error
        return await placeholder_analysis(book_content)

def validate_analysis_data(analysis_data, book_content):
    """Ensure the analysis data has all required fields and is properly formatted"""
    # Ensure metadata is included
    analysis_data["metadata"] = book_content["metadata"]
    
    # Validate characters
    if "characters" not in analysis_data or not analysis_data["characters"]:
        analysis_data["characters"] = [
            {"id": "protagonist", "name": "Protagonist", "description": "The main character", 
             "personality": "Determined and resourceful", "speech_patterns": "Direct and thoughtful",
             "motivations": "To overcome the central challenge", "relationships": "Central to the story",
             "importance": "high"}
        ]
    
    # Ensure each character has all required fields
    for i, char in enumerate(analysis_data["characters"]):
        if "id" not in char:
            char["id"] = f"char_{i}"
        
        # Add missing character fields
        for field in ["name", "description", "personality", "speech_patterns", "motivations", "relationships", "importance"]:
            if field not in char:
                if field == "name":
                    char[field] = f"Character {i+1}"
                elif field == "description":
                    char[field] = "A distinctive character in the story"
                elif field == "personality":
                    char[field] = "Has a unique personality that drives their actions"
                elif field == "speech_patterns":
                    char[field] = "Speaks in a characteristic manner"
                elif field == "motivations":
                    char[field] = "Driven by specific goals and desires"
                elif field == "relationships":
                    char[field] = "Connected to other characters in meaningful ways"
                elif field == "importance":
                    char[field] = "medium"
    
    # Validate settings
    if "settings" not in analysis_data or not analysis_data["settings"]:
        analysis_data["settings"] = [
            {"id": "setting_1", "name": "Main Setting", "description": "The primary location of the story",
             "atmosphere": "Creates a distinctive mood", "significance": "Central to the plot"}
        ]
    
    # Ensure each setting has all required fields
    for i, setting in enumerate(analysis_data["settings"]):
        if "id" not in setting:
            setting["id"] = f"setting_{i}"
        
        # Add missing setting fields
        for field in ["name", "description", "atmosphere", "significance"]:
            if field not in setting:
                if field == "name":
                    setting[field] = f"Setting {i+1}"
                elif field == "description":
                    setting[field] = "A distinctive location in the story"
                elif field == "atmosphere":
                    setting[field] = "Creates a specific mood and feeling"
                elif field == "significance":
                    setting[field] = "Plays an important role in the narrative"
    
    # Validate plot structure
    if "plot" not in analysis_data or not isinstance(analysis_data["plot"], dict):
        analysis_data["plot"] = {
            "summary": "The story follows compelling characters through an engaging narrative.",
            "central_conflict": "A challenge that must be overcome",
            "key_points": ["Beginning", "Development", "Climax", "Resolution"],
            "branching_points": [
                {"description": "A moment of choice", "options": ["Option 1", "Option 2"]}
            ]
        }
    else:
        plot = analysis_data["plot"]
        
        if "summary" not in plot or not plot["summary"]:
            plot["summary"] = "The story presents an engaging narrative with compelling characters."
            
        if "central_conflict" not in plot or not plot["central_conflict"]:
            plot["central_conflict"] = "A significant challenge that drives the narrative"
            
        if "key_points" not in plot or not isinstance(plot["key_points"], list) or not plot["key_points"]:
            plot["key_points"] = ["Introduction", "Rising Action", "Climax", "Resolution"]
            
        if "branching_points" not in plot or not isinstance(plot["branching_points"], list) or not plot["branching_points"]:
            plot["branching_points"] = [
                {"description": "A critical decision point", "options": ["Continue as planned", "Take a different approach"]}
            ]
    
    # Validate themes and tone
    if "themes" not in analysis_data or not analysis_data["themes"]:
        analysis_data["themes"] = ["journey", "discovery", "challenge", "growth"]
        
    if "tone" not in analysis_data or not analysis_data["tone"]:
        analysis_data["tone"] = "engaging and thoughtful"
    
    return analysis_data

# Helper function to attempt to repair broken JSON
def attempt_json_repair(json_text):
    """Attempt to fix common JSON errors"""
    # Try to fix unclosed quotes
    json_text = re.sub(r'([^\\])"([^"]*)$', r'\1"\2"', json_text)
    
    # Try to fix missing closing braces
    open_braces = json_text.count('{')
    close_braces = json_text.count('}')
    if open_braces > close_braces:
        json_text += '}' * (open_braces - close_braces)
    
    # Try to fix missing closing brackets
    open_brackets = json_text.count('[')
    close_brackets = json_text.count(']')
    if open_brackets > close_brackets:
        json_text += ']' * (open_brackets - close_brackets)
    
    return json_text

# Enhanced placeholder analysis for when AI fails
async def placeholder_analysis(book_content: dict) -> dict:
    """Improved fallback analysis if AI fails"""
    print("Using placeholder analysis as fallback")
    
    # Extract all text into one string for analysis
    full_text = "\n".join([page["content"] for page in book_content["content"]])
    
    # Basic character detection using regex patterns
    characters = []
    potential_names = re.findall(r'"([^"]+)" said|([A-Z][a-z]+) said|\b([A-Z][a-z]+) (?:walked|looked|thought|felt)\b', full_text)
    unique_names = set()
    
    for match in potential_names:
        name = next((n for n in match if n), "")
        name = name.strip()
        if name and len(name) > 1 and name not in unique_names:
            unique_names.add(name)
            if len(characters) < 5:
                characters.append({
                    "id": f"char_{len(characters)}",
                    "name": name,
                    "role": "A character in the narrative",
                    "description": "A distinctive individual with unique characteristics",
                    "personality": "Has a defined personality that influences their actions",
                    "speech_patterns": "Speaks in a characteristic way",
                    "motivations": "Driven by specific goals and desires",
                    "relationships": "Connected to other characters in meaningful ways",
                    "importance": "medium"
                })
    
    # Default characters if none found
    if not characters:
        characters = [
            {
                "id": "protagonist", 
                "name": "Protagonist", 
                "role": "The main character",
                "description": "A compelling figure at the center of the story",
                "personality": "Complex and multifaceted, with strengths and flaws",
                "speech_patterns": "Speaks in a way that reveals their character",
                "motivations": "Driven by deep and meaningful goals",
                "relationships": "Forms significant connections with others",
                "importance": "high"
            },
            {
                "id": "supporting", 
                "name": "Supporting Character", 
                "role": "An important ally",
                "description": "A distinctive individual who aids the protagonist",
                "personality": "Loyal and resourceful",
                "speech_patterns": "Often provides insight or assistance through dialogue",
                "motivations": "Aligned with helping the protagonist",
                "relationships": "Closely connected to the main character",
                "importance": "medium"
            },
            {
                "id": "antagonist", 
                "name": "Antagonist", 
                "role": "Opposes the protagonist",
                "description": "A formidable presence that creates conflict",
                "personality": "Complex with understandable motivations",
                "speech_patterns": "Speaks with authority or menace",
                "motivations": "Has goals that conflict with the protagonist",
                "relationships": "In opposition to the main character",
                "importance": "high"
            }
        ]
    
    # Create simple settings
    settings = [
        {
            "id": "setting_1", 
            "name": "Primary Location", 
            "description": "The main setting where key events unfold",
            "atmosphere": "Creates a distinctive mood that enhances the narrative",
            "significance": "Central to the story's development"
        },
        {
            "id": "setting_2", 
            "name": "Secondary Location", 
            "description": "Another important place in the story",
            "atmosphere": "Provides contrast to the primary setting",
            "significance": "Hosts significant plot developments"
        },
        {
            "id": "setting_3", 
            "name": "Tertiary Setting", 
            "description": "A third location with narrative importance",
            "atmosphere": "Has a unique feel that affects the characters",
            "significance": "Plays a role in advancing the plot"
        }
    ]
    
    # Build the structured output
    title = book_content["metadata"].get("title", "Unknown")
    author = book_content["metadata"].get("author", "Unknown")
    
    return {
        "metadata": book_content["metadata"],
        "characters": characters,
        "settings": settings,
        "plot": {
            "summary": f"This engaging narrative by {author} takes readers on a journey with compelling characters who face significant challenges and undergo meaningful development.",
            "central_conflict": "A core tension that drives the narrative forward",
            "key_points": [
                "Introduction of the main characters and setting",
                "Presentation of the central conflict",
                "Rising action as challenges intensify",
                "Complication that tests the characters",
                "Moment of revelation or discovery",
                "Climactic confrontation",
                "Resolution of the main conflict",
                "Aftermath showing character growth"
            ],
            "branching_points": [
                {
                    "description": "A moment where the protagonist must make a critical choice",
                    "options": ["Face the challenge directly", "Seek help from allies", "Find an alternative approach"]
                },
                {
                    "description": "A situation requiring a moral decision",
                    "options": ["Make a personal sacrifice", "Compromise principles for a greater good", "Stand firm regardless of consequences"]
                }
            ]
        },
        "themes": ["personal growth", "conflict and resolution", "challenges and triumphs", "relationships"],
        "tone": "immersive and engaging"
    }