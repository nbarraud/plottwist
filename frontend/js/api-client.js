/**
 * API Client for interacting with the PlotTwist backend
 */
class PlotTwistAPI {
    constructor(baseUrl = '') {
        // IMPORTANT: HARDCODE YOUR ACTUAL BACKEND URL HERE
        this.baseUrl = 'https://plottwist-backend.onrender.com';
        
        console.log(`API Client initialized with backend URL: ${this.baseUrl}`);
        
        // Add a validation check for the URL
        this.validateBackendConnection();
    }

    /**
     * Validate the backend connection is working
     * @returns {Promise<boolean>} - True if connection is successful
     */
    async validateBackendConnection() {
        try {
            // Try to connect to the root endpoint which should return API status
            const response = await fetch(`${this.baseUrl}/`, {
                method: 'GET',
                // Add a short timeout to fail fast if unreachable
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                console.log('✅ Successfully connected to backend API');
                return true;
            } else {
                console.warn(`⚠️ Backend responded with status ${response.status}: ${response.statusText}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to connect to backend:', error);
            // Show a user-friendly message on the page
            this.showConnectionError();
            return false;
        }
    }
    
    /**
     * Display a user-friendly connection error message
     */
    showConnectionError() {
        // Create error message element if it doesn't exist
        const errorContainer = document.getElementById('api-error-container') || 
            (() => {
                const container = document.createElement('div');
                container.id = 'api-error-container';
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.right = '0';
                container.style.background = '#f8d7da';
                container.style.color = '#721c24';
                container.style.padding = '10px';
                container.style.textAlign = 'center';
                container.style.zIndex = '9999';
                document.body.prepend(container);
                return container;
            })();
            
        errorContainer.innerHTML = `
            <strong>Connection Error:</strong> 
            Unable to connect to the backend service at ${this.baseUrl}. 
            The service may be down or the URL may be incorrect.
            <button id="retry-connection" style="margin-left: 10px; padding: 5px 10px;">
                Retry Connection
            </button>
        `;
        
        // Add retry button functionality
        document.getElementById('retry-connection').addEventListener('click', async () => {
            errorContainer.innerHTML = 'Attempting to reconnect...';
            const success = await this.validateBackendConnection();
            if (success) {
                errorContainer.style.background = '#d4edda';
                errorContainer.style.color = '#155724';
                errorContainer.innerHTML = 'Connection restored! Refreshing page...';
                setTimeout(() => location.reload(), 1500);
            } else {
                this.showConnectionError();
            }
        });
    }

    // Rest of your API methods remain unchanged...

    async uploadBook(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/api/books/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading book:', error);
            throw error;
        }
    }

    async getBooks() {
        try {
            const response = await fetch(`${this.baseUrl}/api/books`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch books: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    }

    /**
     * Get a specific book by ID
     * @param {string} bookId - The ID of the book
     * @returns {Promise<Object>} - Book object
     */
    async getBook(bookId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/books/${bookId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch book: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching book ${bookId}:`, error);
            throw error;
        }
    }

    /**
     * Get the visual novel script for a book
     * @param {string} bookId - The ID of the book
     * @returns {Promise<Object>} - Visual novel script object
     */
    async getScript(bookId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/books/${bookId}/script`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch script: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching script for book ${bookId}:`, error);
            throw error;
        }
    }

    /**
     * Poll for book processing status until ready
     * @param {string} bookId - The ID of the book
     * @param {Function} onProgress - Callback function for progress updates
     * @returns {Promise<Object>} - Final book object when ready
     */
    async pollBookStatus(bookId, onProgress) {
        return new Promise((resolve, reject) => {
            const checkStatus = async () => {
                try {
                    const book = await this.getBook(bookId);
                    
                    // Call progress callback
                    if (onProgress) {
                        onProgress(book.status, book.progress);
                    }
                    
                    if (book.status === 'ready') {
                        resolve(book);
                        return;
                    } else if (book.status === 'error') {
                        reject(new Error(book.error || 'An error occurred during processing'));
                        return;
                    }
                    
                    // Check again after a delay
                    setTimeout(checkStatus, 2000);
                } catch (error) {
                    reject(error);
                }
            };
            
            // Start checking status
            checkStatus();
        });
    }

    // Add this to api-client.js

/**
 * Dynamically load a scene if it doesn't exist in the current script
 * @param {string} sceneId - The ID of the scene to load
 * @param {string} bookId - The ID of the current book
 * @returns {Promise<Object>} - The scene data
 */
async getScene(sceneId, bookId) {
    try {
        const response = await fetch(`${this.baseUrl}/api/scenes/${sceneId}?book_id=${bookId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch scene: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching scene ${sceneId}:`, error);
        throw error;
    }
}

// Add this to app.js (in the makeChoice method)

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
        // Scene exists, proceed normally
        this.currentScene = nextScene;
        this.dialogueIndex = 0;
        this.setupScene();
    } else {
        // Scene doesn't exist yet, try to load it dynamically
        console.log(`Scene ${choice.nextScene} not found, trying to load dynamically`);
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        // Try to get the scene from the API
        apiClient.getScene(choice.nextScene, this.currentBook.id)
            .then(scene => {
                // Add the scene to our script
                this.vnScript.scenes.push(scene);
                
                // Now use this scene
                this.currentScene = scene;
                this.dialogueIndex = 0;
                
                // Hide loading and show the scene
                this.hideLoadingIndicator();
                this.setupScene();
                
                console.log(`Dynamically loaded scene ${choice.nextScene}`);
            })
            .catch(error => {
                console.error(`Failed to load scene ${choice.nextScene}:`, error);
                
                // Hide loading indicator
                this.hideLoadingIndicator();
                
                // Fall back to trying a similar scene as before
                const similarScenes = this.vnScript.scenes.filter(scene => 
                    scene.id.includes(choice.nextScene) || choice.nextScene.includes(scene.id)
                );
                
                if (similarScenes.length > 0) {
                    // Use the first similar scene found
                    console.log(`Using similar scene ${similarScenes[0].id} instead`);
                    this.currentScene = similarScenes[0];
                    this.dialogueIndex = 0;
                    this.setupScene();
                } else {
                    // Last resort: go back to the first scene
                    alert("Couldn't load the next part of the story. Returning to the beginning.");
                    this.currentScene = this.vnScript.scenes[0];
                    this.dialogueIndex = 0;
                    this.setupScene();
                }
            });
    }
}

/**
 * Show a loading indicator while fetching a new scene
 */
showLoadingIndicator() {
    // Create loading indicator if it doesn't exist
    if (!this.loadingIndicator) {
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'vn-loading';
        this.loadingIndicator.innerHTML = `
            <div class="vn-loading-spinner"></div>
            <div class="vn-loading-text">Loading next scene...</div>
        `;
        
        // Add to the visual novel screen
        this.vnScreen.appendChild(this.loadingIndicator);
        
        // Add CSS for the loading indicator
        const style = document.createElement('style');
        style.textContent = `
            .vn-loading {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .vn-loading-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #d4af37;
                border-top: 5px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }
            
            .vn-loading-text {
                color: white;
                font-size: 1.2rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Show the loading indicator
    this.loadingIndicator.classList.remove('hidden');
}

/**
 * Hide the loading indicator
 */
hideLoadingIndicator() {
    if (this.loadingIndicator) {
        this.loadingIndicator.classList.add('hidden');
    }
}

}

// Create global API client instance
const apiClient = new PlotTwistAPI();