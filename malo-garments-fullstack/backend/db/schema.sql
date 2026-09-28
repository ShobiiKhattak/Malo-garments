-- Malo Garments — MySQL Schema
-- Run this once to create the database and all tables:
--   mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS malo_garments
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE malo_garments;

-- ─── Categories ───
CREATE TABLE IF NOT EXISTS categories (
  id    VARCHAR(30) PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  slug  VARCHAR(100) NOT NULL UNIQUE,
  image LONGTEXT      -- URL or base64 data URI (uploaded images can be long)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subcategories (
  id          VARCHAR(30) PRIMARY KEY,
  category_id VARCHAR(30) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Products ───
CREATE TABLE IF NOT EXISTS products (
  id             VARCHAR(30) PRIMARY KEY,
  name           VARCHAR(200) NOT NULL,
  price          DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  category_id    VARCHAR(30),
  subcategory_id VARCHAR(30),
  sizes          JSON,             -- e.g. ["S","M","L"]
  colors         JSON,             -- e.g. [{"name":"Black","hex":"#111"}]
  stock          INT NOT NULL DEFAULT 0,
  images         JSON,             -- array of image URLs
  description    TEXT,
  rating         DECIMAL(2,1) DEFAULT 0,
  reviews        INT DEFAULT 0,
  date_added     DATE,
  featured       BOOLEAN DEFAULT FALSE,
  on_sale        BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Customers ───
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(30) PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(30),
  date_joined   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS addresses (
  id         VARCHAR(30) PRIMARY KEY,
  user_id    VARCHAR(30) NOT NULL,
  label      VARCHAR(100),
  phone      VARCHAR(30),
  street     VARCHAR(255),
  city       VARCHAR(100),
  state      VARCHAR(100),
  zip        VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Admin users ───
CREATE TABLE IF NOT EXISTS admin_users (
  id            VARCHAR(30) PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(150)
) ENGINE=InnoDB;

-- ─── Orders ───
CREATE TABLE IF NOT EXISTS orders (
  id             VARCHAR(30) PRIMARY KEY,
  user_id        VARCHAR(30) NULL,
  customer_name  VARCHAR(150),
  customer_email VARCHAR(150),
  customer_phone VARCHAR(30),
  address        VARCHAR(255),
  city           VARCHAR(100),
  state          VARCHAR(100),
  zip            VARCHAR(20),
  country        VARCHAR(100) DEFAULT 'Pakistan',
  subtotal       DECIMAL(10,2) NOT NULL,
  shipping       DECIMAL(10,2) NOT NULL DEFAULT 0,
  total          DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'cod',
  status         ENUM('Pending','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Pending',
  notes          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   VARCHAR(30) NOT NULL,
  product_id VARCHAR(30),
  name       VARCHAR(200),
  image      LONGTEXT,     -- product image snapshot at order time (URL or base64)
  price      DECIMAL(10,2) NOT NULL,
  size       VARCHAR(20),
  color      VARCHAR(50),
  quantity   INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Newsletter ───
CREATE TABLE IF NOT EXISTS newsletter (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(150) NOT NULL UNIQUE,
  subscribed_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

