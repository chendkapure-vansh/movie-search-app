# Movie Search & Watchlist App

A lightweight movie discovery app built with vanilla JavaScript and the OMDb API. Users can search for movies, view detailed results, and save favorites to a personal watchlist stored in browser localStorage.

## Project Overview

This project has two pages:

- `index.html`: Search page for finding movies by title.
- `watchlist.html`: Watchlist page for viewing saved movies.

The app uses OMDb in two steps:

1. Search endpoint (`s=`) to get matching movie IDs quickly.
2. Detail endpoint (`i=`) to fetch full information (runtime, genre, plot, rating) for each movie.

This approach keeps search responsive while still rendering rich movie cards.

## Features

- Search movies by title
- Loading state while fetching data
- Error/empty states for better UX
- Movie cards with:
  - Poster (or fallback when not available)
  - Title, IMDb rating, runtime, genre, and plot
- Add movie to watchlist
- Prevent duplicate watchlist entries
- Watchlist persisted with localStorage
- Shared rendering logic across search and watchlist pages

## Tech Stack

- HTML5
- CSS3 (custom styling and responsive layout)
- Vanilla JavaScript (ES Modules)
- OMDb API (`https://www.omdbapi.com/`)
- Browser localStorage

## Project Structure

- `index.html` - Search page UI
- `watchlist.html` - Watchlist page UI
- `index.js` - App logic, API calls, rendering, event handling
- `data.js` - Watchlist storage helpers
- `style.css` - Shared styles for both pages
- `images/` - Static assets
- `.env` - OMDb API key (local only)

## Setup & Run

1. Clone or download the project.
2. Create a `.env` file in the project root with:

```env
OMDB_API_KEY=your_api_key_here
```

3. Open the project folder in VS Code.
4. Run with Live Server (recommended) and open `index.html`.

Notes:

- The app fetches `.env` in the browser to read the API key.
- Keep `.env` out of version control.

## What I Learned

- How to structure a small frontend app using ES modules and separated concerns (`index.js` for UI/logic, `data.js` for storage).
- How to design reusable UI state handlers (`loading`, `results`, `error`) to reduce repeated code.
- How to use event delegation for dynamically created elements (watchlist buttons in rendered movie cards).
- Why OMDb requires two API calls for richer data, and how `Promise.all` improves performance by fetching details in parallel.
- How to persist user-specific data in localStorage and keep UI in sync after updates.
- How to build better UX with fallback content (missing posters, missing metadata) and clear empty/error states.
