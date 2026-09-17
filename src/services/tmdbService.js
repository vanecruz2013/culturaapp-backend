const axios = require('axios');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.TMDB_API_KEY;

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: API_KEY, language: 'es-ES' },
});

const formatMovie = (item) => ({
  externalId: String(item.id),
  type: 'MOVIE',
  title: item.title,
  year: item.release_date ? parseInt(item.release_date.slice(0, 4)) : null,
  genre: null, // populated in detail
  coverUrl: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null,
  synopsis: item.overview || null,
  creator: null, // populated in detail (director)
  rating: item.vote_average,
});

const formatSeries = (item) => ({
  externalId: String(item.id),
  type: 'SERIES',
  title: item.name,
  year: item.first_air_date ? parseInt(item.first_air_date.slice(0, 4)) : null,
  genre: null,
  coverUrl: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null,
  synopsis: item.overview || null,
  creator: null,
  rating: item.vote_average,
});

// Search movies
const searchMovies = async (query, page = 1) => {
  const { data } = await tmdb.get('/search/movie', { params: { query, page } });
  return {
    results: data.results.map(formatMovie),
    totalPages: data.total_pages,
    page: data.page,
  };
};

// Search series
const searchSeries = async (query, page = 1) => {
  const { data } = await tmdb.get('/search/tv', { params: { query, page } });
  return {
    results: data.results.map(formatSeries),
    totalPages: data.total_pages,
    page: data.page,
  };
};

// Get movie detail
const getMovieDetail = async (tmdbId) => {
  const { data } = await tmdb.get(`/movie/${tmdbId}`, {
    params: { append_to_response: 'credits' },
  });

  const director = data.credits?.crew?.find((p) => p.job === 'Director');
  const genres = data.genres?.map((g) => g.name).join(', ') || null;

  return {
    externalId: String(data.id),
    type: 'MOVIE',
    title: data.title,
    subtitle: data.tagline || null,
    year: data.release_date ? parseInt(data.release_date.slice(0, 4)) : null,
    genre: genres,
    coverUrl: data.poster_path ? `${TMDB_IMAGE}${data.poster_path}` : null,
    synopsis: data.overview || null,
    creator: director?.name || null,
    runtime: data.runtime,
    rating: data.vote_average,
  };
};

// Get series detail
const getSeriesDetail = async (tmdbId) => {
  const { data } = await tmdb.get(`/tv/${tmdbId}`);
  const genres = data.genres?.map((g) => g.name).join(', ') || null;
  const creator = data.created_by?.[0]?.name || null;

  return {
    externalId: String(data.id),
    type: 'SERIES',
    title: data.name,
    subtitle: data.tagline || null,
    year: data.first_air_date ? parseInt(data.first_air_date.slice(0, 4)) : null,
    genre: genres,
    coverUrl: data.poster_path ? `${TMDB_IMAGE}${data.poster_path}` : null,
    synopsis: data.overview || null,
    creator,
    numberOfSeasons: data.number_of_seasons,
    numberOfEpisodes: data.number_of_episodes,
    rating: data.vote_average,
  };
};

module.exports = { searchMovies, searchSeries, getMovieDetail, getSeriesDetail };
