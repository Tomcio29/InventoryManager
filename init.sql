-- Initial database setup for inventory management system
-- This file will be executed when PostgreSQL container starts

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE inventory_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'inventory_db');

-- Connect to the database
\c inventory_db;

-- Create tables will be handled by Drizzle migrations
-- This file ensures the database exists and is ready