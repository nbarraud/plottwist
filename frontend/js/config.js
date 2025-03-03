// Runtime configuration
window.APP_CONFIG = {
    // Add your production backend URL here
    BACKEND_URL: 'https://plottwist-backend.onrender.com',
    
    // Optional: Different URLs for different environments
    // Uncomment if needed
    // DEVELOPMENT: {
    //   BACKEND_URL: 'http://localhost:8000'
    // },
    
    // You can add other configuration values here
    VERSION: '1.0.0'
  };
  
  // Log configuration on startup
  console.log('App configuration loaded:', window.APP_CONFIG);