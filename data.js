// =======================================================
// data.js — Watchlist Data Layer (localStorage)
// =======================================================

// Read watchlist IDs from localStorage
export function getWatchlist() {
    return JSON.parse(localStorage.getItem("watchlist")) || [];
}

// Add a movie ID to the watchlist in localStorage
export function addToWatchlist(imdbID) {
    const watchlist = getWatchlist();
    if (!watchlist.includes(imdbID)) {
        watchlist.push(imdbID);
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
    }
}
