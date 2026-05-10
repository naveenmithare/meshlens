"use client";

import { useState } from "react";

interface Props {
  products: any[];
  domains: any[];
  consumers: any[];
  lineage: any[];
}

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  SOURCE_ALIGNED: { label: "Source Data Products", color: "#56B265", bg: "#b8e6c8" },
  BUSINESS: { label: "Business Data Products", color: "#FFCE55", bg: "#ffe49a" },
  CONSUMER_ALIGNED: { label: "Consumer Data Products", color: "#FB6E52", bg: "#fdd8d0" },
};

export default function CatalogueClient({ products, domains, consumers, lineage }: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p: any) => {
    if (filter && p.product_type !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    total: products.length,
    source: products.filter((p: any) => p.product_type === "SOURCE_ALIGNED").length,
    business: products.filter((p: any) => p.product_type === "BUSINESS").length,
    consumer: products.filter((p: any) => p.product_type === "CONSUMER_ALIGNED").length,
  };

  return (
    <div className="min-h-screen pt-28 px-8 pb-24">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-14">
          <span className="section-label">Product Catalogue</span>
          <h1 className="heading-display mb-5">Data Products</h1>
          <p className="text-mesh-text-muted leading-[1.9] text-[16px]">
            Browse all {counts.total} data products across the enterprise mesh. Filter by type to find
            source-aligned mirrors, business composites, or consumer-facing products.
          </p>
        </div>

        {/* Stats bar — colored cards */}
        <div className="grid grid-cols-4 gap-5 mb-10">
          {([
            { label: "All Products", count: counts.total, key: null, bg: "#e8e8e2" },
            { label: "Source", count: counts.source, key: "SOURCE_ALIGNED", bg: "#b8e6c8" },
            { label: "Business", count: counts.business, key: "BUSINESS", bg: "#ffe49a" },
            { label: "Consumer", count: counts.consumer, key: "CONSUMER_ALIGNED", bg: "#fdd8d0" },
          ] as const).map((item) => (
            <button key={item.label}
              onClick={() => setFilter(item.key)}
              className={`card-colored text-left cursor-pointer ${
                filter === item.key ? "ring-2 ring-mesh-text/20 ring-offset-2 ring-offset-mesh-bg" : ""
              }`}
              style={{ backgroundColor: item.bg }}>
              <div className="text-3xl font-bold text-mesh-text mb-1">{item.count}</div>
              <div className="text-[14px] font-medium text-mesh-text/60">{item.label}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8">
          <input type="text" placeholder="Search products..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-5 py-3.5 rounded-2xl bg-white text-mesh-text text-[15px]
              focus:outline-none focus:ring-2 focus:ring-mesh-text/10
              placeholder:text-mesh-text-muted/60" />
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p: any) => {
            const meta = TYPE_META[p.product_type] || { label: p.product_type, color: "#92C3A4", bg: "#e8e8e2" };
            return (
              <div key={p.id} className="card-block group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.08em] font-bold px-3 py-1 rounded-full"
                    style={{ color: "#1a1a1a", backgroundColor: meta.bg }}>
                    {meta.label}
                  </span>
                  <span className={`text-[11px] uppercase tracking-[0.08em] font-bold px-2.5 py-1 rounded-lg ${
                    p.tier === "GOLD" ? "text-amber-700 bg-amber-100" : "text-mesh-text-muted bg-mesh-bg"
                  }`}>{p.tier}</span>
                </div>
                <h3 className="text-[16px] font-bold text-mesh-text mb-2 group-hover:text-mesh-accent transition-colors">{p.name}</h3>
                <p className="text-[14px] text-mesh-text-muted leading-[1.7] mb-5 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between text-[13px] text-mesh-text-muted pt-4 border-t border-mesh-bg">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color_hex }} />
                    <span>{p.domain_name}</span>
                  </div>
                  <span className="font-medium">{p.sla_freshness}</span>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-mesh-text-muted">
            No products match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
