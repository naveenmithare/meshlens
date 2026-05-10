"use client";

import { useState } from "react";

type CatalogTab = "columns" | "sources" | "logic" | "lineage";

export default function SemanticClient() {
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("columns");
  const [catalogFilter, setCatalogFilter] = useState<string | null>(null);

  const views = VIEWS_DATA;
  const activeView = views.find((v) => v.name === selectedView) ?? null;
  const totalCols = views.reduce((sum, v) => sum + v.columns.length, 0);
  const uniqueSources = new Set(views.flatMap((v) => v.sources)).size;
  const dashboardGroups = Array.from(new Set(views.map((v) => v.dashboard)));
  const filteredViews = catalogFilter ? views.filter((v) => v.dashboard === catalogFilter) : views;

  return (
    <div className="pt-28 min-h-screen">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-8 pb-14">
        <span className="section-label">Semantic Layer</span>
        <h1 className="heading-display mb-5">Schema & Data Architecture</h1>
        <p className="text-[16px] text-mesh-text-muted leading-[1.9]">
          The semantic layer is the backbone of MeshLens — a <strong className="text-mesh-text font-medium">normalized,
          vendor-agnostic metadata schema</strong> that models the entire data mesh lifecycle: domains,
          applications, connections, data products, lineage, governance, and operational health.
          Any organization adopting data mesh can use this schema as the single source of truth
          for mesh observability — regardless of the underlying warehouse or tooling.
        </p>
      </section>

      {/* Design Principles */}
      <section className="max-w-[1200px] mx-auto px-8 pb-16 border-t border-mesh-border pt-16">
        <h2 className="text-xl font-semibold text-mesh-text mb-8">Design Principles</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { title: "Domain-Driven Ownership", color: "#a78bfa", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z", desc: "Every entity belongs to a domain. Applications, data products, and governance policies carry a domain_id FK — enabling per-domain ownership, cost attribution, and health scoring." },
            { title: "Lineage-First Modeling", color: "#22c55e", icon: "M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H2v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-3z", desc: "Lineage edges connect data products — not tables or columns. This gives a high-level, product-centric view of data flow (FEEDS, DERIVES, AGGREGATES) that maps directly to business understanding." },
            { title: "Operational Separation", color: "#00d8ff", icon: "M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6a5.5 5.5 0 015.6 4.37l.24 1.13H19c1.65 0 3 1.35 3 3s-1.35 3-3 3z", desc: "Metadata tables (domain, product, lineage) are distinct from time-series operational tables (sync_log, pipeline_health). Operational data scales independently." },
          ].map((p) => (
            <div key={p.title} className="card-colored" style={{ backgroundColor: `${p.color}20` }}>
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" fill={p.color}><path d={p.icon} /></svg>
                <h3 className="text-[15px] font-bold text-mesh-text">{p.title}</h3>
              </div>
              <p className="text-[14px] text-mesh-text-muted leading-[1.7]">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ERD */}
      <section className="max-w-[1200px] mx-auto px-8 pb-16">
        <h2 className="text-xl font-semibold text-mesh-text mb-3">Entity Relationship Diagram</h2>
        <p className="text-base text-mesh-text-muted leading-relaxed mb-6">
          14 tables organized across four zones — core platform entities model the organizational structure,
          the data mesh layer captures products and lineage, pipeline operations track time-series health,
          and governance enforces policies and SLA compliance.
        </p>
        <div className="bg-white rounded-2xl border border-mesh-border p-6 overflow-x-auto">
          <ERDDiagram />
        </div>
      </section>

      {/* Schema Groups */}
      <section className="max-w-[1200px] mx-auto px-8 pb-16">
        <h2 className="text-xl font-semibold text-mesh-text mb-8">Schema Design</h2>
        <div className="grid grid-cols-3 gap-6">
          {SCHEMA_GROUPS.map((group) => (
            <div key={group.title} className="bg-white rounded-xl border border-mesh-border p-6">
              <h3 className="text-base font-bold mb-1.5" style={{ color: group.color }}>{group.title}</h3>
              <p className="text-xs text-mesh-text-muted leading-relaxed mb-5">{group.desc}</p>
              <div className="space-y-4">
                {group.tables.map((t) => (
                  <div
                    key={t.name}
                    className="w-full text-left bg-mesh-bg-light border border-mesh-border rounded-lg px-4 py-3"
                  >
                    <div className="text-sm font-bold text-mesh-text font-mono mb-1">{t.name}</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {t.cols.map((c) => {
                        const isPK = c.includes("PK");
                        const isFK = c.includes("FK");
                        const isCK = c.includes("CHECK");
                        return (
                          <span key={c} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isPK ? "bg-mesh-accent/10 text-mesh-text font-semibold"
                            : isFK ? "text-mesh-accent bg-mesh-accent/5"
                            : isCK ? "text-amber-400/70 bg-amber-400/5"
                            : "text-mesh-text-muted bg-mesh-bg-light"
                          }`}>
                            {c.replace(" PK", " ⚷").replace(" FK", " →").replace(" CHECK", " ✓")}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-mesh-text-muted leading-snug">{t.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ View Catalog ═══ */}
      <section className="max-w-[1200px] mx-auto px-8 pb-16">
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-xl font-semibold text-mesh-text">View Catalog</h2>
          <div className="flex items-center gap-3 text-[11px] text-mesh-text-muted/40">
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" opacity={0.4}><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
              {views.length} views
            </span>
            <span>·</span>
            <span>{totalCols} columns</span>
            <span>·</span>
            <span>{uniqueSources} source tables</span>
          </div>
        </div>
        <p className="text-base text-mesh-text-muted leading-relaxed mb-6">
          Analytical views that power MeshLens dashboards. Select a view to explore its schema,
          upstream lineage, and query logic.
        </p>

        {/* Dashboard filter chips */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setCatalogFilter(null)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              catalogFilter === null
                ? "bg-mesh-accent/10 border-mesh-accent/20 text-mesh-accent"
                : "bg-transparent border-mesh-border text-mesh-text-muted hover:border-mesh-border"
            }`}
          >All ({views.length})</button>
          {dashboardGroups.map((d) => {
            const count = views.filter((v) => v.dashboard === d).length;
            const isActive = catalogFilter === d;
            return (
              <button
                key={d}
                onClick={() => setCatalogFilter(isActive ? null : d)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? "bg-mesh-accent/10 border-mesh-accent/20 text-mesh-accent"
                    : "bg-transparent border-mesh-border text-mesh-text-muted hover:border-mesh-border"
                }`}
              >{d === "All Dashboards" ? "Global" : d} ({count})</button>
            );
          })}
        </div>

        {/* View cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {filteredViews.map((view) => {
            const isActive = selectedView === view.name;
            return (
              <button
                key={view.name}
                onClick={() => { setSelectedView(isActive ? null : view.name); setCatalogTab("columns"); }}
                className={`group text-left rounded-xl transition-all border overflow-hidden ${
                  isActive
                    ? "bg-white ring-1 ring-mesh-accent/15"
                    : "bg-white border-mesh-border hover:border-mesh-border hover:bg-white"
                }`}
                style={isActive ? { borderColor: `${view.color}30` } : undefined}
              >
                <div className="h-1 w-full" style={{ backgroundColor: isActive ? view.color : "transparent" }} />
                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[11px] font-bold font-mono leading-tight ${isActive ? "text-mesh-accent" : "text-mesh-text"}`}>
                      {view.name}
                    </span>
                    <span
                      className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ color: view.color, backgroundColor: `${view.color}12` }}
                    >
                      {view.dashboard === "All Dashboards" ? "Global" : view.dashboard}
                    </span>
                  </div>
                  <p className="text-[10px] text-mesh-text-muted leading-snug line-clamp-2 mb-3 min-h-[28px]">{view.desc}</p>
                  <div className="flex items-center gap-4 text-[9px] text-mesh-text-muted/40">
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor" opacity={0.3}><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" /></svg>
                      {view.columns.length} cols
                    </span>
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor" opacity={0.3}><path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4z" /></svg>
                      {view.sources.length} src
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel (expands below cards) */}
        {activeView && (
          <div className="bg-white border border-mesh-border rounded-xl overflow-hidden">
            {/* Detail header */}
            <div className="px-6 py-5 border-b border-mesh-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: activeView.color }} />
                  <h3 className="text-lg font-bold text-mesh-accent font-mono">{activeView.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded" style={{ color: activeView.color, backgroundColor: `${activeView.color}10` }}>{activeView.dashboard}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-mesh-bg-light text-mesh-text-muted">Materialized View</span>
                </div>
              </div>
              <p className="text-sm text-mesh-text-muted mb-4">{activeView.desc}</p>
              <div className="flex items-center gap-8">
                {[
                  { label: "Columns", value: activeView.columns.length, color: "#00d8ff" },
                  { label: "Sources", value: activeView.sources.length, color: "#22c55e" },
                  { label: "Downstream", value: 1, color: "#a78bfa" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                    <span className="text-[10px] text-mesh-text-muted/50 uppercase tracking-wider">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-mesh-border">
              {([
                { key: "columns" as CatalogTab, label: "Columns", icon: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" },
                { key: "sources" as CatalogTab, label: "Source Tables", icon: "M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4z" },
                { key: "lineage" as CatalogTab, label: "Lineage", icon: "M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H2v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-3z" },
                { key: "logic" as CatalogTab, label: "Query Logic", icon: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" },
              ]).map((t) => (
                <button key={t.key} onClick={() => setCatalogTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                    catalogTab === t.key
                      ? "text-mesh-accent border-mesh-accent"
                      : "text-mesh-text-muted border-transparent hover:text-mesh-text"
                  }`}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d={t.icon} /></svg>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {catalogTab === "columns" && (
                <div className="overflow-hidden rounded-lg border border-mesh-border">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-mesh-bg-light">
                        <th className="text-[10px] font-bold text-mesh-text uppercase tracking-wider px-4 py-2.5 w-8">#</th>
                        <th className="text-[10px] font-bold text-mesh-text uppercase tracking-wider px-4 py-2.5">Column Name</th>
                        <th className="text-[10px] font-bold text-mesh-text uppercase tracking-wider px-4 py-2.5">Type</th>
                        <th className="text-[10px] font-bold text-mesh-text uppercase tracking-wider px-4 py-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeView.columnDetails.map((col, i) => (
                        <tr key={col.name} className="border-t border-mesh-border-light hover:bg-mesh-bg-light">
                          <td className="text-[10px] text-mesh-text-muted/30 px-4 py-2.5 tabular-nums">{i + 1}</td>
                          <td className="text-xs font-mono text-mesh-text px-4 py-2.5">{col.name}</td>
                          <td className="px-4 py-2.5"><span className="text-[10px] font-mono text-mesh-text-muted/60 bg-mesh-bg-light rounded px-1.5 py-0.5">{col.type}</span></td>
                          <td className="text-[11px] text-mesh-text-muted px-4 py-2.5">{col.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {catalogTab === "sources" && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeView.sourceDetails.map((src, i) => (
                    <div key={src.table} className="bg-mesh-bg-light border border-mesh-border rounded-xl p-4 relative">
                      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-mesh-accent/10 to-transparent" />
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-5 h-5 rounded bg-mesh-accent/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="#00d8ff" opacity={0.7}>
                            <path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4z" />
                          </svg>
                        </div>
                        <span className="text-sm font-bold font-mono text-mesh-accent">{src.table}</span>
                        <span className="ml-auto text-[9px] text-mesh-text-muted/30 tabular-nums">#{i + 1}</span>
                      </div>
                      <p className="text-[11px] text-mesh-text-muted leading-snug mb-3">{src.role}</p>
                      <div className="flex flex-wrap gap-1">
                        {src.usedColumns.map((c) => (
                          <span key={c} className="text-[9px] font-mono text-mesh-text-muted/60 bg-mesh-bg-light border border-mesh-border rounded px-1.5 py-0.5">{c}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {catalogTab === "lineage" && (
                <div className="py-4">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-0">
                    {/* Source tables column */}
                    <div className="space-y-2 pr-2">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-mesh-text-muted/30 mb-3 pl-1">Upstream Sources</div>
                      {activeView.sources.map((s) => (
                        <div key={s} className="flex items-center gap-2 text-[11px] font-mono text-mesh-accent bg-mesh-accent/5 border border-mesh-accent/10 rounded-lg px-3 py-2.5">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="#00d8ff" opacity={0.5}>
                            <path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4z" />
                          </svg>
                          {s}
                        </div>
                      ))}
                    </div>
                    {/* Connector */}
                    <div className="flex flex-col items-center gap-1 px-5">
                      <div className="w-16 h-px bg-gradient-to-r from-mesh-accent/20 to-mesh-accent/5" />
                      <span className="text-[8px] text-mesh-text-muted/30 uppercase tracking-widest font-bold">JOIN</span>
                    </div>
                    {/* View node */}
                    <div className="px-2">
                      <div className="bg-mesh-accent/5 border-2 rounded-xl px-8 py-5 text-center relative" style={{ borderColor: `${activeView.color}30` }}>
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-white border border-mesh-border text-mesh-text-muted/40">View</div>
                        <div className="text-sm font-bold font-mono text-mesh-accent mb-1">{activeView.name}</div>
                        <div className="text-[10px] text-mesh-text-muted">{activeView.columns.length} columns</div>
                      </div>
                    </div>
                    {/* Connector */}
                    <div className="flex flex-col items-center gap-1 px-5">
                      <div className="w-16 h-px bg-gradient-to-r from-white/5 to-white/10" />
                      <span className="text-[8px] text-mesh-text-muted/30 uppercase tracking-widest font-bold">SERVES</span>
                    </div>
                    {/* Dashboard node */}
                    <div className="pl-2">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-mesh-text-muted/30 mb-3 pl-1">Downstream</div>
                      <div className="border border-mesh-border rounded-xl px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill={activeView.color} opacity={0.7}>
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                          </svg>
                          <span className="text-xs font-bold" style={{ color: activeView.color }}>{activeView.dashboard}</span>
                        </div>
                        <div className="text-[10px] text-mesh-text-muted pl-6">Dashboard</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {catalogTab === "logic" && (
                <div className="relative">
                  <div className="absolute top-3 right-3 text-[9px] uppercase tracking-wider font-bold text-mesh-text-muted/20 bg-mesh-bg-light rounded px-2 py-1">SQL</div>
                  <div className="bg-[#0d1117] border border-mesh-border rounded-xl p-6">
                    <pre className="text-[13px] text-mesh-text-muted leading-relaxed whitespace-pre-wrap font-mono">{activeView.logic}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Adoption */}
      <section className="max-w-[1200px] mx-auto px-8 pb-24">
        <h2 className="text-xl font-semibold text-mesh-text mb-8">Adopting This Schema</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-mesh-border rounded-xl p-6">
            <h3 className="text-base font-bold text-mesh-accent mb-3">Vendor-Agnostic by Design</h3>
            <p className="text-xs text-mesh-text-muted leading-relaxed mb-5">
              The schema uses standard SQL types, CHECK constraints, and foreign keys — no vendor-specific
              extensions. Deploy on any warehouse and the table structure, relationships, and views
              remain identical.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Snowflake", "PostgreSQL", "BigQuery", "Redshift", "Databricks", "MySQL", "SQLite"].map((db) => (
                <span key={db} className="text-xs font-mono text-mesh-text-muted bg-mesh-bg-light border border-white/[0.05] rounded px-2.5 py-1">{db}</span>
              ))}
            </div>
          </div>
          <div className="bg-white border border-mesh-border rounded-xl p-6">
            <h3 className="text-base font-bold text-mesh-accent mb-3">Integration Points</h3>
            <p className="text-xs text-mesh-text-muted leading-relaxed mb-5">
              Populate the core tables from your metadata catalog, sync tools, and orchestrators.
              Operational tables can be fed from webhook events or batch ETL.
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Metadata Catalogs", tools: "Atlan · DataHub · Collibra · OpenMetadata" },
                { label: "Sync & Ingestion", tools: "Airbyte · Stitch · Snowpipe · Custom ETL" },
                { label: "Orchestration", tools: "Airflow · dbt · Dagster · Prefect" },
                { label: "Governance", tools: "Privacera · Immuta · Apache Ranger" },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline gap-3">
                  <span className="text-xs font-bold text-mesh-text shrink-0 w-32">{row.label}</span>
                  <span className="text-xs text-mesh-text-muted font-mono">{row.tools}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* SCHEMA GROUPS DATA                                     */
/* ═══════════════════════════════════════════════════════ */

const SCHEMA_GROUPS = [
  {
    title: "Core Entities", color: "#a78bfa",
    desc: "The organizational backbone — domains own applications, applications connect to destinations through managed connections.",
    tables: [
      { name: "domain", cols: ["id PK", "name", "description", "owner_team", "color_hex", "created_at"], purpose: "Business domains — the fundamental ownership and organizational unit" },
      { name: "application", cols: ["id PK", "name", "app_type CHECK", "domain_id FK", "vendor", "environment CHECK", "created_at"], purpose: "SaaS, ERP, Database, and API systems with environment tags" },
      { name: "destination", cols: ["id PK", "name", "type CHECK", "region", "database_name", "created_at"], purpose: "Target data warehouses with region for latency considerations" },
      { name: "connection", cols: ["id PK", "application_id FK", "destination_id FK", "connector_type CHECK", "sync_frequency CHECK", "status CHECK", "monthly_cost_usd", "rows_per_sync_avg"], purpose: "Application → Destination pipe with sync cadence, cost, and status" },
    ],
  },
  {
    title: "Data Products & Lineage", color: "#22c55e",
    desc: "The product layer — every data product has a type, tier, quality score, SLA, and directional lineage edges.",
    tables: [
      { name: "data_product", cols: ["id PK", "name", "domain_id FK", "product_type CHECK", "tier CHECK", "quality_score CHECK", "sla_freshness", "owner", "description"], purpose: "The mesh quantum — typed, tiered, quality-scored, and SLA-bound" },
      { name: "lineage_edge", cols: ["id PK", "source_product_id FK", "target_product_id FK", "edge_type CHECK", "description"], purpose: "Directed edges (FEEDS, DERIVES, AGGREGATES) between products" },
      { name: "data_product_source", cols: ["data_product_id FK", "connection_id FK", "table_name"], purpose: "Junction linking products to upstream connections and tables" },
      { name: "data_product_consumer", cols: ["id PK", "data_product_id FK", "consumer_name", "consumer_type CHECK", "team", "access_frequency CHECK"], purpose: "Who/what consumes each product — dashboards, ML models, APIs" },
    ],
  },
  {
    title: "Operational & Governance", color: "#00d8ff",
    desc: "Time-series health data and governance policies — separated from core entities so operational telemetry can scale independently.",
    tables: [
      { name: "sync_log", cols: ["id PK", "connection_id FK", "event_type CHECK", "rows_synced", "bytes_synced", "duration_sec", "started_at", "completed_at"], purpose: "Event-level sync audit trail with timing and volume" },
      { name: "sync_daily_stats", cols: ["connection_id FK", "measured_date", "syncs_completed", "rows_synced", "errors_count", "avg_duration_sec"], purpose: "Pre-aggregated daily metrics — avoids expensive log scans" },
      { name: "pipeline_health", cols: ["connection_id FK", "measured_at", "status CHECK", "last_success_at", "failure_streak", "avg_latency_sec"], purpose: "Latest health snapshot — healthy, degraded, or down" },
      { name: "schema_change", cols: ["id PK", "connection_id FK", "change_type CHECK", "table_name", "column_name", "detected_at"], purpose: "Column adds, drops, and renames — drift alerting" },
      { name: "governance_policy", cols: ["id PK", "name", "policy_type CHECK", "domain_id FK", "scope CHECK", "enforced"], purpose: "RBAC, PII, retention, quality rules — domain-scoped or global" },
      { name: "sla_breach", cols: ["id PK", "data_product_id FK", "breach_type CHECK", "severity CHECK", "expected_value", "actual_value", "detected_at", "resolved_at"], purpose: "Freshness and quality SLA breaches with resolution tracking" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════ */
/* VIEWS DATA (for catalog)                               */
/* ═══════════════════════════════════════════════════════ */

const VIEWS_DATA = [
  {
    name: "v_mesh_overview", dashboard: "All Dashboards", color: "#00d8ff",
    desc: "Single-row mesh summary providing a global health snapshot",
    columns: ["domain_count", "app_count", "product_count", "source_products", "business_products", "consumer_products", "connection_count", "active_connections", "broken_connections", "lineage_edges", "total_consumers", "overall_health_pct", "total_monthly_cost_usd", "open_sla_breaches"],
    sources: ["domain", "application", "data_product", "connection", "lineage_edge", "data_product_consumer", "pipeline_health", "sla_breach"],
    columnDetails: [
      { name: "domain_count", type: "INT", desc: "Total number of business domains" },
      { name: "app_count", type: "INT", desc: "Total registered applications across all domains" },
      { name: "product_count", type: "INT", desc: "Total data products (all types)" },
      { name: "source_products", type: "INT", desc: "Count of source-aligned data products" },
      { name: "business_products", type: "INT", desc: "Count of business data products" },
      { name: "consumer_products", type: "INT", desc: "Count of consumer-aligned data products" },
      { name: "connection_count", type: "INT", desc: "Total managed connections" },
      { name: "active_connections", type: "INT", desc: "Connections with status = ACTIVE" },
      { name: "broken_connections", type: "INT", desc: "Connections with status = BROKEN" },
      { name: "lineage_edges", type: "INT", desc: "Total directed edges in lineage graph" },
      { name: "total_consumers", type: "INT", desc: "Total downstream consumer registrations" },
      { name: "overall_health_pct", type: "REAL", desc: "% of pipelines in HEALTHY state (latest snapshot)" },
      { name: "total_monthly_cost_usd", type: "REAL", desc: "Sum of monthly_cost_usd for non-paused connections" },
      { name: "open_sla_breaches", type: "INT", desc: "Unresolved SLA breaches (resolved_at IS NULL)" },
    ],
    sourceDetails: [
      { table: "domain", role: "Counted for domain_count", usedColumns: ["COUNT(*)"] },
      { table: "data_product", role: "Counted total and by product_type", usedColumns: ["COUNT(*)", "product_type"] },
      { table: "connection", role: "Counted total, active, broken; summed cost", usedColumns: ["COUNT(*)", "status", "monthly_cost_usd"] },
      { table: "pipeline_health", role: "Latest status per connection for health %", usedColumns: ["connection_id", "status", "measured_at"] },
      { table: "sla_breach", role: "Open breaches where resolved_at IS NULL", usedColumns: ["resolved_at"] },
    ],
    logic: "SELECT\n  (SELECT COUNT(*) FROM domain) AS domain_count,\n  (SELECT COUNT(*) FROM data_product) AS product_count,\n  (SELECT COUNT(*) FROM data_product\n   WHERE product_type = 'SOURCE_ALIGNED') AS source_products,\n  ...\n  (SELECT ROUND(AVG(CASE WHEN ph.status = 'HEALTHY'\n    THEN 1.0 ELSE 0.0 END) * 100, 1)\n   FROM pipeline_health ph\n   WHERE ph.measured_at = (\n     SELECT MAX(measured_at) FROM pipeline_health ph2\n     WHERE ph2.connection_id = ph.connection_id\n   )) AS overall_health_pct;",
  },
  {
    name: "v_domain_health", dashboard: "Executive", color: "#00d8ff",
    desc: "Per-domain health matrix with product breakdown and cost",
    columns: ["domain_id", "domain_name", "color_hex", "owner_team", "app_count", "connection_count", "product_count", "source_products", "business_products", "consumer_products", "healthy_count", "degraded_count", "down_count", "avg_quality_score", "monthly_cost_usd"],
    sources: ["domain", "application", "connection", "pipeline_health", "data_product"],
    columnDetails: [
      { name: "domain_id", type: "TEXT", desc: "Domain primary key" },
      { name: "domain_name", type: "TEXT", desc: "Human-readable domain name" },
      { name: "color_hex", type: "TEXT", desc: "Domain brand color for charts" },
      { name: "owner_team", type: "TEXT", desc: "Team owning this domain" },
      { name: "app_count", type: "INT", desc: "Applications in this domain" },
      { name: "connection_count", type: "INT", desc: "Connections from this domain's apps" },
      { name: "product_count", type: "INT", desc: "Total data products in this domain" },
      { name: "source_products", type: "INT", desc: "Source-aligned products" },
      { name: "business_products", type: "INT", desc: "Business products" },
      { name: "consumer_products", type: "INT", desc: "Consumer-aligned products" },
      { name: "healthy_count", type: "INT", desc: "Pipelines in HEALTHY state" },
      { name: "degraded_count", type: "INT", desc: "Pipelines in DEGRADED state" },
      { name: "down_count", type: "INT", desc: "Pipelines in DOWN state" },
      { name: "avg_quality_score", type: "REAL", desc: "Average quality score across products" },
      { name: "monthly_cost_usd", type: "REAL", desc: "Total monthly cost for this domain" },
    ],
    sourceDetails: [
      { table: "domain", role: "Base table — one row per domain", usedColumns: ["id", "name", "color_hex", "owner_team"] },
      { table: "application", role: "LEFT JOIN on domain_id for app counts", usedColumns: ["id", "domain_id"] },
      { table: "connection", role: "LEFT JOIN on application_id for pipeline counts", usedColumns: ["id", "application_id", "monthly_cost_usd"] },
      { table: "pipeline_health", role: "Latest status per connection via correlated subquery", usedColumns: ["connection_id", "status", "measured_at"] },
      { table: "data_product", role: "LEFT JOIN on domain_id for product counts and quality", usedColumns: ["domain_id", "product_type", "quality_score"] },
    ],
    logic: "SELECT d.id, d.name, d.color_hex, d.owner_team,\n  COUNT(DISTINCT a.id) AS app_count,\n  COUNT(DISTINCT c.id) AS connection_count,\n  SUM(CASE WHEN dp.product_type = 'SOURCE_ALIGNED'\n    THEN 1 ELSE 0 END) AS source_products,\n  ...\n  ROUND(AVG(dp.quality_score), 2) AS avg_quality_score\nFROM domain d\nLEFT JOIN application a ON a.domain_id = d.id\nLEFT JOIN connection c ON c.application_id = a.id\nLEFT JOIN (...latest pipeline_health...) ph\n  ON ph.connection_id = c.id\nLEFT JOIN data_product dp ON dp.domain_id = d.id\nGROUP BY d.id;",
  },
  {
    name: "v_exec_kpis", dashboard: "Executive", color: "#00d8ff",
    desc: "Executive KPI scorecard — uptime, latency, tiers, breaches",
    columns: ["total_pipelines", "active_pipelines", "uptime_pct", "avg_latency_sec", "total_products", "gold_products", "silver_products", "bronze_products", "total_domains", "total_monthly_cost", "open_breaches", "critical_breaches", "total_consumers", "gold_avg_quality"],
    sources: ["connection", "pipeline_health", "data_product", "domain", "sla_breach", "data_product_consumer"],
    columnDetails: [
      { name: "total_pipelines", type: "INT", desc: "Total connections" },
      { name: "active_pipelines", type: "INT", desc: "Connections with status = ACTIVE" },
      { name: "uptime_pct", type: "REAL", desc: "% of pipelines HEALTHY (latest snapshot)" },
      { name: "avg_latency_sec", type: "REAL", desc: "Average pipeline latency in seconds" },
      { name: "total_products", type: "INT", desc: "All data products" },
      { name: "gold_products", type: "INT", desc: "Products with tier = GOLD" },
      { name: "silver_products", type: "INT", desc: "Products with tier = SILVER" },
      { name: "bronze_products", type: "INT", desc: "Products with tier = BRONZE" },
      { name: "total_domains", type: "INT", desc: "Number of domains" },
      { name: "total_monthly_cost", type: "REAL", desc: "Summed monthly cost (non-paused)" },
      { name: "open_breaches", type: "INT", desc: "All unresolved SLA breaches" },
      { name: "critical_breaches", type: "INT", desc: "HIGH/CRITICAL unresolved breaches" },
      { name: "total_consumers", type: "INT", desc: "Registered downstream consumers" },
      { name: "gold_avg_quality", type: "REAL", desc: "Average quality % of gold-tier products" },
    ],
    sourceDetails: [
      { table: "connection", role: "Pipeline counts and cost aggregation", usedColumns: ["status", "monthly_cost_usd"] },
      { table: "pipeline_health", role: "Uptime and latency from latest snapshot", usedColumns: ["status", "avg_latency_sec", "measured_at"] },
      { table: "data_product", role: "Product counts by tier and quality scores", usedColumns: ["tier", "quality_score"] },
      { table: "sla_breach", role: "Open and critical breach counts", usedColumns: ["resolved_at", "severity"] },
    ],
    logic: "Single-row SELECT with scalar subqueries:\n• Uptime: AVG(CASE WHEN status='HEALTHY'...) from latest pipeline_health\n• Latency: AVG(avg_latency_sec) from latest snapshot\n• Tier counts: COUNT(*) WHERE tier IN ('GOLD','SILVER','BRONZE')\n• Breaches: COUNT WHERE severity IN ('HIGH','CRITICAL') AND resolved_at IS NULL\n• Gold quality: AVG(quality_score)*100 WHERE tier='GOLD'",
  },
  {
    name: "v_lineage_graph", dashboard: "Business", color: "#a78bfa",
    desc: "Product nodes and lineage edges for D3 graph rendering",
    columns: ["node_type", "node_id", "node_label", "tier", "quality_score", "product_type", "domain_id", "domain_name", "color_hex", "source_id", "target_id", "edge_type", "edge_desc"],
    sources: ["data_product", "domain", "lineage_edge"],
    columnDetails: [
      { name: "node_type", type: "TEXT", desc: "'product' or 'edge' — split by consumers" },
      { name: "node_id", type: "TEXT", desc: "Product ID or edge ID" },
      { name: "node_label", type: "TEXT", desc: "Product name or edge description" },
      { name: "tier", type: "TEXT", desc: "GOLD/SILVER/BRONZE (products only)" },
      { name: "quality_score", type: "REAL", desc: "0.0–1.0 quality score (products only)" },
      { name: "product_type", type: "TEXT", desc: "SOURCE_ALIGNED / BUSINESS / CONSUMER_ALIGNED" },
      { name: "domain_id", type: "TEXT", desc: "Parent domain ID (products only)" },
      { name: "domain_name", type: "TEXT", desc: "Domain name for labeling" },
      { name: "color_hex", type: "TEXT", desc: "Domain color for visualization" },
      { name: "source_id", type: "TEXT", desc: "Source product ID (edges only)" },
      { name: "target_id", type: "TEXT", desc: "Target product ID (edges only)" },
      { name: "edge_type", type: "TEXT", desc: "FEEDS / DERIVES / AGGREGATES" },
      { name: "edge_desc", type: "TEXT", desc: "Edge description text" },
    ],
    sourceDetails: [
      { table: "data_product", role: "Product nodes with tier, quality, type", usedColumns: ["id", "name", "tier", "quality_score", "product_type", "domain_id"] },
      { table: "domain", role: "Domain name and color for each product", usedColumns: ["id", "name", "color_hex"] },
      { table: "lineage_edge", role: "Edge records with source/target IDs", usedColumns: ["id", "source_product_id", "target_product_id", "edge_type", "description"] },
    ],
    logic: "UNION ALL of two selects:\n\n1) Product nodes:\nSELECT 'product', dp.id, dp.name, dp.tier,\n  dp.quality_score, dp.product_type, d.id, d.name, d.color_hex,\n  NULL, NULL, NULL, NULL\nFROM data_product dp\nJOIN domain d ON d.id = dp.domain_id\n\n2) Lineage edges:\nSELECT 'edge', le.id, le.description, NULL, NULL,\n  NULL, NULL, NULL, NULL,\n  le.source_product_id, le.target_product_id,\n  le.edge_type, le.description\nFROM lineage_edge le;",
  },
  {
    name: "v_product_flow", dashboard: "Business", color: "#a78bfa",
    desc: "Source → target edges with metadata for Sankey diagrams",
    columns: ["id", "source_name", "source_type", "source_domain", "source_color", "target_name", "target_type", "target_domain", "target_color", "edge_type"],
    sources: ["lineage_edge", "data_product", "domain"],
    columnDetails: [
      { name: "id", type: "TEXT", desc: "Lineage edge ID" },
      { name: "source_name", type: "TEXT", desc: "Source product name" },
      { name: "source_type", type: "TEXT", desc: "Source product type" },
      { name: "source_domain", type: "TEXT", desc: "Source product domain ID" },
      { name: "source_color", type: "TEXT", desc: "Source domain color hex" },
      { name: "target_name", type: "TEXT", desc: "Target product name" },
      { name: "target_type", type: "TEXT", desc: "Target product type" },
      { name: "target_domain", type: "TEXT", desc: "Target product domain ID" },
      { name: "target_color", type: "TEXT", desc: "Target domain color hex" },
      { name: "edge_type", type: "TEXT", desc: "FEEDS / DERIVES / AGGREGATES" },
    ],
    sourceDetails: [
      { table: "lineage_edge", role: "Base edge records", usedColumns: ["id", "source_product_id", "target_product_id", "edge_type"] },
      { table: "data_product (src)", role: "Source product metadata", usedColumns: ["id", "name", "product_type", "domain_id"] },
      { table: "data_product (tgt)", role: "Target product metadata", usedColumns: ["id", "name", "product_type", "domain_id"] },
      { table: "domain (src)", role: "Source domain color", usedColumns: ["id", "color_hex"] },
      { table: "domain (tgt)", role: "Target domain color", usedColumns: ["id", "color_hex"] },
    ],
    logic: "SELECT le.id,\n  src.name, src.product_type, src.domain_id, sd.color_hex,\n  tgt.name, tgt.product_type, tgt.domain_id, td.color_hex,\n  le.edge_type\nFROM lineage_edge le\nJOIN data_product src ON src.id = le.source_product_id\nJOIN data_product tgt ON tgt.id = le.target_product_id\nJOIN domain sd ON sd.id = src.domain_id\nJOIN domain td ON td.id = tgt.domain_id;",
  },
  {
    name: "v_pipeline_status", dashboard: "Developer", color: "#22c55e",
    desc: "Per-connection operational status with health and errors",
    columns: ["connection_id", "connection_name", "connector_type", "connection_status", "sync_frequency", "monthly_cost_usd", "rows_per_sync_avg", "app_name", "app_type", "domain_name", "color_hex", "destination_name", "health_status", "last_success_at", "failure_streak", "avg_latency_sec", "error_count_7d"],
    sources: ["connection", "application", "domain", "destination", "pipeline_health", "sync_daily_stats"],
    columnDetails: [
      { name: "connection_id", type: "TEXT", desc: "Connection primary key" },
      { name: "connection_name", type: "TEXT", desc: "Human-readable connection name" },
      { name: "connector_type", type: "TEXT", desc: "FIVETRAN / AIRBYTE / CUSTOM / DIRECT" },
      { name: "connection_status", type: "TEXT", desc: "ACTIVE / PAUSED / BROKEN" },
      { name: "sync_frequency", type: "TEXT", desc: "Sync cadence (HOURLY, DAILY, etc.)" },
      { name: "monthly_cost_usd", type: "REAL", desc: "Monthly connector cost" },
      { name: "rows_per_sync_avg", type: "INT", desc: "Average rows per sync run" },
      { name: "app_name", type: "TEXT", desc: "Source application name" },
      { name: "app_type", type: "TEXT", desc: "Application type (SaaS, ERP, etc.)" },
      { name: "domain_name", type: "TEXT", desc: "Owning domain name" },
      { name: "color_hex", type: "TEXT", desc: "Domain color for charts" },
      { name: "destination_name", type: "TEXT", desc: "Target warehouse name" },
      { name: "health_status", type: "TEXT", desc: "HEALTHY / DEGRADED / DOWN (latest)" },
      { name: "last_success_at", type: "DATETIME", desc: "Timestamp of last successful sync" },
      { name: "failure_streak", type: "INT", desc: "Consecutive failed syncs" },
      { name: "avg_latency_sec", type: "REAL", desc: "Average sync latency" },
      { name: "error_count_7d", type: "INT", desc: "Errors in last 7 days" },
    ],
    sourceDetails: [
      { table: "connection", role: "Base table for all pipeline metadata", usedColumns: ["id", "connection_name", "connector_type", "status", "sync_frequency", "monthly_cost_usd", "rows_per_sync_avg"] },
      { table: "application", role: "JOIN for app name and type", usedColumns: ["id", "name", "app_type", "domain_id"] },
      { table: "domain", role: "JOIN for domain name and color", usedColumns: ["id", "name", "color_hex"] },
      { table: "destination", role: "JOIN for target warehouse name", usedColumns: ["id", "name"] },
      { table: "pipeline_health", role: "Latest health snapshot via correlated subquery", usedColumns: ["connection_id", "status", "last_success_at", "failure_streak", "avg_latency_sec", "measured_at"] },
      { table: "sync_daily_stats", role: "7-day error window aggregation", usedColumns: ["connection_id", "errors_count", "measured_date"] },
    ],
    logic: "SELECT c.*, a.name, d.name, dest.name,\n  ph.status, ph.last_success_at,\n  ph.failure_streak, ph.avg_latency_sec,\n  COALESCE(err.error_count_7d, 0)\nFROM connection c\nJOIN application a ON a.id = c.application_id\nJOIN domain d ON d.id = a.domain_id\nJOIN destination dest ON dest.id = c.destination_id\nLEFT JOIN (\n  SELECT ... FROM pipeline_health ph1\n  WHERE ph1.measured_at = (\n    SELECT MAX(measured_at) FROM pipeline_health ph2\n    WHERE ph2.connection_id = ph1.connection_id)\n) ph ON ph.connection_id = c.id\nLEFT JOIN (\n  SELECT connection_id, SUM(errors_count)\n  FROM sync_daily_stats\n  WHERE measured_date >= DATE('now','-7 days')\n  GROUP BY connection_id\n) err ON err.connection_id = c.id;",
  },
  {
    name: "v_daily_volume", dashboard: "Developer", color: "#22c55e",
    desc: "Daily ingestion volume by domain for time-series charts",
    columns: ["measured_date", "domain_id", "domain_name", "color_hex", "total_rows", "total_syncs", "total_errors"],
    sources: ["sync_daily_stats", "connection", "application", "domain"],
    columnDetails: [
      { name: "measured_date", type: "DATE", desc: "Calendar date" },
      { name: "domain_id", type: "TEXT", desc: "Domain primary key" },
      { name: "domain_name", type: "TEXT", desc: "Domain name for labeling" },
      { name: "color_hex", type: "TEXT", desc: "Domain color for chart series" },
      { name: "total_rows", type: "INT", desc: "Total rows synced on this date" },
      { name: "total_syncs", type: "INT", desc: "Number of completed syncs" },
      { name: "total_errors", type: "INT", desc: "Total sync errors" },
    ],
    sourceDetails: [
      { table: "sync_daily_stats", role: "Base metrics grouped by date", usedColumns: ["connection_id", "measured_date", "rows_synced", "syncs_completed", "errors_count"] },
      { table: "connection", role: "JOIN to reach application", usedColumns: ["id", "application_id"] },
      { table: "application", role: "JOIN to reach domain", usedColumns: ["id", "domain_id"] },
      { table: "domain", role: "Domain name and color", usedColumns: ["id", "name", "color_hex"] },
    ],
    logic: "SELECT sds.measured_date,\n  d.id, d.name, d.color_hex,\n  SUM(sds.rows_synced) AS total_rows,\n  SUM(sds.syncs_completed) AS total_syncs,\n  SUM(sds.errors_count) AS total_errors\nFROM sync_daily_stats sds\nJOIN connection c ON c.id = sds.connection_id\nJOIN application a ON a.id = c.application_id\nJOIN domain d ON d.id = a.domain_id\nGROUP BY sds.measured_date, d.id\nORDER BY sds.measured_date;",
  },
  {
    name: "v_failure_patterns", dashboard: "Developer", color: "#22c55e",
    desc: "Error rates by day-of-week for seasonal pattern detection",
    columns: ["day_of_week", "measured_date", "domain_name", "color_hex", "total_errors", "total_syncs", "error_rate_pct"],
    sources: ["sync_daily_stats", "connection", "application", "domain"],
    columnDetails: [
      { name: "day_of_week", type: "INT", desc: "0 = Sunday, 6 = Saturday" },
      { name: "measured_date", type: "DATE", desc: "Calendar date" },
      { name: "domain_name", type: "TEXT", desc: "Domain name" },
      { name: "color_hex", type: "TEXT", desc: "Domain color" },
      { name: "total_errors", type: "INT", desc: "Sum of errors for this date+domain" },
      { name: "total_syncs", type: "INT", desc: "Sum of syncs for this date+domain" },
      { name: "error_rate_pct", type: "REAL", desc: "errors / syncs × 100" },
    ],
    sourceDetails: [
      { table: "sync_daily_stats", role: "Base metrics with date", usedColumns: ["connection_id", "measured_date", "errors_count", "syncs_completed"] },
      { table: "connection", role: "JOIN to reach application", usedColumns: ["id", "application_id"] },
      { table: "application", role: "JOIN to reach domain", usedColumns: ["id", "domain_id"] },
      { table: "domain", role: "Domain name and color", usedColumns: ["id", "name", "color_hex"] },
    ],
    logic: "SELECT\n  CAST(strftime('%w', measured_date) AS INTEGER) AS day_of_week,\n  measured_date, d.name, d.color_hex,\n  SUM(errors_count) AS total_errors,\n  SUM(syncs_completed) AS total_syncs,\n  CASE WHEN SUM(syncs_completed) > 0\n    THEN ROUND(CAST(SUM(errors_count) AS REAL)\n      / SUM(syncs_completed) * 100, 2)\n    ELSE 0\n  END AS error_rate_pct\nFROM sync_daily_stats sds\nJOIN connection c ON c.id = sds.connection_id\nJOIN application a ON a.id = c.application_id\nJOIN domain d ON d.id = a.domain_id\nGROUP BY measured_date, d.id;",
  },
];

/* ═══════════════════════════════════════════════════════ */
/* ERD SVG DIAGRAM                                        */
/* Computed layouts, no overlaps, orthogonal connections   */
/* ═══════════════════════════════════════════════════════ */

interface Ent {
  name: string;
  x: number;
  y: number;
  w: number;
  color: string;
  cols: string[];
}

function entHeight(cols: string[]) {
  return 34 + cols.length * 22 + 14;
}

function ERDDiagram() {
  const colW = 250;
  const gapX = 100;
  const padX = 50;
  const c = (i: number) => padX + i * (colW + gapX);

  const domainCols = ["id  PK", "name", "description", "owner_team", "color_hex", "created_at"];
  const appCols = ["id  PK", "name", "app_type", "domain_id  FK", "vendor", "environment", "created_at"];
  const connCols = ["id  PK", "application_id  FK", "destination_id  FK", "connector_type", "sync_frequency", "status", "monthly_cost_usd", "rows_per_sync_avg"];
  const destCols = ["id  PK", "name", "type", "region", "database_name", "created_at"];
  const dpCols = ["id  PK", "name", "domain_id  FK", "product_type", "tier", "quality_score", "sla_freshness", "owner", "description"];
  const leCols = ["id  PK", "source_product_id  FK", "target_product_id  FK", "edge_type", "description"];
  const slCols = ["id  PK", "connection_id  FK", "event_type", "rows_synced", "bytes_synced", "duration_sec", "started_at"];
  const phCols = ["connection_id  FK", "measured_at", "status", "last_success_at", "failure_streak", "avg_latency_sec"];
  const dpcCols = ["id  PK", "data_product_id  FK", "consumer_name", "consumer_type", "team", "access_frequency"];
  const dpsCols = ["data_product_id  FK", "connection_id  FK", "table_name"];
  const sdsCols = ["connection_id  FK", "measured_date", "syncs_completed", "rows_synced", "errors_count", "avg_duration_sec"];
  const scCols = ["id  PK", "connection_id  FK", "change_type", "table_name", "column_name", "detected_at"];
  const gpCols = ["id  PK", "name", "policy_type", "scope", "domain_id  FK", "enforced"];
  const sbCols = ["id  PK", "data_product_id  FK", "breach_type", "severity", "expected_value", "actual_value", "detected_at", "resolved_at"];

  const r1y = 90;
  const r1h = Math.max(entHeight(domainCols), entHeight(appCols), entHeight(connCols), entHeight(destCols));
  const r2y = r1y + r1h + 80;
  const r2t1hLeft = Math.max(entHeight(dpCols), entHeight(leCols));
  const r2t1hRight = Math.max(entHeight(slCols), entHeight(phCols));
  const r2t2yLeft = r2y + r2t1hLeft + 55;
  const r2t2yRight = r2y + r2t1hRight + 55;
  const r2EndLeft = r2t2yLeft + Math.max(entHeight(dpcCols), entHeight(dpsCols));
  const r2EndRight = r2t2yRight + Math.max(entHeight(sdsCols), entHeight(scCols));
  const r3y = Math.max(r2EndLeft, r2EndRight) + 80;

  const entities: Ent[] = [
    { name: "domain",       x: c(0), y: r1y, w: colW, color: "#a78bfa", cols: domainCols },
    { name: "application",  x: c(1), y: r1y, w: colW, color: "#e76f51", cols: appCols },
    { name: "connection",   x: c(2), y: r1y, w: colW, color: "#00d8ff", cols: connCols },
    { name: "destination",  x: c(3), y: r1y, w: colW, color: "#94a3b8", cols: destCols },

    { name: "data_product",          x: c(0), y: r2y, w: colW, color: "#22c55e", cols: dpCols },
    { name: "lineage_edge",          x: c(1), y: r2y, w: colW, color: "#eab308", cols: leCols },
    { name: "sync_log",              x: c(2), y: r2y, w: colW, color: "#00d8ff", cols: slCols },
    { name: "pipeline_health",       x: c(3), y: r2y, w: colW, color: "#22c55e", cols: phCols },

    { name: "data_product_consumer", x: c(0), y: r2t2yLeft, w: colW, color: "#c2702e", cols: dpcCols },
    { name: "data_product_source",   x: c(1), y: r2t2yLeft, w: colW, color: "#94a3b8", cols: dpsCols },
    { name: "sync_daily_stats",      x: c(2), y: r2t2yRight, w: colW, color: "#a78bfa", cols: sdsCols },
    { name: "schema_change",         x: c(3), y: r2t2yRight, w: colW, color: "#eab308", cols: scCols },

    { name: "governance_policy", x: c(0), y: r3y, w: colW, color: "#f472b6", cols: gpCols },
    { name: "sla_breach",        x: c(1), y: r3y, w: colW, color: "#ef4444", cols: sbCols },
  ];

  const eMap = Object.fromEntries(entities.map((e) => [e.name, e]));

  type Conn = { from: string; to: string; label: string; fromSide: "r" | "b" | "l" | "t"; toSide: "l" | "t" | "r" | "b"; fromPort?: number; toPort?: number };

  const connections: Conn[] = [
    { from: "domain", to: "application", label: "1:N", fromSide: "r", toSide: "l" },
    { from: "application", to: "connection", label: "1:N", fromSide: "r", toSide: "l" },
    { from: "connection", to: "destination", label: "N:1", fromSide: "r", toSide: "l" },

    { from: "domain", to: "data_product", label: "1:N", fromSide: "b", toSide: "t" },
    { from: "domain", to: "governance_policy", label: "1:N", fromSide: "l", toSide: "l", fromPort: 0.85, toPort: 0.3 },

    { from: "data_product", to: "lineage_edge", label: "N:N", fromSide: "r", toSide: "l", fromPort: 0.3 },
    { from: "data_product", to: "data_product_consumer", label: "1:N", fromSide: "b", toSide: "t", fromPort: 0.35 },
    { from: "data_product", to: "data_product_source", label: "1:N", fromSide: "r", toSide: "l", fromPort: 0.7 },
    { from: "data_product", to: "sla_breach", label: "1:N", fromSide: "r", toSide: "l", fromPort: 0.9, toPort: 0.25 },

    { from: "connection", to: "sync_log", label: "1:N", fromSide: "b", toSide: "t", fromPort: 0.35 },
    { from: "connection", to: "sync_daily_stats", label: "1:N", fromSide: "r", toSide: "r", fromPort: 0.85, toPort: 0.3 },
    { from: "connection", to: "pipeline_health", label: "1:N", fromSide: "r", toSide: "l", fromPort: 0.5, toPort: 0.4 },
    { from: "connection", to: "schema_change", label: "1:N", fromSide: "r", toSide: "l", fromPort: 0.7, toPort: 0.4 },
    { from: "connection", to: "data_product_source", label: "N:1", fromSide: "l", toSide: "r", fromPort: 0.85 },
  ];

  function getAnchor(ent: Ent, side: "l" | "r" | "t" | "b", port = 0.5): [number, number] {
    const eh = entHeight(ent.cols);
    switch (side) {
      case "l": return [ent.x, ent.y + eh * port];
      case "r": return [ent.x + ent.w, ent.y + eh * port];
      case "t": return [ent.x + ent.w * port, ent.y];
      case "b": return [ent.x + ent.w * port, ent.y + eh];
    }
  }

  function noodleData(conn: Conn) {
    const from = eMap[conn.from];
    const to = eMap[conn.to];
    if (!from || !to) return null;
    const [x1, y1] = getAnchor(from, conn.fromSide, conn.fromPort);
    const [x2, y2] = getAnchor(to, conn.toSide, conn.toPort);
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sameSide = conn.fromSide === conn.toSide;
    const isH = (s: string) => s === "l" || s === "r";

    let tension: number;
    if (sameSide) {
      tension = Math.max(30, Math.min((isH(conn.fromSide) ? dy : dx) * 0.12, 60));
    } else if (isH(conn.fromSide) && isH(conn.toSide)) {
      tension = Math.max(40, Math.min(dx * 0.6, 120));
    } else if (!isH(conn.fromSide) && !isH(conn.toSide)) {
      tension = Math.max(40, Math.min(dy * 0.4, 120));
    } else {
      tension = Math.max(40, Math.min(Math.max(dx, dy) * 0.35, 120));
    }

    const cp = (x: number, y: number, side: string): [number, number] => {
      switch (side) {
        case "r": return [x + tension, y];
        case "l": return [x - tension, y];
        case "b": return [x, y + tension];
        case "t": return [x, y - tension];
        default: return [x, y];
      }
    };

    const [cx1, cy1] = cp(x1, y1, conn.fromSide);
    const [cx2, cy2] = cp(x2, y2, conn.toSide);

    return {
      path: `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`,
      mid: [
        0.125 * x1 + 0.375 * cx1 + 0.375 * cx2 + 0.125 * x2,
        0.125 * y1 + 0.375 * cy1 + 0.375 * cy2 + 0.125 * y2,
      ] as [number, number],
    };
  }

  const totalW = c(3) + colW + padX;
  const maxY = Math.max(...entities.map((e) => e.y + entHeight(e.cols)));
  const totalH = maxY + 50;

  const zx = padX - 20;
  const leftW = c(1) + colW + 20 - zx;
  const rightX = c(2) - 20;
  const rightW = c(3) + colW + 20 - rightX;
  const fullW = c(3) + colW + 20 - zx;

  const z1 = { x: zx, y: r1y - 35, w: fullW, h: r1y + r1h + 16 - (r1y - 35) };
  const z2 = { x: zx, y: r2y - 35, w: leftW, h: r2EndLeft + 20 - (r2y - 35) };
  const z3 = { x: rightX, y: r2y - 35, w: rightW, h: r2EndRight + 20 - (r2y - 35) };
  const z4 = { x: zx, y: r3y - 35, w: leftW, h: r3y + Math.max(entHeight(gpCols), entHeight(sbCols)) + 20 - (r3y - 35) };

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Zone backgrounds */}
      <rect x={z1.x} y={z1.y} width={z1.w} height={z1.h} rx="16" fill="#a78bfa" opacity="0.03" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.08" />
      <rect x={z2.x} y={z2.y} width={z2.w} height={z2.h} rx="16" fill="#22c55e" opacity="0.03" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.08" />
      <rect x={z3.x} y={z3.y} width={z3.w} height={z3.h} rx="16" fill="#00d8ff" opacity="0.03" stroke="#00d8ff" strokeWidth="1" strokeOpacity="0.08" />
      <rect x={z4.x} y={z4.y} width={z4.w} height={z4.h} rx="16" fill="#f472b6" opacity="0.03" stroke="#f472b6" strokeWidth="1" strokeOpacity="0.08" />

      {/* Zone labels */}
      <text x={z1.x + 16} y={z1.y + 22} fill="#a78bfa" opacity="0.35" fontWeight="700" style={{ fontSize: 12, letterSpacing: "0.15em" }}>CORE PLATFORM</text>
      <text x={z2.x + 16} y={z2.y + 22} fill="#22c55e" opacity="0.35" fontWeight="700" style={{ fontSize: 12, letterSpacing: "0.15em" }}>DATA MESH LAYER</text>
      <text x={z3.x + 16} y={z3.y + 22} fill="#00d8ff" opacity="0.35" fontWeight="700" style={{ fontSize: 12, letterSpacing: "0.15em" }}>PIPELINE OPERATIONS</text>
      <text x={z4.x + 16} y={z4.y + 22} fill="#f472b6" opacity="0.35" fontWeight="700" style={{ fontSize: 12, letterSpacing: "0.15em" }}>GOVERNANCE & QUALITY</text>

      {/* Noodle connections */}
      {connections.map((conn, i) => {
        const nd = noodleData(conn);
        if (!nd) return null;
        const from = eMap[conn.from];
        const [mx, my] = nd.mid;
        return (
          <g key={`conn-${i}`}>
            <path d={nd.path} fill="none" stroke={from.color} strokeWidth="4" opacity="0.08" strokeLinecap="round" />
            <path d={nd.path} fill="none" stroke={from.color} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
            {conn.label && (
              <g>
                <rect x={mx - 16} y={my - 10} width="32" height="18" rx="9" fill="#ffffff" stroke={from.color} strokeWidth="0.8" strokeOpacity="0.25" />
                <text x={mx} y={my + 3} textAnchor="middle" fill="#ffffff" opacity="0.5" fontWeight="600" style={{ fontSize: 9 }}>{conn.label}</text>
              </g>
            )}
          </g>
        );
      })}

      {/* Entity boxes */}
      {entities.map((ent) => {
        const eh = entHeight(ent.cols);
        return (
          <g key={ent.name}>
            <rect x={ent.x} y={ent.y} width={ent.w} height={eh} rx="10" fill="#ffffff" stroke={`${ent.color}40`} strokeWidth="1.5" />
            <rect x={ent.x} y={ent.y} width={ent.w} height="34" rx="10" fill={`${ent.color}15`} />
            <rect x={ent.x} y={ent.y + 28} width={ent.w} height="6" fill={`${ent.color}15`} />
            <text x={ent.x + 14} y={ent.y + 23} fill={ent.color} fontWeight="700" style={{ fontSize: 14 }}>{ent.name}</text>
            {ent.cols.map((col, ci) => {
              const cy = ent.y + 38 + ci * 22;
              const parts = col.split("  ");
              const colName = parts[0];
              const constraint = parts[1] || "";
              const isPK = constraint === "PK";
              const isFK = constraint === "FK";
              return (
                <g key={`${ent.name}-${col}`}>
                  <text x={ent.x + 14} y={cy + 15} fill={isPK ? "#1e293b" : isFK ? ent.color : "#1e293b"} fontWeight={isPK ? "600" : "400"} opacity={isPK || isFK ? 1 : 0.45} style={{ fontSize: 12.5 }}>
                    {colName}
                  </text>
                  {(isPK || isFK) && (
                    <text x={ent.x + ent.w - 14} y={cy + 15} textAnchor="end" fill={isPK ? "#64748b" : `${ent.color}90`} fontWeight="600" style={{ fontSize: 10.5 }}>
                      {isPK ? "PK ⚷" : "FK →"}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
