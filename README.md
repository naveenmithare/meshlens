# MeshLens

**See your enterprise data mesh. Actually see it.**

MeshLens is an open-source visualization tool for enterprise data mesh architecture. It turns pipeline metadata into interactive visual experiences that executives, business users, and developers can all understand.

## What it does

| Tab | Description |
|-----|-------------|
| **Introduction** | A guided visual narrative that walks viewers through data mesh — from scattered applications to a fully governed enterprise mesh |
| **MeshAtlas** | An interactive arc visualization of the entire mesh: 55 apps across 7 domains flowing through 89 data products, with live pipeline health, lineage tracing, quality metrics, and a playground to customize the visualization |
| **Semantic Layer** | Schema design documentation with ERD diagrams, table catalog, and view definitions — a reference for enterprises adopting MeshLens |
| **Product Catalogue** | Searchable, filterable inventory of all data products with quality scores, tier badges, and lineage summaries |
| **Data Stories** | Narrative-driven explorations of mesh scenarios *(in progress)* |

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/meshlens.git
cd meshlens
npm install
npm run setup    # runs migrations + seeds 55 apps across 7 domains
npm run dev      # starts at http://localhost:3000
```

## Architecture

```
SQLite (mesh_metadata.db)
  └── SQL migrations (db/migrations/)
       └── Analytical views (v_mesh_overview, v_domain_health, v_lineage_graph, ...)
            └── Next.js server components + API routes
                 └── React + custom SVG visualization layer
```

### Data model

Inspired by [Fivetran's Platform Connector](https://fivetran.com/docs/logs/fivetran-platform) schema, extended for full data mesh:

| Table | Purpose |
|-------|---------|
| `domain` | Business domains (Sales, Finance, Supply Chain, Marketing, Product, HR, Support) |
| `application` | Source systems (Salesforce, SAP, Kafka, Workday, ...) |
| `connection` | Pipeline connections from apps to destinations |
| `destination` | Data warehouses (Snowflake, Databricks, ...) |
| `data_product` | Curated datasets with quality scores, SLA tiers, and product types |
| `data_product_source` | Links data products to their source applications |
| `data_product_consumer` | Downstream consumers of data products |
| `lineage_edge` | Directed dependencies between data products |
| `sync_log` | Individual sync events with rows/bytes/duration |
| `sync_daily_stats` | Aggregated daily pipeline metrics |
| `pipeline_health` | Current health status per connection |
| `schema_change` | Detected DDL changes |
| `governance_policy` | PII, retention, access, and quality policies |
| `sla_breach` | SLA violation records |

### Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Database | SQLite via better-sqlite3 |
| Visualization | Custom SVG (arc geometry, animated flow paths, interactive bubbles) |
| Styling | Tailwind CSS 4 with runtime theming |

## Seed data

The seed script generates realistic enterprise data:

- 7 domains (Sales, Finance, Supply Chain, Marketing, Product, HR, Support)
- 55 applications (Salesforce, Jira, SAP EBS, Kafka, GitHub, Workday, ...)
- 55 pipeline connections with varied connectors and sync frequencies
- 89 data products (55 source, 21 business, 14 consumer) across gold/silver/bronze tiers
- 117 lineage edges across domains
- 90 days of sync history (~35k log entries)
- Schema changes, governance policies, SLA breaches

## API routes

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Mesh overview + executive KPIs |
| `GET /api/lineage` | Full lineage graph (nodes + edges) |
| `GET /api/domains` | Domain list with health metrics |
| `GET /api/domain-health` | Domain health + governance policies |
| `GET /api/pipelines` | Pipeline status; `?view=volume\|errors\|schema-changes` |

## Project structure

```
meshlens/
  db/
    migrations/         SQL schema + views (6 migration files)
    mesh_metadata.db    Generated database (gitignored)
  scripts/
    migrate.ts          Migration runner
    seed.ts             Synthetic data generator
  src/
    app/                Next.js pages (/, /meshatlas, /semantic, /catalogue, /stories)
    app/api/            REST API routes
    app/intro/          Introduction page client component
    components/         Layout and navigation components
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

1. Add a new migration file in `db/migrations/`
2. Add seed data in `scripts/seed.ts`
3. Add query functions in `src/lib/queries.ts`
4. Add API routes in `src/app/api/`

## License

MIT
