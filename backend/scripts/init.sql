-- Initialize database with proper charset and collation
CREATE DATABASE IF NOT EXISTS library_kiosk 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Grant privileges to library user
GRANT ALL PRIVILEGES ON library_kiosk.* TO 'library_user'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE library_kiosk;