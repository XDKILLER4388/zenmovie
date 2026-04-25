const db = require('../config/db');
const tmdb = require('./tmdbService');

// Upsert genres into DB
async function syncGenres() {
  const genres = await tmdb.fetchGenres();
  for (const g of genres) {
    await db.execute(
      'INSERT INTO genres (tmdb_id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
      [g.id, g.name]
    );
  }
  console.log(`✅ Synced ${genres.length} genres`);
}

// Get genre DB ids from tmdb ids
async function getGenreIds(tmdbGenreIds) {
  if (!tmdbGenreIds?.length) return [];
  const [rows] = await db.execute(
    `SELECT id FROM genres WHERE tmdb_id IN (${tmdbGenreIds.map(() => '?').join(',')})`,
    tmdbGenreIds
  );
  return rows.map(r => r.id);
}

// Upsert a movie
async function upsertMovie(tmdbMovie) {
  const details = await tmdb.fetchMovieDetails(tmdbMovie.id);
  const trailerKey = details.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;

  const [result] = await db.execute(`
    INSERT INTO movies (tmdb_id, imdb_id, title, original_title, overview, tagline, release_date,
      runtime, rating, vote_count, popularity, poster_path, backdrop_path, trailer_key, language, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      title=VALUES(title), overview=VALUES(overview), rating=VALUES(rating),
      vote_count=VALUES(vote_count), popularity=VALUES(popularity),
      poster_path=VALUES(poster_path), backdrop_path=VALUES(backdrop_path),
      trailer_key=VALUES(trailer_key), updated_at=NOW()
  `, [
    details.id, details.imdb_id, details.title, details.original_title,
    details.overview, details.tagline,
    details.release_date || null, details.runtime || null,
    details.vote_average || 0, details.vote_count || 0, details.popularity || 0,
    tmdb.imgUrl(details.poster_path, 'w500'),
    tmdb.imgUrl(details.backdrop_path, 'original'),
    trailerKey, details.original_language, details.status
  ]);

  // Get movie DB id
  const [[movie]] = await db.execute('SELECT id FROM movies WHERE tmdb_id=?', [details.id]);
  if (!movie) return;

  // Sync genres
  const genreIds = await getGenreIds(details.genres?.map(g => g.id));
  for (const gid of genreIds) {
    await db.execute(
      'INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?,?)',
      [movie.id, gid]
    );
  }

  return movie.id;
}

// Upsert a series
async function upsertSeries(tmdbSeries) {
  const details = await tmdb.fetchSeriesDetails(tmdbSeries.id);
  const trailerKey = details.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;

  await db.execute(`
    INSERT INTO series (tmdb_id, imdb_id, title, original_title, overview, tagline,
      first_air_date, last_air_date, status, rating, vote_count, popularity,
      poster_path, backdrop_path, trailer_key, language, total_seasons, total_episodes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      title=VALUES(title), overview=VALUES(overview), rating=VALUES(rating),
      vote_count=VALUES(vote_count), popularity=VALUES(popularity),
      poster_path=VALUES(poster_path), backdrop_path=VALUES(backdrop_path),
      trailer_key=VALUES(trailer_key), total_seasons=VALUES(total_seasons),
      total_episodes=VALUES(total_episodes), last_air_date=VALUES(last_air_date),
      status=VALUES(status), updated_at=NOW()
  `, [
    details.id, details.external_ids?.imdb_id || null,
    details.name, details.original_name,
    details.overview, details.tagline,
    details.first_air_date || null, details.last_air_date || null,
    details.status, details.vote_average || 0, details.vote_count || 0,
    details.popularity || 0,
    tmdb.imgUrl(details.poster_path, 'w500'),
    tmdb.imgUrl(details.backdrop_path, 'original'),
    trailerKey, details.original_language,
    details.number_of_seasons || 0, details.number_of_episodes || 0
  ]);

  const [[series]] = await db.execute('SELECT id FROM series WHERE tmdb_id=?', [details.id]);
  if (!series) return;

  // Sync genres
  const genreIds = await getGenreIds(details.genres?.map(g => g.id));
  for (const gid of genreIds) {
    await db.execute(
      'INSERT IGNORE INTO series_genres (series_id, genre_id) VALUES (?,?)',
      [series.id, gid]
    );
  }

  // Sync seasons & episodes
  for (const s of details.seasons || []) {
    if (s.season_number === 0) continue; // skip specials
    await db.execute(`
      INSERT INTO seasons (series_id, season_number, name, overview, air_date, poster_path, episode_count)
      VALUES (?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), episode_count=VALUES(episode_count), air_date=VALUES(air_date)
    `, [series.id, s.season_number, s.name, s.overview, s.air_date || null,
        tmdb.imgUrl(s.poster_path, 'w300'), s.episode_count || 0]);

    const [[season]] = await db.execute(
      'SELECT id FROM seasons WHERE series_id=? AND season_number=?',
      [series.id, s.season_number]
    );
    if (!season) continue;

    // Fetch episode details
    try {
      const seasonData = await tmdb.fetchSeasonDetails(details.id, s.season_number);
      for (const ep of seasonData.episodes || []) {
        await db.execute(`
          INSERT INTO episodes (series_id, season_id, season_number, episode_number, title,
            overview, air_date, runtime, rating, still_path)
          VALUES (?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE title=VALUES(title), overview=VALUES(overview),
            rating=VALUES(rating), still_path=VALUES(still_path)
        `, [series.id, season.id, s.season_number, ep.episode_number,
            ep.name, ep.overview, ep.air_date || null, ep.runtime || null,
            ep.vote_average || 0, tmdb.imgUrl(ep.still_path, 'w300')]);
      }
    } catch (e) {
      console.error(`Failed to fetch season ${s.season_number} for series ${details.id}:`, e.message);
    }
  }

  return series.id;
}

// Bulk sync trending content
async function syncTrending() {
  console.log('🔄 Syncing trending movies...');
  const { results: movies } = await tmdb.fetchTrendingMovies();
  for (const m of movies.slice(0, 20)) {
    try { await upsertMovie(m); } catch (e) { console.error(`Movie ${m.id}:`, e.message); }
  }

  console.log('🔄 Syncing trending series...');
  const { results: series } = await tmdb.fetchTrendingSeries();
  for (const s of series.slice(0, 10)) {
    try { await upsertSeries(s); } catch (e) { console.error(`Series ${s.id}:`, e.message); }
  }

  // Mark trending
  await db.execute('UPDATE movies SET is_trending=FALSE');
  await db.execute('UPDATE series SET is_trending=FALSE');
  for (const m of movies.slice(0, 10)) {
    await db.execute('UPDATE movies SET is_trending=TRUE WHERE tmdb_id=?', [m.id]);
  }
  for (const s of series.slice(0, 5)) {
    await db.execute('UPDATE series SET is_trending=TRUE WHERE tmdb_id=?', [s.id]);
  }

  console.log('✅ Trending sync complete');
}

async function syncPopular() {
  console.log('🔄 Syncing popular content...');
  const [{ results: movies }, { results: series }] = await Promise.all([
    tmdb.fetchPopularMovies(),
    tmdb.fetchPopularSeries()
  ]);
  for (const m of movies.slice(0, 20)) {
    try { await upsertMovie(m); } catch (e) { console.error(`Movie ${m.id}:`, e.message); }
  }
  for (const s of series.slice(0, 10)) {
    try { await upsertSeries(s); } catch (e) { console.error(`Series ${s.id}:`, e.message); }
  }
  console.log('✅ Popular sync complete');
}

module.exports = { syncGenres, syncTrending, syncPopular, upsertMovie, upsertSeries };
