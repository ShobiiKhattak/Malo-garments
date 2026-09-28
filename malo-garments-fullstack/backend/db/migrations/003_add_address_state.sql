-- Run this ONLY if your database already existed before this column was
-- added. Fresh setups already get it from schema.sql — skip this file.
--
--   mysql -u root -p malo_garments < db/migrations/003_add_address_state.sql

USE malo_garments;

ALTER TABLE addresses
  ADD COLUMN state VARCHAR(100) AFTER city;
