// =======================================================
// index.js — Movie Search Logic & OMDB API Integration
// =======================================================

// 1. Helper function to read the key from the .env file in the browser
async function getApiKey() {
    try {
        const response = await fetch('.env');
        const text = await response.text();
        // Regular expression to find "OMDB_API_KEY=value"
        const match = text.match(/OMDB_API_KEY\s*=\s*(.*)/);
        return match ? match[1].trim().replace(/['"]/g, '') : null;
    } catch (error) {
        console.error("Could not read .env file:", error);
        return null;
    }
}

// 2. Simple function to search for movies by title
async function testMovieSearch(apiKey, title) {
    try {
        const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(title)}`;
        console.log(`Fetching search results for: "${title}"...`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("Search API Response:", data);
        
        if (data.Response === "True") {
            console.log(`Found ${data.Search.length} movies! Here are the first few:`);
            console.table(data.Search);
            
            // Fetch detailed info for the first movie found
            const firstMovieId = data.Search[0].imdbID;
            await testMovieDetail(apiKey, firstMovieId);
        } else {
            console.error("Search Error:", data.Error);
        }
    } catch (error) {
        console.error("Network or parsing error occurred:", error);
    }
}

// 3. Function to get detailed info for a specific movie using its IMDb ID
async function testMovieDetail(apiKey, imdbID) {
    try {
        const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}`;
        console.log(`Fetching details for IMDb ID: ${imdbID}...`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("Detailed Movie API Response:", data);
        console.log(`Title: ${data.Title} (${data.Year}) | Genre: ${data.Genre} | Rating: ${data.imdbRating}`);
    } catch (error) {
        console.error("Error fetching movie details:", error);
    }
}

// 4. Load the API Key and run the test
async function init() {
    const apiKey = await getApiKey();
    if (!apiKey) {
        console.error("OMDB_API_KEY is not defined in your .env file!");
        return;
    }
    
    // Run the search test
    await testMovieSearch(apiKey, "Blade Runner");
}

init();
