-- Migration: add scans, recon_reports and audit_events tables

CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id TEXT,
  scan_source TEXT,
  location TEXT
);

CREATE TABLE IF NOT EXISTS recon_reports (
  id SERIAL PRIMARY KEY,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  diff TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS audit_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
