const jikanTopAnimeUrl = 'https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=12';
const jikanSearchUrl = 'https://api.jikan.moe/v4/anime';
let selectedAnime = null;
let introSoundPlayed = false;
let introAudioContext = null;

const fallbackAnimeData = {
    top: [
        { mal_id: 1, title: 'Attack on Titan', synopsis: 'Humanity fights for survival behind giant walls while a mysterious power threatens their world.', episodes: 25, score: 8.57, image: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 1 },
        { mal_id: 2, title: 'Death Note', synopsis: 'A notebook grants its owner the power to kill anyone whose name is written inside.', episodes: 37, score: 8.62, image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 2 },
        { mal_id: 3, title: 'Fullmetal Alchemist: Brotherhood', synopsis: 'Two brothers search for the Philosopher’s Stone after a failed alchemical ritual.', episodes: 64, score: 9.11, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 3 }
    ],
    airing: [
        { mal_id: 11, title: 'Witch Hat Atelier', synopsis: 'A young girl enters a magical world of witches after discovering her hidden talent.', episodes: 12, score: 8.59, image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 4 },
        { mal_id: 12, title: 'Re:ZERO -Starting Life in Another World-', synopsis: 'A boy is trapped in a time loop after dying in a fantasy world.', episodes: 50, score: 9.2, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 5 },
        { mal_id: 13, title: 'That Time I Got Reincarnated as a Slime', synopsis: 'A man is reborn as a slime and rises to power in a magical kingdom.', episodes: 24, score: 8.1, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 6 }
    ],
    popular: [
        { mal_id: 21, title: 'One Punch Man', synopsis: 'An overpowered hero tries to find excitement in a world full of monsters.', episodes: 12, score: 8.47, image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 7 },
        { mal_id: 22, title: 'Demon Slayer', synopsis: 'A young swordsman seeks a cure for his sister after a demon attack.', episodes: 44, score: 8.4, image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 8 },
        { mal_id: 23, title: 'My Hero Academia', synopsis: 'A boy without powers dreams of becoming a hero in a world of quirks.', episodes: 25, score: 7.82, image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 9 }
    ],
    favorites: [
        { mal_id: 31, title: 'One Piece', synopsis: 'A young pirate sets out to become the king of the pirates.', episodes: 1000, score: 8.73, image: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 10 },
        { mal_id: 32, title: 'Steins;Gate', synopsis: 'A scientist discovers a way to send messages to the past with life-changing consequences.', episodes: 24, score: 9.07, image: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 11 },
        { mal_id: 33, title: 'Naruto Shippuden', synopsis: 'A young ninja continues his journey to protect his village and friends.', episodes: 500, score: 8.29, image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'TV', rank: 12 }
    ],
    movies: [
        { mal_id: 41, title: 'Your Name', synopsis: 'Two teenagers begin swapping bodies and must uncover the mystery behind it.', episodes: 1, score: 8.94, image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'Movie', rank: 13 },
        { mal_id: 42, title: 'Spirited Away', synopsis: 'A girl enters a spirit world and must survive to rescue her parents.', episodes: 1, score: 8.6, image: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'Movie', rank: 14 },
        { mal_id: 43, title: 'Weathering With You', synopsis: 'A boy and girl connect through a supernatural power over the weather.', episodes: 1, score: 8.1, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80', trailer: null, type: 'Movie', rank: 15 }
    ]
};

function getFallbackAnimeList(type) {
    return fallbackAnimeData[type] || fallbackAnimeData.top;
}

function cleanText(text, fallback = 'Details unavailable.') {
    return text && text.trim() ? text.replace(/\s+/g, ' ').trim() : fallback;
}

async function fetchAnime(url, fallbackType = 'top') {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result.data || !Array.isArray(result.data)) {
            throw new Error('Unexpected API response');
        }

        return result.data.map(item => ({
            mal_id: item.mal_id,
            title: item.title_english || item.title || item.title_japanese || 'Unknown Title',
            synopsis: cleanText(item.synopsis, 'Synopsis unavailable.'),
            episodes: item.episodes || 'TBA',
            score: item.score || 'N/A',
            image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
            trailer: item.trailer,
            type: item.type || 'Anime',
            rank: item.rank || '—'
        })).slice(0, 8);
    } catch (error) {
        console.warn('Using fallback anime data:', error);
        return getFallbackAnimeList(fallbackType);
    }
}

async function fetchTopAnime() {
    return fetchAnime(jikanTopAnimeUrl, 'top');
}

async function fetchAiringAnime() {
    return fetchAnime('https://api.jikan.moe/v4/seasons/now?limit=8', 'airing');
}

async function fetchPopularAnime() {
    return fetchAnime('https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=8', 'popular');
}

async function fetchFavoriteAnime() {
    return fetchAnime('https://api.jikan.moe/v4/top/anime?filter=favorite&limit=8', 'favorites');
}

async function fetchMovieAnime() {
    return fetchAnime('https://api.jikan.moe/v4/top/anime?filter=movie&limit=8', 'movies');
}

async function searchAnime(query) {
    if (!query || query.trim().length === 0) {
        return fetchTopAnime();
    }

    const url = `${jikanSearchUrl}?q=${encodeURIComponent(query.trim())}&limit=30`;
    return fetchAnime(url);
}

async function fetchEpisodes(animeId) {
    const url = `https://api.jikan.moe/v4/anime/${animeId}/episodes?page=1`;
    try {
        const response = await fetch(url);
        const result = await response.json();

        return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
        console.error('Unable to load episode list:', error);
        return [];
    }
}

function setHeroAnime(anime) {
    const hero = document.querySelector('.hero');
    const featuredTitle = document.getElementById('featured-title');
    const heroDescription = document.querySelector('.hero-content p');
    const playBtn = document.getElementById('play-btn');

    hero.style.backgroundImage = `linear-gradient(90deg, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.25) 48%, rgba(5,5,5,0.94) 100%), url('${anime.image}')`;
    featuredTitle.textContent = anime.title;
    heroDescription.textContent = `${anime.synopsis.slice(0, 220)}${anime.synopsis.length > 220 ? '...' : ''}`;
    playBtn.textContent = anime.trailer?.url ? '▶ Watch Trailer' : '▶ Play Preview';
}

function renderEpisodeGrid(episodes) {
    const gridDiv = document.getElementById('episode-grid');
    gridDiv.innerHTML = '';

    if (!episodes.length) {
        gridDiv.innerHTML = '<p class="empty-message">No episodes available for this anime.</p>';
        return;
    }

    episodes.forEach(episode => {
        const card = document.createElement('div');
        card.classList.add('anime-card');

        const airedDate = episode.aired ? new Date(episode.aired).toLocaleDateString() : 'Unknown';
        const episodeNumber = episode.episode || episode.mal_id || 'N/A';
        const episodeTitle = episode.title || `Episode ${episodeNumber}`;

        card.innerHTML = `
            <img src="${selectedAnime?.image || 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=500&q=80'}" alt="${episodeTitle}">
            <div class="anime-info">
                <h3>${episodeTitle}</h3>
                <p>Episode ${episodeNumber}</p>
                <p style="font-size: 12px; margin-top: 5px; color: #bbb;">Aired: ${airedDate}</p>
            </div>
        `;

        gridDiv.appendChild(card);
    });
}

async function loadEpisodesForSelectedAnime(anime) {
    const gridDiv = document.getElementById('episode-grid');
    const titleHeading = document.getElementById('episode-section-title');

    titleHeading.textContent = `Episodes · ${anime.title}`;
    gridDiv.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Loading episodes...</p>';

    const episodes = await fetchEpisodes(anime.mal_id);
    renderEpisodeGrid(episodes);
}

function playIntroSound() {
    if (introSoundPlayed) {
        return;
    }

    introSoundPlayed = true;

    try {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) {
            return;
        }

        if (!introAudioContext) {
            introAudioContext = new AudioCtor();
        }

        if (introAudioContext.state === 'suspended') {
            introAudioContext.resume();
        }

        const now = introAudioContext.currentTime;
        const masterGain = introAudioContext.createGain();
        masterGain.gain.setValueAtTime(0.0001, now);
        masterGain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        masterGain.connect(introAudioContext.destination);

        const filter = introAudioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.value = 0.8;
        filter.connect(masterGain);

        const osc = introAudioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.18);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 0.45);

        const osc2 = introAudioContext.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(660, now);
        osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
        osc2.connect(filter);
        osc2.start(now + 0.02);
        osc2.stop(now + 0.42);

        const noiseBuffer = introAudioContext.createBuffer(1, Math.floor(introAudioContext.sampleRate * 0.25), introAudioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i += 1) {
            noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseData.length, 2);
        }

        const noise = introAudioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseGain = introAudioContext.createGain();
        noiseGain.gain.setValueAtTime(0.022, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        noise.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(now);
        noise.stop(now + 0.25);
    } catch (error) {
        console.warn('Intro sound could not be played:', error);
    }
}

function getWatchLink(type, title) {
    const query = encodeURIComponent(title);

    if (type === 'youtube') {
        return `https://www.youtube.com/results?search_query=${query}+full+episode+playlist`;
    }
    if (type === 'aniwaves' || type === 'animeverse') {
        return 'https://aniwaves.ru/home';
    }
    return '#';
}

function updateWatchLinks(anime) {
    if (!anime) {
        return;
    }
    document.getElementById('youtube-btn').href = getWatchLink('youtube', anime.title);
    document.getElementById('aniwaves-btn').href = getWatchLink('animeverse', anime.title);
}

function getSavedList() {
    try {
        return JSON.parse(localStorage.getItem('aniflixMyList') || '[]');
    } catch (error) {
        console.error('Unable to parse My List data:', error);
        return [];
    }
}

function isInMyList(anime) {
    if (!anime) {
        return false;
    }
    const savedList = getSavedList();
    return savedList.some(item => item.mal_id === anime.mal_id);
}

function updateSaveButton(anime) {
    const saveBtn = document.getElementById('save-btn');
    if (!anime) {
        saveBtn.textContent = '+ Add to My List';
        saveBtn.disabled = true;
        return;
    }
    const saved = isInMyList(anime);
    saveBtn.textContent = saved ? '✔ In My List' : '+ Add to My List';
    saveBtn.disabled = saved;
}

function selectAnime(anime) {
    selectedAnime = anime;
    setHeroAnime(anime);
    updateWatchLinks(anime);
    updateSaveButton(anime);
    loadEpisodesForSelectedAnime(anime);

    document.querySelectorAll('.anime-card').forEach(card => {
        card.classList.toggle('selected', Number(card.dataset.id) === anime.mal_id);
    });
}

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.classList.add('anime-card');
    card.dataset.id = anime.mal_id;
    card.innerHTML = `
        <img src="${anime.image}" alt="${anime.title}">
        <div class="anime-info">
            <span class="card-badge">${anime.type}</span>
            <h3>${anime.title}</h3>
            <p>${anime.score !== 'N/A' ? `★ ${anime.score}` : `${anime.episodes} eps`}</p>
        </div>
    `;

    card.addEventListener('click', () => selectAnime(anime));
    return card;
}

function populateAnimeGrid(animeList) {
    const gridDiv = document.getElementById('anime-grid');
    gridDiv.innerHTML = '';

    if (!animeList.length) {
        gridDiv.innerHTML = '<p class="empty-message">No anime available right now.</p>';
        return;
    }

    animeList.forEach(anime => {
        gridDiv.appendChild(createAnimeCard(anime));
    });
}

function populateRow(rowId, animeList) {
    const rowDiv = document.getElementById(rowId);
    rowDiv.innerHTML = '';

    if (!animeList.length) {
        rowDiv.innerHTML = '<p class="empty-message">Could not load this row right now.</p>';
        return;
    }

    animeList.forEach(anime => {
        rowDiv.appendChild(createAnimeCard(anime));
    });
}

async function loadAnimeGrid() {
    const animeList = await fetchTopAnime();
    window.currentAnimeList = animeList;

    if (!animeList.length) {
        const gridDiv = document.getElementById('anime-grid');
        gridDiv.innerHTML = '<p class="empty-message">Unable to load anime list. Please try again later.</p>';
        return;
    }

    populateAnimeGrid(animeList);
    selectAnime(animeList[0]);
}

async function runSearch(query) {
    const animeList = await searchAnime(query);
    window.currentAnimeList = animeList;
    const gridDiv = document.getElementById('anime-grid');

    if (!animeList.length) {
        gridDiv.innerHTML = '<p class="empty-message">No anime matched your search. Try a different title.</p>';
        return;
    }

    populateAnimeGrid(animeList);
    selectAnime(animeList[0]);
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function setActiveNav(navId) {
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('active', link.id === navId);
    });
}

function showSection(title, filterCallback) {
    const gridDiv = document.getElementById('anime-grid');
    gridDiv.innerHTML = '<p class="empty-message">Loading...</p>';

    if (filterCallback) {
        const filtered = window.currentAnimeList?.filter(filterCallback) || [];
        if (!filtered.length) {
            gridDiv.innerHTML = `<p class="empty-message">No anime available for ${title}.</p>`;
            return;
        }
        populateAnimeGrid(filtered);
        selectAnime(filtered[0]);
    } else {
        loadAnimeGrid();
    }
}

function showHome() {
    setActiveNav('nav-home');
    loadAnimeGrid();
}

function showTrending() {
    setActiveNav('nav-trending');
    showSection('Trending', anime => anime.score !== 'N/A' && anime.score >= 8);
}

function showCategories() {
    setActiveNav('nav-categories');
    showSection('Categories', anime => ['TV', 'Movie', 'ONA', 'OVA', 'Special'].includes(anime.type));
}

function showMyList() {
    setActiveNav('nav-mylist');
    const savedList = getSavedList();

    if (!savedList.length) {
        const gridDiv = document.getElementById('anime-grid');
        gridDiv.innerHTML = '<p class="empty-message">Your list is empty. Add anime from the catalog by clicking on them.</p>';
        document.getElementById('save-btn').textContent = '+ Add to My List';
        document.getElementById('save-btn').disabled = true;
        return;
    }

    populateAnimeGrid(savedList);
    selectAnime(savedList[0]);
}

function saveToMyList(anime) {
    if (!anime) {
        return false;
    }
    const savedList = getSavedList();
    const exists = savedList.some(item => item.mal_id === anime.mal_id);
    if (exists) {
        return false;
    }
    savedList.push(anime);
    localStorage.setItem('aniflixMyList', JSON.stringify(savedList));
    return true;
}

function showPlayer() {
    if (!selectedAnime) {
        return;
    }
    window.open(getWatchLink('youtube', selectedAnime.title), '_blank');
}

function addSelectedToMyList() {
    if (!selectedAnime) {
        return;
    }
    if (saveToMyList(selectedAnime)) {
        const saveBtn = document.getElementById('save-btn');
        saveBtn.textContent = '✔ Added to My List';
        saveBtn.disabled = true;
    }
}

async function initialize() {
    const [animeList, airingList, popularList, favoriteList, movieList] = await Promise.all([
        fetchTopAnime(),
        fetchAiringAnime(),
        fetchPopularAnime(),
        fetchFavoriteAnime(),
        fetchMovieAnime()
    ]);

    window.currentAnimeList = animeList;
    populateRow('airing-row', airingList);
    populateRow('popular-row', popularList);
    populateRow('favorites-row', favoriteList);
    populateRow('movies-row', movieList);

    if (!animeList.length) {
        const gridDiv = document.getElementById('anime-grid');
        gridDiv.innerHTML = '<p class="empty-message">Unable to load anime list. Please try again later.</p>';
        return;
    }

    populateAnimeGrid(animeList);
    const featured = animeList[0] || airingList[0] || popularList[0] || favoriteList[0] || movieList[0];
    if (featured) {
        selectAnime(featured);
    }
}

window.addEventListener('load', () => {
    const overlay = document.getElementById('opening-animation');
    setTimeout(() => {
        playIntroSound();
    }, 120);
    if (overlay) {
        setTimeout(() => overlay.classList.add('is-hidden'), 1400);
    }
});

window.addEventListener('pointerdown', playIntroSound, { once: true });
window.addEventListener('keydown', playIntroSound, { once: true });

document.getElementById('play-btn').addEventListener('click', showPlayer);
document.getElementById('save-btn').addEventListener('click', addSelectedToMyList);
document.getElementById('nav-home').addEventListener('click', event => {
    event.preventDefault();
    showHome();
});
document.getElementById('nav-trending').addEventListener('click', event => {
    event.preventDefault();
    showTrending();
});
document.getElementById('nav-categories').addEventListener('click', event => {
    event.preventDefault();
    showCategories();
});
document.getElementById('nav-mylist').addEventListener('click', event => {
    event.preventDefault();
    showMyList();
});
document.getElementById('search-form').addEventListener('submit', event => {
    event.preventDefault();
    const query = document.getElementById('search-input').value;
    if (query.trim().length) {
        runSearch(query);
        setActiveNav('');
    }
});
document.getElementById('search-input').addEventListener('input', debounce(event => runSearch(event.target.value), 450));
document.addEventListener('DOMContentLoaded', () => {
    initialize();
});