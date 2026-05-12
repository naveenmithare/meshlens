# MeshLens

**See your enterprise data mesh. Actually see it.**

MeshLens is a visualization tool for enterprise data mesh observability. It turns pipeline metadata, lineage, quality, and health signals into one explorable system map that both technical and business audiences can understand.

Created by **Naveen Mithare**.

## What it does

| Tab | Description |
|-----|-------------|
| **Introduction** | A guided visual narrative walking through data mesh — from scattered applications to a fully governed enterprise mesh |
| **MeshAtlas** | An interactive arc visualization of the entire mesh: 55 apps across 7 domains flowing through 89 data products, with live pipeline health (healthy / broken / warning), lineage tracing, quality metrics, and an AI assistant (Ask Atlas) |
| **Semantic Layer** | Schema design documentation with ERD diagrams, view catalog, and an enterprise adoption guide |

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/meshlens.git
cd meshlens
npm install
cp .env.example .env.local   # add your Gemini API key
npm run setup                 # migrates + seeds 55 apps across 7 domains
npm run dev                   # starts at http://localhost:3000
```

## Architecture

```
SQLite (db/mesh_metadata.db)
  └── SQL migrations (db/migrations/)
       └── Analytical views (v_mesh_overview, v_domain_health, v_lineage_graph, ...)
            └── Next.js server components + API routes
                 └── React + custom SVG visualization layer
```

### Data model

Inspired by Fivetran's Platform Connector schema, extended for full data mesh:

| Table | Purpose |
|-------|---------|
| `domain` | Business domains (Sales, Finance, Supply Chain, Marketing, Product, HR, Support) |
| `application` | Source systems (Salesforce, SAP, Kafka, Workday, ...) |
| `connection` | Pipeline connections from apps to destinations |
| `destination` | Data warehouses (Snowflake, Databricks, ...) |
| `data_product` | Curated datasets with quality scores, SLA tiers, and product types |
| `lineage_edge` | Directed dependencies between data products (with edge status) |
| `sync_log` | Individual sync events with rows/bytes/duration |
| `pipeline_health` | Current health status per connection |
| `product_pipeline_run` | Per-model orchestration runs (healthy / broken / warning) |
| `governance_policy` | PII, retention, access, and quality policies |

### Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Database | SQLite via better-sqlite3 (pre-built at build time) |
| AI | Google Gemini 2.5 Flash-Lite (streaming via SSE) |
| Visualization | Custom SVG (arc geometry, animated flow paths, interactive bubbles) |
| Styling | Tailwind CSS 4 with runtime theming |

## Seed data

The seed script generates realistic enterprise metadata:

- 7 domains (Sales, Finance, Supply Chain, Marketing, Product, HR, Support)
- 55 applications (Salesforce, Jira, EBS, Kafka, GitHub, Workday, ...)
- 55 pipeline connections with varied connectors and sync frequencies
- 89 data products (55 source, 21 business, 14 consumer)
- 117 lineage edges across domains
- Pipeline failure cascade: 6 broken + 2 paused app-to-source pipelines, downstream warning propagation
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
| `POST /api/chat` | Ask Atlas AI assistant (streaming SSE) |

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
    app/                Next.js pages (/, /meshatlas, /semantic)
    app/api/            REST + streaming API routes
    app/meshatlas/
      playground/       Playground config types + usePlayground hook
      components/       UI primitive components (SliderRow, ColorRow, etc.)
      lib/              Geometry utils, AI context builder
    components/         Layout and navigation
    lib/                Database access, typed queries, shared constants
```

## Authoring mode

During development, set `NEXT_PUBLIC_AUTHORING_MODE=true` in `.env.local` to enable:

- **Playground panel** — fine-tune every visual parameter (colors, sizes, positions)
- **Draggable elements** — reposition search bar, toggle bars, legends, labels
- **Appearance customization** — change fonts, accent color, background from the nav bar

In production (when the env var is absent or not `"true"`), these controls are hidden and the layout is fixed.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (runs `db:prepare` automatically) |
| `npm run db:migrate` | Run SQL migrations |
| `npm run db:seed` | Generate seed data |
| `npm run db:prepare` | Clean, migrate, and seed from scratch |
| `npm run setup` | Alias for `db:prepare` |

## Deploying to Vercel

1. Push the repo to GitHub
2. Import into Vercel (Hobby plan works)
3. Set environment variables:
   - `GEMINI_API_KEY` — your Google Gemini API key
   - Do **not** set `NEXT_PUBLIC_AUTHORING_MODE` (keeps playground hidden)
4. Deploy — the `prebuild` script auto-generates the SQLite database

## License

MIT
