-- MeshLens Core Tables
-- Domain, Application, Connection, Destination, Data Product, Lineage

CREATE TABLE IF NOT EXISTS domain (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  owner_team    TEXT,
  color_hex     TEXT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  app_type      TEXT NOT NULL CHECK (app_type IN ('CRM','ERP','STREAMING','API','DATABASE','SaaS','DEVTOOLS','HRIS','ANALYTICS','MARKETPLACE')),
  domain_id     TEXT NOT NULL REFERENCES domain(id),
  description   TEXT,
  vendor        TEXT,
  environment   TEXT NOT NULL DEFAULT 'PROD' CHECK (environment IN ('PROD','STAGING','DEV')),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS destination (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('SNOWFLAKE','DATABRICKS','BIGQUERY','REDSHIFT','POSTGRES')),
  region        TEXT,
  database_name TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connection (
  id              TEXT PRIMARY KEY,
  application_id  TEXT NOT NULL REFERENCES application(id),
  destination_id  TEXT NOT NULL REFERENCES destination(id),
  connector_type  TEXT NOT NULL CHECK (connector_type IN ('fivetran','airbyte','custom','kafka','api','dbt','spark')),
  connection_name TEXT NOT NULL,
  schema_name     TEXT,
  status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','BROKEN','SETUP')),
  sync_frequency  TEXT DEFAULT '1hr' CHECK (sync_frequency IN ('5min','15min','1hr','6hr','24hr')),
  setup_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  paused          BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS data_product (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  domain_id       TEXT NOT NULL REFERENCES domain(id),
  description     TEXT,
  owner           TEXT,
  sla_freshness   TEXT DEFAULT '< 1hr',
  quality_score   REAL DEFAULT 0.85 CHECK (quality_score >= 0.0 AND quality_score <= 1.0),
  tier            TEXT NOT NULL DEFAULT 'SILVER' CHECK (tier IN ('GOLD','SILVER','BRONZE')),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_product_source (
  data_product_id TEXT NOT NULL REFERENCES data_product(id),
  connection_id   TEXT NOT NULL REFERENCES connection(id),
  table_name      TEXT NOT NULL,
  PRIMARY KEY (data_product_id, connection_id, table_name)
);

CREATE TABLE IF NOT EXISTS lineage_edge (
  id                TEXT PRIMARY KEY,
  source_product_id TEXT NOT NULL REFERENCES data_product(id),
  target_product_id TEXT NOT NULL REFERENCES data_product(id),
  edge_type         TEXT NOT NULL DEFAULT 'FEEDS' CHECK (edge_type IN ('FEEDS','DERIVES','AGGREGATES')),
  description       TEXT
);

CREATE INDEX IF NOT EXISTS idx_app_domain ON application(domain_id);
CREATE INDEX IF NOT EXISTS idx_conn_app ON connection(application_id);
CREATE INDEX IF NOT EXISTS idx_conn_dest ON connection(destination_id);
CREATE INDEX IF NOT EXISTS idx_dp_domain ON data_product(domain_id);
CREATE INDEX IF NOT EXISTS idx_lineage_src ON lineage_edge(source_product_id);
CREATE INDEX IF NOT EXISTS idx_lineage_tgt ON lineage_edge(target_product_id);
