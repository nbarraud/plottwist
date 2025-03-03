/**
 * Main application logic for PlotTwist
 */
class PlotTwistApp {
    constructor() {
        // DOM elements
        this.bookshelfScreen = document.getElementById('bookshelfScreen');
        this.processingScreen = document.getElementById('processingScreen');
        this.vnScreen = document.getElementById('vnScreen');
        this.bookshelf = document.getElementById('bookshelf');
        this.uploadBookBtn = document.getElementById('uploadBookBtn');
        this.uploadModal = document.getElementById('uploadModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.bookUploadForm = document.getElementById('bookUploadForm');
        this.bookFile = document.getElementById('bookFile');
        this.fileNameDisplay = document.getElementById('fileNameDisplay');
        this.progressBar = document.getElementById('progressBar');
        this.processingStatus = document.getElementById('processingStatus');
        this.vnBackground = document.getElementById('vnBackground');
        this.characterContainer = document.getElementById('characterContainer');
        this.vnSpeaker = document.getElementById('vnSpeaker');
        this.vnText = document.getElementById('vnText');
        this.vnChoices = document.getElementById('vnChoices');
        this.vnContinue = document.getElementById('vnContinue');
        this.vnHome = document.getElementById('vnHome');
        
        // Game state
        this.currentScene = null;
        this.dialogueIndex = 0;
        this.currentBook = null;
        this.vnScript = null;
        this.visitedScenes = []; // Track scene history
        
        // Initialize the app
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        // Attach event listeners
        this.uploadBookBtn.addEventListener('click', () => {
            this.uploadModal.classList.remove('hidden');
        });
        
        this.closeModalBtn.addEventListener('click', () => {
            this.uploadModal.classList.add('hidden');
        });
        
        this.bookFile.addEventListener('change', () => {
            if (this.bookFile.files.length > 0) {
                this.fileNameDisplay.textContent = this.bookFile.files[0].name;
            }
        });
        
        this.bookUploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBookUpload();
        });
        
        this.vnContinue.addEventListener('click', () => this.advanceDialogue());
        
        this.vnHome.addEventListener('click', () => {
            this.vnScreen.classList.add('hidden');
            this.bookshelfScreen.classList.remove('hidden');
        });
        
        // Fetch existing books from API
        try {
            const books = await apiClient.getBooks();
            this.populateBookshelf(books);
        } catch (error) {
            console.error('Failed to load books:', error);
            // Fallback to sample books if API fails
            this.populateBookshelfWithSamples();
        }
    }
    
    /**
     * Populate the bookshelf with books from the API
     */
    populateBookshelf(books) {
        if (books && books.length > 0) {
            books.forEach(book => this.addBookToShelf(book));
        } else {
            // Fallback to samples if no books
            this.populateBookshelfWithSamples();
        }
    }
    
    /**
     * Populate with sample books if no real books exist
     */
    populateBookshelfWithSamples() {
        const sampleBooks = [
            { id: 'sample1', title: "The Great Gatsby", author: "F. Scott Fitzgerald", color: "#1a3c5b" },
            { id: 'sample2', title: "Pride and Prejudice", author: "Jane Austen", color: "#5d2e46" },
            { id: 'sample3', title: "Sherlock Holmes", author: "Arthur Conan Doyle", color: "#2e4632" },
            { id: 'sample4', title: "Dracula", author: "Bram Stoker", color: "#4b1d1d" }
        ];
        
        sampleBooks.forEach(book => this.addBookToShelf(book));
    }
    
    /**
     * Generate a basic sample script for demo purposes
     * In a real app, this would be replaced by AI-generated content
     */
    generateSampleScript(title) {
        // Create basic character images
        const protagonistImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 250'><rect x='35' y='20' width='30' height='30' rx='15' fill='%23f9d5e5'/><rect x='30' y='50' width='40' height='60' fill='%23b06ab3'/><rect x='25' y='110' width='50' height='50' fill='%236a0572'/><rect x='25' y='110' width='20' height='70' rx='5' fill='%236a0572'/><rect x='55' y='110' width='20' height='70' rx='5' fill='%236a0572'/></svg>";
        const supportingImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 250'><rect x='35' y='20' width='30' height='30' rx='15' fill='%23d1d1e0'/><rect x='30' y='50' width='40' height='60' fill='%23800000'/><rect x='25' y='110' width='50' height='50' fill='%23333333'/><rect x='25' y='110' width='20' height='70' rx='5' fill='%23333333'/><rect x='55' y='110' width='20' height='70' rx='5' fill='%23333333'/></svg>";
        
        // Create background images
        const mainBackground = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><rect width='800' height='600' fill='%23243b55'/><path d='M0 450 Q 400 400 800 450 L 800 600 L 0 600 Z' fill='%23141e30'/></svg>";
        const secondaryBackground = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><rect width='800' height='600' fill='%232c3e50'/><path d='M0 450 Q 400 400 800 450 L 800 600 L 0 600 Z' fill='%23141e30'/></svg>";
        
        return {
            title: title,
            scenes: [
                {
                    id: "scene_1",
                    background: mainBackground,
                    characters: [
                        { id: "protagonist", image: protagonistImage }
                    ],
                    dialogue: [
                        { speaker: "Narrator", text: `Welcome to the world of ${title}. This interactive experience lets you explore the story from a new perspective.` },
                        { speaker: "Narrator", text: "As you journey through this tale, your choices will shape the outcome." },
                        { speaker: "You", text: "I wonder what adventures await...", character: "protagonist" },
                        { 
                            speaker: "Narrator", 
                            text: "How would you like to begin?",
                            choices: [
                                { text: "With courage and determination", nextScene: "scene_2a" },
                                { text: "Cautiously and thoughtfully", nextScene: "scene_2b" },
                                { text: "Let fate decide my path", nextScene: "scene_2c" }
                            ]
                        }
                    ]
                },
                {
                    id: "scene_2a",
                    background: secondaryBackground,
                    characters: [
                        { id: "protagonist", image: protagonistImage },
                        { id: "supporting", image: supportingImage }
                    ],
                    dialogue: [
                        { speaker: "Narrator", text: "You decide to face the challenge head-on, with determination guiding your steps." },
                        { speaker: "You", text: "I'm ready for whatever comes my way!", character: "protagonist" },
                        { speaker: "Guide", text: "Your courage is admirable. Let me show you the path forward.", character: "supporting" },
                        { 
                            speaker: "Guide", 
                            text: "But be warned, courage without wisdom can lead to peril.",
                            character: "supporting",
                            choices: [
                                { text: "I understand the risks", nextScene: "scene_continue" },
                                { text: "Perhaps I should reconsider", nextScene: "scene_1" }
                            ]
                        }
                    ]
                },
                {
                    id: "scene_2b",
                    background: secondaryBackground,
                    characters: [
                        { id: "protagonist", image: protagonistImage }
                    ],
                    dialogue: [
                        { speaker: "Narrator", text: "You choose the path of caution, carefully considering each step before moving forward." },
                        { speaker: "You", text: "It's better to proceed with care than to rush into danger.", character: "protagonist" },
                        { speaker: "Narrator", text: "Your thoughtful approach reveals details others might miss." },
                        { 
                            speaker: "Narrator", 
                            text: "What aspect of this world interests you most?",
                            choices: [
                                { text: "The history and lore", nextScene: "scene_continue" },
                                { text: "The characters and their motivations", nextScene: "scene_continue" },
                                { text: "The mysteries that need solving", nextScene: "scene_continue" }
                            ]
                        }
                    ]
                },
                {
                    id: "scene_2c",
                    background: mainBackground,
                    characters: [],
                    dialogue: [
                        { speaker: "Narrator", text: "You surrender to the flow of the story, letting fate guide your journey." },
                        { speaker: "Narrator", text: "Sometimes the most interesting paths are those we don't choose ourselves." },
                        { speaker: "Narrator", text: "As you drift with the current of the narrative, you find yourself drawn to..." },
                        { 
                            speaker: "Narrator", 
                            text: "Which element of fate pulls you strongest?",
                            choices: [
                                { text: "A mysterious encounter", nextScene: "scene_continue" },
                                { text: "An unexpected opportunity", nextScene: "scene_continue" },
                                { text: "A moment of revelation", nextScene: "scene_continue" }
                            ]
                        }
                    ]
                },
                {
                    id: "scene_continue",
                    background: mainBackground,
                    characters: [
                        { id: "protagonist", image: protagonistImage }
                    ],
                    dialogue: [
                        { speaker: "Narrator", text: "This is where your unique adventure would continue..." },
                        { speaker: "Narrator", text: "In the full implementation, the AI would generate a personalized continuation based on your book and choices." },
                        { speaker: "You", text: "I look forward to seeing where this story leads!", character: "protagonist" },
                        { 
                            speaker: "Narrator", 
                            text: "Would you like to continue exploring?",
                            choices: [
                                { text: "Return to the beginning", nextScene: "scene_1" },
                                { text: "Return to bookshelf", nextScene: "exit" }
                            ]
                        }
                    ]
                }
            ]
        };
    }
    
    /**
     * Add a book to the bookshelf
     */
    getHashColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    }

    addBookToShelf(book) {
        const color = book.color || this.getHashColor(book.title);
        
        const bookElement = document.createElement('div');
        bookElement.className = 'book';
        
        // Create the static page SVG
        const pageSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        pageSvg.setAttribute('viewBox', '0 0 200 300');
        pageSvg.classList.add('book-page-svg');
        pageSvg.innerHTML = `
            <defs>
                <filter id="shadow-page-${book.id}" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="2" dy="2"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            <!-- Static White Page -->
            <rect x="45" y="7" width="145" height="286" rx="2" 
                  fill="#fff" filter="url(#shadow-page-${book.id})"/>
            <text class="page-text page-title" x="117" y="120" text-anchor="middle" fill="#333">
                ${book.title}
            </text>
            <text class="page-text" x="117" y="150" text-anchor="middle" fill="#333">
                by ${book.author}
            </text>
        `;

        // Create the rotating cover SVG
        const coverSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        coverSvg.setAttribute('viewBox', '0 0 200 300');
        coverSvg.classList.add('book-cover-svg');
        coverSvg.innerHTML = `
            <defs>
                <filter id="shadow-cover-${book.id}" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="2" dy="2"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            <!-- Book Cover -->
            <rect class="book-cover" x="45" y="0" width="155" height="300" rx="2" 
                  fill="${color}" filter="url(#shadow-cover-${book.id})"/>
            
            <!-- Book Spine -->
            <rect class="book-spine" x="0" y="0" width="45" height="300" rx="2" 
                  fill="${color}"/>
            
            <!-- Spine Text -->
            <text class="spine-text" x="22" y="150" text-anchor="middle" 
                  transform="rotate(-90, 22, 150)" fill="#f3e9d2">
                ${book.title}
            </text>
            
            <!-- Cover Text -->
            <foreignObject x="55" y="60" width="135" height="180">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: #f3e9d2; font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;">
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px; line-height: 1.2;">${book.title}</div>
                    <div style="font-size: 16px;">by ${book.author}</div>
                </div>
            </foreignObject>
        `;
        
        bookElement.appendChild(pageSvg);
        bookElement.appendChild(coverSvg);
        bookElement.addEventListener('click', () => {
            this.startGame(book);
        });
        
        this.bookshelf.insertBefore(bookElement, this.uploadBookBtn);
    }
    
    /**
     * Handle book upload form submission
     */
    async handleBookUpload() {
        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        const file = this.bookFile.files[0];
        
        if (!title || !author || !file) {
            alert('Please fill out all fields');
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('title', title);
        formData.append('author', author);
        formData.append('file', file);
        
        // Close the modal
        this.uploadModal.classList.add('hidden');
        
        // Show the processing screen
        this.bookshelfScreen.classList.add('hidden');
        this.processingScreen.classList.remove('hidden');
        
        try {
            // Upload the book
            const book = await apiClient.uploadBook(formData);
            
            // Poll for status updates
            await apiClient.pollBookStatus(book.id, (status, progress) => {
                // Update progress bar
                this.progressBar.style.width = `${progress}%`;
                
                // Update status text based on the current processing stage
                let statusText;
                switch (status) {
                    case 'processing':
                        statusText = 'Extracting text from book...';
                        break;
                    case 'analyzing':
                        statusText = 'Analyzing characters and plot...';
                        break;
                    case 'generating':
                        statusText = 'Creating interactive story branches...';
                        break;
                    default:
                        statusText = 'Processing your book...';
                }
                
                this.processingStatus.textContent = statusText;
            });
            
            // Add the book to the shelf
            book.color = this.getRandomColor();
            this.addBookToShelf(book);
            
            // Start the game with the new book
            this.startGame(book);
            
        } catch (error) {
            console.error('Error processing book:', error);
            alert('An error occurred while processing your book. Please try again.');
            
            // Go back to bookshelf
            this.processingScreen.classList.add('hidden');
            this.bookshelfScreen.classList.remove('hidden');
        }
    }
    
    /**
     * Start the visual novel game with a book
     */
    async startGame(book) {
        this.currentBook = book;
        
        // Hide the bookshelf and processing screens
        this.bookshelfScreen.classList.add('hidden');
        this.processingScreen.classList.add('hidden');
        
        // Show loading in the processing screen if needed
        if (book.status !== 'ready' && !book.id.startsWith('sample')) {
            this.processingScreen.classList.remove('hidden');
            this.processingStatus.textContent = 'Loading your adventure...';
            
            try {
                // Wait for the book to be ready if it's not
                await apiClient.pollBookStatus(book.id, (status, progress) => {
                    this.progressBar.style.width = `${progress}%`;
                    this.processingStatus.textContent = `${status.charAt(0).toUpperCase() + status.slice(1)}... ${progress}%`;
                });
            } catch (error) {
                console.error('Error waiting for book:', error);
                alert('Could not load the book. Please try again later.');
                
                // Go back to bookshelf
                this.processingScreen.classList.add('hidden');
                this.bookshelfScreen.classList.remove('hidden');
                return;
            }
        }
        
        // Hide processing screen
        this.processingScreen.classList.add('hidden');
        
        // Show the visual novel screen
        this.vnScreen.classList.remove('hidden');
        
        try {
            // For sample books, use the pre-generated sample scripts
            if (book.id.startsWith('sample')) {
                this.vnScript = this.generateSampleScript(book.title);
            } else {
                // For real books, fetch the script from the API
                this.vnScript = await apiClient.getScript(book.id);
            }
            
            // Initialize the first scene
            this.currentScene = this.vnScript.scenes[0];
            this.dialogueIndex = 0;
            this.visitedScenes = []; // Reset visited scenes
            
            // Set up the scene
            this.setupScene();
            
        } catch (error) {
            console.error('Error loading script:', error);
            alert('Could not load the story script. Please try again later.');
            
            // Go back to bookshelf
            this.vnScreen.classList.add('hidden');
            this.bookshelfScreen.classList.remove('hidden');
        }
    }
    
    /**
     * Set up the current scene
     */
    setupScene() {
        if (!this.currentScene) {
            console.error('No current scene to setup');
            return;
        }
        
        // Set the background
        this.vnBackground.style.backgroundImage = `url('${this.currentScene.background}')`;
        
        // Clear characters
        this.characterContainer.innerHTML = '';
        
        // Add characters
        if (this.currentScene.characters && this.currentScene.characters.length > 0) {
            this.currentScene.characters.forEach(character => {
                const characterElement = document.createElement('div');
                characterElement.className = 'vn-character';
                characterElement.id = `character-${character.id}`;
                characterElement.style.backgroundImage = `url('${character.image}')`;
                this.characterContainer.appendChild(characterElement);
            });
        }
        
        // Display the first dialogue line
        this.displayDialogue();
    }
    
    /**
     * Display the current dialogue line
     */
    displayDialogue() {
        if (!this.currentScene || !this.currentScene.dialogue || 
            this.dialogueIndex >= this.currentScene.dialogue.length) {
            console.error('No dialogue to display');
            return;
        }
        
        const dialogue = this.currentScene.dialogue[this.dialogueIndex];
        
        // Set the speaker
        this.vnSpeaker.textContent = dialogue.speaker;
        
        // Set the text
        this.vnText.textContent = dialogue.text;
        
        // Show active character
        document.querySelectorAll('.vn-character').forEach(char => {
            char.classList.remove('active');
        });
        
        if (dialogue.character) {
            const activeChar = document.getElementById(`character-${dialogue.character}`);
            if (activeChar) {
                activeChar.classList.add('active');
            }
        }
        
        // Show choices if available
        if (dialogue.choices && dialogue.choices.length > 0) {
            this.vnChoices.innerHTML = '';
            dialogue.choices.forEach(choice => {
                const choiceElement = document.createElement('div');
                choiceElement.className = 'vn-choice';
                choiceElement.textContent = choice.text;
                choiceElement.addEventListener('click', () => {
                    this.makeChoice(choice);
                });
                this.vnChoices.appendChild(choiceElement);
            });
            this.vnChoices.classList.remove('hidden');
            this.vnContinue.classList.add('hidden');
        } else {
            this.vnChoices.classList.add('hidden');
            this.vnContinue.classList.remove('hidden');
        }
    }
    
    /**
     * Advance to the next dialogue line with proper scene transitions
     */
    advanceDialogue() {
        this.dialogueIndex++;
        
        if (this.dialogueIndex < this.currentScene.dialogue.length) {
            // Continue in the current scene
            this.displayDialogue();
        } else {
            // End of scene - determine the next scene to transition to
            console.log("End of scene: " + this.currentScene.id);
            
            // Find a valid next scene from the last dialogue choices if available
            let nextSceneId = null;
            
            // Check if the current scene had any choices in the dialogue
            if (this.currentScene.dialogue.length > 0) {
                const lastDialogue = this.currentScene.dialogue[this.currentScene.dialogue.length - 1];
                
                if (lastDialogue.choices && lastDialogue.choices.length > 0) {
                    // Get the first choice's next scene as default progression
                    nextSceneId = lastDialogue.choices[0].nextScene;
                    console.log(`Found next scene from choices: ${nextSceneId}`);
                }
            }
            
            // If we couldn't find a next scene from choices, try scene naming pattern
            if (!nextSceneId) {
                // Extract a number from the current scene ID if possible
                const currentIdMatch = this.currentScene.id.match(/(\d+)/);
                if (currentIdMatch) {
                    const currentNum = parseInt(currentIdMatch[1]);
                    const nextNum = currentNum + 1;
                    
                    // Try to find a scene with the next sequential number
                    const nextScenePattern = this.currentScene.id.replace(currentNum.toString(), nextNum.toString());
                    const nextScene = this.vnScript.scenes.find(scene => scene.id === nextScenePattern);
                    
                    if (nextScene) {
                        nextSceneId = nextScene.id;
                        console.log(`Found next scene by pattern: ${nextSceneId}`);
                    }
                }
            }
            
            // Handle special 'exit' case
            if (nextSceneId === 'exit') {
                console.log("Exit scene requested, returning to bookshelf");
                this.vnScreen.classList.add('hidden');
                this.bookshelfScreen.classList.remove('hidden');
                return;
            }
            
            // If we still don't have a valid next scene, just use the first scene
            if (!nextSceneId) {
                console.log("No valid next scene found, returning to first scene");
                this.currentScene = this.vnScript.scenes[0];
            } else {
                // Find the actual scene object
                const nextScene = this.vnScript.scenes.find(scene => scene.id === nextSceneId);
                
                if (nextScene) {
                    // Track visited scenes for history
                    this.visitedScenes.push(this.currentScene.id);
                    if (this.visitedScenes.length > 10) {
                        this.visitedScenes.shift(); // Keep history limited
                    }
                    
                    this.currentScene = nextScene;
                    console.log(`Transitioning to scene: ${nextScene.id}`);
                } else {
                    console.error(`Could not find scene with id ${nextSceneId}`);
                    // Fallback to first scene
                    this.currentScene = this.vnScript.scenes[0];
                }
            }
            
            // Reset dialogue index and set up the new scene
            this.dialogueIndex = 0;
            this.setupScene();
        }
    }
    
    /**
     * Make a choice in the dialogue
     */
    makeChoice(choice) {
        if (!choice || !choice.nextScene) {
            console.error('Invalid choice or missing next scene');
            return;
        }
        
        // Special case for 'exit' to return to bookshelf
        if (choice.nextScene === 'exit') {
            this.vnScreen.classList.add('hidden');
            this.bookshelfScreen.classList.remove('hidden');
            return;
        }
        
        // Track visited scenes for history
        this.visitedScenes.push(this.currentScene.id);
        if (this.visitedScenes.length > 10) {
            this.visitedScenes.shift(); // Keep history limited
        }
        
        // Find the next scene
        const nextScene = this.vnScript.scenes.find(scene => scene.id === choice.nextScene);
        
        if (nextScene) {
            this.currentScene = nextScene;
            this.dialogueIndex = 0;
            this.setupScene();
        } else {
            console.error(`Scene ${choice.nextScene} not found`);
            
            // Try to find a scene with a similar ID pattern
            const similarScenes = this.vnScript.scenes.filter(scene => 
                scene.id.includes(choice.nextScene) || choice.nextScene.includes(scene.id)
            );
            
            if (similarScenes.length > 0) {
                // Use the first similar scene found
                console.log(`Using similar scene ${similarScenes[0].id} instead`);
                this.currentScene = similarScenes[0];
                this.dialogueIndex = 0;
                this.setupScene();
            }
        }
    }
    
    /**
     * Generate a random color for book covers
     */
    getRandomColor() {
        const colors = [
            "#8c1a11", "#2e4632", "#1a3c5b", "#5d2e46", 
            "#4b1d1d", "#193737", "#2d2d4f", "#3e2731"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Log the current scene graph for debugging
     */
    debugSceneGraph() {
        if (!this.vnScript || !this.vnScript.scenes) {
            console.log("No scene graph available");
            return;
        }
        
        console.log("Scene Graph:");
        
        // Map of all scenes
        const scenes = {};
        this.vnScript.scenes.forEach(scene => {
            scenes[scene.id] = {
                id: scene.id,
                outgoing: [],
                incoming: []
            };
        });
        
        // Find all connections
        this.vnScript.scenes.forEach(scene => {
            scene.dialogue.forEach(dialogueLine => {
                if (dialogueLine.choices) {
                    dialogueLine.choices.forEach(choice => {
                        if (choice.nextScene && choice.nextScene !== 'exit') {
                            // Add outgoing connection
                            scenes[scene.id].outgoing.push({
                                target: choice.nextScene,
                                text: choice.text
                            });
                            
                            // Add incoming connection if target exists
                            if (scenes[choice.nextScene]) {
                                scenes[choice.nextScene].incoming.push({
                                    source: scene.id,
                                    text: choice.text
                                });
                            }
                        }
                    });
                }
            });
        });
        
        // Print connections
        Object.values(scenes).forEach(sceneInfo => {
            console.log(`Scene ${sceneInfo.id}:`);
            console.log(`  Incoming: ${sceneInfo.incoming.length > 0 ? sceneInfo.incoming.map(c => c.source).join(', ') : 'None'}`);
            console.log(`  Outgoing: ${sceneInfo.outgoing.length > 0 ? sceneInfo.outgoing.map(c => c.target).join(', ') : 'None'}`);
        });
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.PlotTwistApp = new PlotTwistApp();
});