const axios = require('axios');

const BOOKS_BASE = 'https://www.googleapis.com/books/v1';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

const formatBook = (item) => {
  const info = item.volumeInfo || {};
  const cover =
    info.imageLinks?.thumbnail?.replace('http://', 'https://') || null;

  return {
    externalId: item.id,
    type: 'BOOK',
    title: info.title || 'Sin título',
    subtitle: info.subtitle || null,
    creator: info.authors ? info.authors.join(', ') : null,
    year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) : null,
    genre: info.categories ? info.categories.join(', ') : null,
    coverUrl: cover,
    synopsis: info.description || null,
    pageCount: info.pageCount || null,
  };
};

// Search books
const searchBooks = async (query, page = 0) => {
  const startIndex = page * 10;
  const { data } = await axios.get(`${BOOKS_BASE}/volumes`, {
    params: { q: query, startIndex, maxResults: 10, key: API_KEY, langRestrict: 'es' },
  });

  const items = data.items || [];
  return {
    results: items.map(formatBook),
    totalItems: data.totalItems || 0,
    page,
  };
};

// Get book detail
const getBookDetail = async (googleBooksId) => {
  const { data } = await axios.get(`${BOOKS_BASE}/volumes/${googleBooksId}`, {
    params: { key: API_KEY },
  });
  return formatBook(data);
};

module.exports = { searchBooks, getBookDetail };
