# MeshLens

**See your enterprise data mesh. Actually see it.**

MeshLens is an open-source visualization tool for enterprise data mesh architecture. It turns pipeline metadata into interactive, pudding.cool-style visual stories that executives, business users, and developers can all understand.

## What it does

- **Scrollytelling landing page** -- A guided visual essay that walks viewers through your data mesh, from scattered applications to a fully governed mesh
- **Executive dashboard** -- KPI cards, domain health treemaps, and 90-day volume stream charts
- **Business dashboard** -- Domain explorer, data product catalog with quality scores and tier badges, filterable application inventory
- **Developer dashboard** -- Interactive lineage graph, pipeline status table, error feed, and schema change timeline

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/meshlens.git
cd meshlens
npm install
npm run setup    # runs migrations + seeds 50 apps across 6 domains
npm run dev      # starts at http://localhost:3000
```

## Architecture

```
SQLite (mesh_metadata.db)
  └── SQL migrations (db/migrations/)
       └── Analytical views (v_mesh_overview, v_domain_health, v_lineage_graph, ...)
            └── Next.js API routes (/api/stats, /api/lineage, /api/pipelines, ...)
                 └── React + D3.js + Scrollama visualization layer
```

### Data model

Inspired by [Fivetran's Platform Connector](https://fivetran.com/docs/logs/fivetran-platform) schema, extended for full data mesh:

| Table | Purpose |
|-------|---------|
| `domain` | Business domains (Sales, Finance, Supply Chain, ...) |
| `application` | Source systems (Salesforce, SAP, Kafka, ...) |
| `connection` | Pipeline connections from apps to destinations |
| `destination` | Data warehouses (Snowflake, Databricks, ...) |
| `data_product` | Curated datasets with quality scores and SLA tiers |
| `lineage_edge` | Directed dependencies between data products |
| `sync_log` | Individual sync events with rows/bytes/duration |
| `sync_daily_stats` | Aggregated daily pipeline metrics |
| `pipeline_health` | Current health status per connection |
| `schema_change` | Detected DDL changes |
| `governance_policy` | PII, retention, access, and quality policies |

### Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | SQLite via better-sqlite3 |
| Visualization | D3.js 7 (force graphs, treemaps, stream charts) |
| Scrollytelling | Scrollama (IntersectionObserver) |
| Styling | Tailwind CSS 4 |

## Seed data

The seed script generates realistic enterprise data:

- 6 domains
- 50 applications (Salesforce, Jira, SAP EBS, Kafka, GitHub, Workday, ...)
- 50 pipeline connections with varied connectors and sync frequencies
- 15 data products (gold/silver/bronze tiers)
- 20 lineage edges across domains
- 90 days of sync history (~35k log entries)
- Schema changes, governance policies

## Project structure

```
meshlens/
  db/
    migrations/         SQL schema + views
    mesh_metadata.db    Generated database (gitignored)
  scripts/
    migrate.ts          Migration runner
    seed.ts             Synthetic data generator
  src/
    app/                Next.js pages (/, /exec, /business, /dev)
    components/         React + D3 visualization components
    lib/                Database access and typed queries
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run SQL migrations |
| `npm run db:seed` | Generate seed data |
| `npm run db:reset` | Drop, migrate, and re-seed |
| `npm run setup` | Migrate + seed (first-time setup) |

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run `npm run db:reset` to ensure a clean database
4. Make your changes
5. Run `npm run build` to verify everything compiles
6. Open a PR

### Extending the data model

1. Add a new migration file in `db/migrations/` (e.g., `004_your_table.sql`)
2. Add seed data in `scripts/seed.ts`
3. Add query functions in `src/lib/queries.ts`
4. Add API routes in `src/app/api/`
5. Build visualization components in `src/components/viz/`

## License

MIT
