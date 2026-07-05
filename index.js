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

// DOM Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const moviesContainer = document.getElementById("movies-container");
const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");

let apiKey = null;
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

// 2. UI State Helpers
function showLoading() {
    emptyState.classList.add("hidden");
    errorState.style.display = "none";
    moviesContainer.classList.remove("hidden");
    moviesContainer.innerHTML = '<div class="loading-spinner"></div>';
}

function showResults() {
    emptyState.classList.add("hidden");
    errorState.style.display = "none";
    moviesContainer.classList.remove("hidden");
}

function showError() {
    emptyState.classList.add("hidden");
    errorState.style.display = "block";
    moviesContainer.classList.add("hidden");
    moviesContainer.innerHTML = "";
}

// 3. Render Movies
function renderMovies(movies) {
    // Refresh watchlist from local storage
    watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

    moviesContainer.innerHTML = movies.map(movie => {
        const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "";
        const posterHTML = posterUrl 
            ? `<img src="${posterUrl}" alt="${movie.Title} Poster" class="movie-poster">`
            : `<div class="movie-poster-fallback"><span>No Image Available</span></div>`;

        const inWatchlist = watchlist.includes(movie.imdbID);
        const buttonText = inWatchlist ? "✓ In Watchlist" : "+ Watchlist";
        const buttonClass = inWatchlist ? "movie-watchlist-btn in-watchlist" : "movie-watchlist-btn";
        const disabledAttr = inWatchlist ? "disabled" : "";

        return `
            <div class="movie-card" data-imdbid="${movie.imdbID}">
                ${posterHTML}
                <div class="movie-info">
                    <div class="movie-title-rating-row">
                        <h3 class="movie-title">${movie.Title}</h3>
                        <span class="movie-rating">⭐ ${movie.imdbRating !== "N/A" ? movie.imdbRating : "N/A"}</span>
                    </div>
                    <div class="movie-meta-row">
                        <span class="movie-runtime">${movie.Runtime !== "N/A" ? movie.Runtime : "N/A"}</span>
                        <span class="movie-genre">${movie.Genre !== "N/A" ? movie.Genre : "N/A"}</span>
                        <button class="${buttonClass}" ${disabledAttr}>
                            <span class="movie-watchlist-icon">${inWatchlist ? "" : "+"}</span> ${buttonText}
                        </button>
                    </div>
                    <p class="movie-plot">${movie.Plot !== "N/A" ? movie.Plot : "No description available."}</p>
                </div>
            </div>
        `;
    }).join("");
    
    showResults();
}

// 4. Handle Search Flow
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading();

    try {
        const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === "True") {
            // Fetch detail for each movie in the search results
            const detailPromises = data.Search.map(movie => 
                fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.imdbID}`).then(res => res.json())
            );
            const detailedMovies = await Promise.all(detailPromises);
            renderMovies(detailedMovies);
        } else {
            showError();
        }
    } catch (error) {
        console.error("Error searching/fetching movie data:", error);
        showError();
    }
}

// 5. Handle Click on Watchlist Button
function handleWatchlistClick(e) {
    const btn = e.target.closest(".movie-watchlist-btn");
    if (!btn || btn.classList.contains("in-watchlist")) return;

    const card = btn.closest(".movie-card");
    const imdbID = card.dataset.imdbid;

    if (imdbID) {
        watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
        if (!watchlist.includes(imdbID)) {
            watchlist.push(imdbID);
            localStorage.setItem("watchlist", JSON.stringify(watchlist));
            
            // Instantly update button state in DOM
            btn.classList.add("in-watchlist");
            btn.setAttribute("disabled", "true");
            btn.innerHTML = `✓ In Watchlist`;
        }
    }
}

// 6. Initialize App
async function init() {
    apiKey = await getApiKey();
    if (!apiKey) {
        console.error("OMDB_API_KEY is not defined in your .env file!");
        return;
    }

    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    });

    moviesContainer.addEventListener("click", handleWatchlistClick);
}

init();
