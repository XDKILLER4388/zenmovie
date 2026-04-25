-- StreamVault Database Schema
CREATE DATABASE IF NOT EXISTS zenmovie CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zenmovie;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Genres
CREATE TABLE IF NOT EXISTS genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT UNIQUE,
  name VARCHAR(100) NOT NULL
);

-- Movies
CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT UNIQUE,
  imdb_id VARCHAR(20),
  title VARCHAR(255) NOT NULL,
  original_title VARCHAR(255),
  overview TEXT,
  tagline VARCHAR(500),
  release_date DATE,
  runtime INT,
  rating DECIMAL(3,1) DEFAULT 0,
  vote_count INT DEFAULT 0,
  popularity DECIMAL(10,3) DEFAULT 0,
  poster_path VARCHAR(255),
  backdrop_path VARCHAR(255),
  trailer_key VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(50),
  is_featured BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Movie Genres (junction)
CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id INT,
  genre_id INT,
  PRIMARY KEY (movie_id, genre_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Movie Streams
CREATE TABLE IF NOT EXISTS movie_streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  server_name VARCHAR(100) NOT NULL,
  stream_url TEXT NOT NULL,
  quality VARCHAR(20) DEFAULT '1080p',
  language VARCHAR(10) DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 1,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- TV Series
CREATE TABLE IF NOT EXISTS series (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT UNIQUE,
  imdb_id VARCHAR(20),
  title VARCHAR(255) NOT NULL,
  original_title VARCHAR(255),
  overview TEXT,
  tagline VARCHAR(500),
  first_air_date DATE,
  last_air_date DATE,
  status VARCHAR(50),
  rating DECIMAL(3,1) DEFAULT 0,
  vote_count INT DEFAULT 0,
  popularity DECIMAL(10,3) DEFAULT 0,
  poster_path VARCHAR(255),
  backdrop_path VARCHAR(255),
  trailer_key VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  total_seasons INT DEFAULT 0,
  total_episodes INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Series Genres (junction)
CREATE TABLE IF NOT EXISTS series_genres (
  series_id INT,
  genre_id INT,
  PRIMARY KEY (series_id, genre_id),
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  series_id INT NOT NULL,
  season_number INT NOT NULL,
  name VARCHAR(255),
  overview TEXT,
  air_date DATE,
  poster_path VARCHAR(255),
  episode_count INT DEFAULT 0,
  UNIQUE KEY unique_season (series_id, season_number),
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- Episodes
CREATE TABLE IF NOT EXISTS episodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  series_id INT NOT NULL,
  season_id INT NOT NULL,
  season_number INT NOT NULL,
  episode_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  overview TEXT,
  air_date DATE,
  runtime INT,
  rating DECIMAL(3,1) DEFAULT 0,
  still_path VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_episode (series_id, season_number, episode_number),
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
);

-- Episode Streams
CREATE TABLE IF NOT EXISTS episode_streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  episode_id INT NOT NULL,
  server_name VARCHAR(100) NOT NULL,
  stream_url TEXT NOT NULL,
  quality VARCHAR(20) DEFAULT '1080p',
  language VARCHAR(10) DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 1,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

-- Watch History
CREATE TABLE IF NOT EXISTS watch_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content_type ENUM('movie', 'episode') NOT NULL,
  content_id INT NOT NULL,
  progress INT DEFAULT 0,
  duration INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_watch (user_id, content_type, content_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bookmarks / Favorites
CREATE TABLE IF NOT EXISTS bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content_type ENUM('movie', 'series') NOT NULL,
  content_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_bookmark (user_id, content_type, content_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subtitles
CREATE TABLE IF NOT EXISTS subtitles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_type ENUM('movie', 'episode') NOT NULL,
  content_id INT NOT NULL,
  language VARCHAR(10) NOT NULL,
  language_name VARCHAR(50) NOT NULL,
  subtitle_url TEXT NOT NULL,
  format VARCHAR(10) DEFAULT 'vtt'
);

-- Indexes for performance
CREATE INDEX idx_movies_tmdb ON movies(tmdb_id);
CREATE INDEX idx_movies_featured ON movies(is_featured);
CREATE INDEX idx_movies_trending ON movies(is_trending);
CREATE INDEX idx_movies_rating ON movies(rating DESC);
CREATE INDEX idx_series_tmdb ON series(tmdb_id);
CREATE INDEX idx_episodes_series ON episodes(series_id, season_number, episode_number);
CREATE INDEX idx_watch_history_user ON watch_history(user_id, updated_at DESC);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
