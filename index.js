// =======================================================
// index.js — Movie Search Logic & OMDB API Integration
// =======================================================
import { getWatchlist, addToWatchlist } from './data.js';

// ── 1. API Key ──────────────────────────────────────────

/**
 * The API key is fetched from `.env` at runtime instead of being hard-coded
 * so it never gets accidentally committed to version control.
 * Returning `null` on failure lets the rest of the app degrade gracefully
 * rather than throwing an unhandled error on startup.
 */
export async function getApiKey() {
    try {
        const response = await fetch('.env');
        const text = await response.text();
        const match = text.match(/OMDB_API_KEY\s*=\s*(.*)/);
        return match ? match[1].trim().replace(/['"]/g, '') : null;
    } catch (error) {
        console.error("Could not read .env file:", error);
        return null;
    }
}

// ── 2. DOM References ───────────────────────────────────

// Cached once at module load so repeated queries don't walk the DOM on every event.
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const moviesContainer = document.getElementById("movies-container");
const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");

let apiKey = null;
let watchlist = getWatchlist();

// ── 3. UI State Helpers ─────────────────────────────────

/**
 * Every UI state (loading, results, error) starts from the same clean slate.
 * Centralising that reset here means adding a new state in the future only
 * requires writing the delta — not repeating the same three lines again.
 */
function resetUIState() {
    emptyState.classList.add("hidden");
    errorState.style.display = "none";
    moviesContainer.classList.remove("hidden");
}

/**
 * The spinner is injected as innerHTML rather than a hidden element
 * so it is completely removed from the DOM once results arrive,
 * avoiding any risk of it flickering back into view.
 */
function showLoading() {
    resetUIState();
    moviesContainer.innerHTML = '<div class="loading-spinner"></div>';
}

// showResults delegates entirely to resetUIState because the movie cards
// are already in the DOM by the time this is called — nothing else needs to change.
function showResults() {
    resetUIState();
}

/**
 * The container is cleared when showing an error so stale movie cards from
 * a previous search can never bleed through if the user navigates back.
 */
function showError() {
    resetUIState();
    errorState.style.display = "block";
    moviesContainer.classList.add("hidden");
    moviesContainer.innerHTML = "";
}

// ── 4. Render Movies ────────────────────────────────────

/**
 * The watchlist is re-read from storage on every render rather than relying
 * on the module-level `watchlist` variable alone. This guards against the
 * case where another tab or the watchlist page mutates localStorage between
 * the last search and this render call.
 */
function renderMovies(movies) {
    watchlist = getWatchlist();

    moviesContainer.innerHTML = movies.map(movie => {
        const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "";
        const posterHTML = posterUrl
            ? `<img src="${posterUrl}" alt="${movie.Title} Poster" class="movie-poster">`
            : `<div class="movie-poster-fallback"><span>No Image Available</span></div>`;

        const inWatchlist  = watchlist.includes(movie.imdbID);
        const buttonText   = inWatchlist ? "✓ In Watchlist" : "+ Watchlist";
        const buttonClass  = inWatchlist ? "movie-watchlist-btn in-watchlist" : "movie-watchlist-btn";
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

// ── 5. Search Handler ───────────────────────────────────

/**
 * Two separate API calls are made intentionally: the first (`?s=`) returns a
 * lightweight list of matches, and the second (`?i=`) fetches the full detail
 * for each. OMDB's search endpoint omits runtime, plot, and genre, so the
 * second round-trip is necessary to populate the movie cards completely.
 *
 * Promise.all is used so all detail requests fire in parallel rather than
 * waiting for each one to finish before starting the next.
 */
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return; // no point hitting the network for an empty string

    showLoading();

    try {
        const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response !== "True") {
            showError();
            return; // OMDB explicitly said it found nothing — nothing more to do
        }

        const detailPromises = data.Search.map(movie =>
            fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.imdbID}`).then(res => res.json())
        );
        const detailedMovies = await Promise.all(detailPromises);
        renderMovies(detailedMovies);

    } catch (error) {
        console.error("Error searching/fetching movie data:", error);
        showError();
    }
}

// ── 6. Watchlist Button Handler ─────────────────────────

/**
 * One listener is attached to the container rather than each button individually.
 * This way, buttons inside dynamically rendered cards are covered automatically —
 * no need to re-attach listeners every time renderMovies rewrites the DOM.
 *
 * The button is updated in-place instead of triggering a full re-render because
 * re-rendering would scroll the user back to the top and feel jarring.
 */
function handleWatchlistClick(e) {
    const btn = e.target.closest(".movie-watchlist-btn");
    if (!btn || btn.classList.contains("in-watchlist")) return; // not our target

    const card   = btn.closest(".movie-card");
    const imdbID = card.dataset.imdbid;
    if (!imdbID) return; // card is malformed — safer to bail than guess

    addToWatchlist(imdbID);
    watchlist = getWatchlist();

    if (!watchlist.includes(imdbID)) return; // storage write failed — don't lie to the user

    btn.classList.add("in-watchlist");
    btn.setAttribute("disabled", "true");
    btn.innerHTML = `✓ In Watchlist`;
}

// ── 7. Watchlist Page Loader ────────────────────────────

/**
 * IDs are stored in localStorage (via data.js) rather than the full movie object
 * to keep storage usage minimal. The trade-off is this extra fetch on page load,
 * but it also guarantees the displayed data is always fresh from OMDB.
 */
async function loadWatchlist() {
    const ids = getWatchlist();
    if (ids.length === 0) {
        showError(); // reusing the error panel doubles as the "empty watchlist" state
        return;
    }

    showLoading();

    const movies = await Promise.all(
        ids.map(id => fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}`).then(r => r.json()))
    );

    renderMovies(movies);
}

// ── 8. Bootstrap ────────────────────────────────────────

// The key must be ready before any fetch can happen, so we await it at the top
// level. This is only possible because the script tag uses type="module",
// which wraps the entire file in an async context automatically.
apiKey = await getApiKey();

// Both pages share this file. The presence of `search-input` is used as a
// lightweight signal to determine which page is active, avoiding the need
// for a separate entry point or a router.
if (document.getElementById("search-input")) {
    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
    });
    moviesContainer.addEventListener("click", handleWatchlistClick);
} else {
    await loadWatchlist();
}
