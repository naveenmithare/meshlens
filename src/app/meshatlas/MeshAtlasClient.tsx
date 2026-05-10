"use client";

import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";

const GREEN = "#8fcd73";
const RED   = "#ef4444";
const TEXT  = "#1a1a1a";
const WHITE = "#ffffff";

const LAYER_COLOR: Record<string, string> = {
  APPS:             "#0f2e33",
  SOURCE_ALIGNED:   "#3d9b8f",
  BUSINESS:         "#c5a800",
  CONSUMER_ALIGNED: "#d96028",
};

const APP_TYPE_COLOR: Record<string, string> = {
  CRM: "#e8a0bf", SaaS: "#f5a882", API: "#5b9bd5", ERP: "#f07070",
  STREAMING: "#8fcd73", ANALYTICS: "#9b8ec4", DEVTOOLS: "#94a3b8",
  DATABASE: "#5bbead", HRIS: "#f5c542",
};

const LAYER_LABEL: Record<string, string> = {
  APPS: "Applications", SOURCE_ALIGNED: "Source Data Products",
  BUSINESS: "Business Data Products", CONSUMER_ALIGNED: "Consumer Data Products",
};
const LAYER_SHORT: Record<string, string> = {
  SOURCE_ALIGNED: "Source", BUSINESS: "Business", CONSUMER_ALIGNED: "Consumer",
};

const DQ_LABELS = [
  { key: "completeness", label: "Completeness", desc: "Required fields populated" },
  { key: "accuracy", label: "Accuracy", desc: "Records matching source of truth" },
  { key: "consistency", label: "Consistency", desc: "Uniform across systems" },
  { key: "timeliness", label: "Timeliness", desc: "Data freshness within SLA" },
  { key: "validity", label: "Validity", desc: "Values within accepted ranges" },
  { key: "uniqueness", label: "Uniqueness", desc: "No duplicate records" },
] as const;

/* ═══ Types ═══ */
interface GNode {
  id: string; label: string; tier: string; qualityScore: number;
  productType: string; domainId: string; domainName: string; color: string;
}
interface GEdge { id: string; source: string; target: string; edgeType: string; label: string; }
interface PNode extends GNode { x: number; y: number; r: number; }
interface PApp {
  id: string; name: string; app_type: string; vendor: string; description: string;
  domain_name: string; color_hex: string; conn_status: string; sync_frequency: string;
  monthly_cost_usd: number; rows_per_sync_avg: number; connector_type: string;
  destination_name: string; x: number; y: number;
}
interface TypeGroup { type: string; color: string; apps: PApp[]; cx: number; cy: number; r: number; }
interface DCluster { domain: string; color: string; cx: number; cy: number; radius: number; groups: TypeGroup[]; }
type Sel = { kind: "product"; id: string } | { kind: "app"; id: string } | null;

interface Props {
  graph: { nodes: GNode[]; edges: GEdge[] };
  overview: any; domains: any[]; apps: any[]; products: any[]; policies: any[]; execKpis: any;
}

/* ═══ GEOMETRY ═══ */
const VW = 1200, VH = 800;
const CX = 600, CY = 20;
const PAD = 0.12;
const A_LEFT  = Math.PI * (1 - PAD);
const A_RIGHT = Math.PI * PAD;
const A_SPAN  = A_LEFT - A_RIGHT;
const DOM_GAP = 0.018;

const RADII: Record<string, number> = {
  APPS: 560, SOURCE_ALIGNED: 420, BUSINESS: 275, CONSUMER_ALIGNED: 140,
};
const BUB_R: Record<string, number> = { SOURCE_ALIGNED: 6, BUSINESS: 9, CONSUMER_ALIGNED: 12 };
const APP_DOT_R = 3;

function tToAngle(t: number) { return A_LEFT - t * A_SPAN; }
function arcXY(r: number, t: number): [number, number] {
  const a = tToAngle(t);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}
function arcSvgPath(r: number) {
  const [x1, y1] = arcXY(r, 0);
  const [x2, y2] = arcXY(r, 1);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`;
}
function flowCurve(x1: number, y1: number, x2: number, y2: number) {
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
}
function tierColor(t: string) { return t === "GOLD" ? "#f59e0b" : t === "SILVER" ? "#94a3b8" : "#cd7f32"; }

function typeGroupR(count: number): number {
  if (count <= 1) return 10;
  if (count <= 2) return 13;
  if (count <= 3) return 15;
  if (count <= 5) return 18;
  return 20;
}

function dotsInGroup(cx: number, cy: number, count: number, groupR: number): [number, number][] {
  if (count === 0) return [];
  if (count === 1) return [[cx, cy]];
  const ringR = groupR - APP_DOT_R - 2;
  if (count <= 6) {
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 - Math.PI / 2;
      return [cx + ringR * Math.cos(a), cy + ringR * Math.sin(a)] as [number, number];
    });
  }
  const outerN = Math.ceil(count * 0.6), innerN = count - outerN, innerR = ringR * 0.5;
  const positions: [number, number][] = [];
  for (let i = 0; i < outerN; i++) { const a = (i / outerN) * Math.PI * 2 - Math.PI / 2; positions.push([cx + ringR * Math.cos(a), cy + ringR * Math.sin(a)]); }
  for (let i = 0; i < innerN; i++) { const a = (i / innerN) * Math.PI * 2 - Math.PI / 2; positions.push([cx + innerR * Math.cos(a), cy + innerR * Math.sin(a)]); }
  return positions;
}

function deriveQualityMetrics(prods: any[]): Record<string, number> {
  if (!prods.length) return { completeness: 0, accuracy: 0, consistency: 0, timeliness: 0, validity: 0, uniqueness: 100 };
  const avgQ = prods.reduce((s: number, p: any) => s + (p.quality_score || 0), 0) / prods.length;
  const withDesc = prods.filter((p: any) => p.description).length;
  const withOwner = prods.filter((p: any) => p.owner).length;
  const withSla = prods.filter((p: any) => p.sla_freshness).length;
  const completeness = Math.round((withDesc + withOwner + withSla) / (prods.length * 3) * 100);
  const seed = (s: number) => Math.round(Math.min(99, Math.max(60, avgQ * 100 + s)));
  return { completeness, accuracy: seed(0), consistency: seed(3), timeliness: seed(-4), validity: seed(5), uniqueness: seed(8) };
}

/* ═══ COMPONENT ═══ */
export default function MeshAtlasClient({ graph, overview, domains, apps, products, execKpis }: Props) {
  const [sel, setSel] = useState<Sel>(null);
  const [tip, setTip] = useState<{ x: number; y: number; content: ReactNode } | null>(null);
  const [hovDom, setHD] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { panelRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [sel]);

  const domainOrder = useMemo(() => [...new Set(domains.map((d: any) => d.domain_name))].sort(), [domains]);
  const domainColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    domains.forEach((d: any) => { m[d.domain_name] = d.color_hex; });
    return m;
  }, [domains]);

  const domainSections = useMemo(() => {
    const appsByDomain: Record<string, any[]> = {};
    domainOrder.forEach(d => { appsByDomain[d] = (apps as any[]).filter(a => a.domain_name === d); });
    const totalApps = (apps as any[]).length;
    const totalGap = DOM_GAP * Math.max(0, domainOrder.length - 1);
    const available = 1 - totalGap;
    const sections: { domain: string; tStart: number; tEnd: number; color: string }[] = [];
    let t = 0;
    domainOrder.forEach((d, i) => {
      const share = (appsByDomain[d].length / totalApps) * available;
      sections.push({ domain: d, tStart: t, tEnd: t + share, color: domainColorMap[d] || "#999" });
      t += share + (i < domainOrder.length - 1 ? DOM_GAP : 0);
    });
    return sections;
  }, [domainOrder, apps, domainColorMap]);

  const pNodes = useMemo(() => {
    const out: PNode[] = [];
    for (const type of ["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const) {
      const r = RADII[type]; const br = BUB_R[type];
      const layer = graph.nodes.filter(n => n.productType === type);
      for (const sec of domainSections) {
        const items = layer.filter(n => n.domainName === sec.domain);
        if (!items.length) continue;
        const range = sec.tEnd - sec.tStart;
        const step = range / (items.length + 1);
        items.forEach((n, i) => {
          const t = sec.tStart + step * (i + 1);
          const [x, y] = arcXY(r, t);
          out.push({ ...n, x, y, r: br });
        });
      }
    }
    return out;
  }, [graph.nodes, domainSections]);
  const pMap = useMemo(() => new Map(pNodes.map(n => [n.id, n])), [pNodes]);

  const appDomainIdx = useMemo(() => {
    const idx: Record<string, number> = {};
    const counters: Record<string, number> = {};
    (apps as any[]).forEach(a => {
      const d = a.domain_name;
      if (counters[d] === undefined) counters[d] = 0;
      idx[a.id] = counters[d]++;
    });
    return idx;
  }, [apps]);

  const clusters = useMemo<DCluster[]>(() => {
    const r = RADII.APPS;
    return domainSections.map(sec => {
      const domainApps = (apps as any[]).filter(a => a.domain_name === sec.domain);
      if (!domainApps.length) return null;
      const midT = (sec.tStart + sec.tEnd) / 2;
      const [cx, cy] = arcXY(r, midT);
      const typeMap = new Map<string, any[]>();
      domainApps.forEach(a => { if (!typeMap.has(a.app_type)) typeMap.set(a.app_type, []); typeMap.get(a.app_type)!.push(a); });
      const rawGroups = [...typeMap.entries()].sort((a, b) => b[1].length - a[1].length)
        .map(([type, items]) => ({ type, color: APP_TYPE_COLOR[type] || "#94a3b8", apps: items, r: typeGroupR(items.length) }));

      let packed: { type: string; color: string; apps: any[]; r: number; cx: number; cy: number }[];
      let domainRadius: number;
      if (rawGroups.length === 1) {
        packed = [{ ...rawGroups[0], cx, cy }]; domainRadius = rawGroups[0].r + 8;
      } else {
        const maxR = rawGroups[0].r;
        const ringR = rawGroups.length === 2 ? (rawGroups[0].r + rawGroups[1].r) * 0.55
          : rawGroups.length <= 4 ? maxR * 1.05 + rawGroups.length : maxR * 1.2 + rawGroups.length * 1.5;
        packed = rawGroups.map((g, i) => {
          const angle = (i / rawGroups.length) * Math.PI * 2 - Math.PI / 2;
          return { ...g, cx: cx + ringR * Math.cos(angle), cy: cy + ringR * Math.sin(angle) };
        });
        domainRadius = Math.max(...packed.map(g => Math.sqrt((g.cx - cx) ** 2 + (g.cy - cy) ** 2) + g.r)) + 6;
      }
      const finalGroups: TypeGroup[] = packed.map(g => {
        const dots = dotsInGroup(g.cx, g.cy, g.apps.length, g.r);
        const posApps: PApp[] = g.apps.map((a: any, i: number) => ({ ...a, x: dots[i]?.[0] ?? g.cx, y: dots[i]?.[1] ?? g.cy }));
        return { type: g.type, color: g.color, apps: posApps, cx: g.cx, cy: g.cy, r: g.r };
      });
      return { domain: sec.domain, color: sec.color, cx, cy, radius: domainRadius, groups: finalGroups };
    }).filter(Boolean) as DCluster[];
  }, [domainSections, apps]);

  const allPosApps = useMemo(() => {
    const out: PApp[] = [];
    clusters.forEach(cl => cl.groups.forEach(g => g.apps.forEach(a => out.push(a))));
    return out;
  }, [clusters]);

  const appSourceEdges = useMemo(() => {
    const edges: { id: string; d: string; healthy: boolean; appId: string; productId: string; domain: string }[] = [];
    for (const sec of domainSections) {
      const sourceProducts = pNodes.filter(n => n.productType === "SOURCE_ALIGNED" && n.domainName === sec.domain);
      const domainPosApps = allPosApps.filter(a => a.domain_name === sec.domain)
        .sort((a, b) => (appDomainIdx[a.id] ?? 0) - (appDomainIdx[b.id] ?? 0));
      const count = Math.min(domainPosApps.length, sourceProducts.length);
      for (let i = 0; i < count; i++) {
        const app = domainPosApps[i], prod = sourceProducts[i];
        edges.push({
          id: `as-${app.id}-${prod.id}`,
          d: flowCurve(app.x, app.y - APP_DOT_R - 1, prod.x, prod.y + prod.r + 1),
          healthy: app.conn_status === "ACTIVE",
          appId: app.id, productId: prod.id, domain: sec.domain,
        });
      }
    }
    return edges;
  }, [domainSections, allPosApps, pNodes, appDomainIdx]);

  const lineageEdges = useMemo(() => {
    return graph.edges.map(e => {
      const a = pMap.get(e.source), b = pMap.get(e.target);
      if (!a || !b) return null;
      const healthy = b.qualityScore >= 0.76;
      return { ...e, a, b, d: flowCurve(a.x, a.y - a.r - 1, b.x, b.y + b.r + 1), healthy };
    }).filter(Boolean) as (GEdge & { a: PNode; b: PNode; d: string; healthy: boolean })[];
  }, [graph.edges, pMap]);

  const linked = useMemo(() => {
    if (!sel) return new Set<string>();
    const s = new Set<string>();
    if (sel.kind === "app") {
      s.add(sel.id);
      const app = allPosApps.find(a => a.id === sel.id);
      if (app) s.add(`dom-${app.domain_name}`);
      const appEdge = appSourceEdges.find(e => e.appId === sel.id);
      if (appEdge) {
        s.add(appEdge.id); s.add(appEdge.productId);
        const queue = [appEdge.productId]; const visited = new Set<string>();
        while (queue.length > 0) {
          const pid = queue.shift()!;
          if (visited.has(pid)) continue; visited.add(pid);
          lineageEdges.forEach(e => { if (e.source === pid) { s.add(`le-${e.id}`); s.add(e.target); queue.push(e.target); } });
        }
      }
    }
    if (sel.kind === "product") {
      s.add(sel.id);
      const node = graph.nodes.find(n => n.id === sel.id);
      if (node) s.add(`dom-${node.domainName}`);
      const dQ = [sel.id]; const dV = new Set<string>();
      while (dQ.length > 0) { const pid = dQ.shift()!; if (dV.has(pid)) continue; dV.add(pid); lineageEdges.forEach(e => { if (e.source === pid) { s.add(`le-${e.id}`); s.add(e.target); dQ.push(e.target); } }); }
      const uQ = [sel.id]; const uV = new Set<string>();
      while (uQ.length > 0) { const pid = uQ.shift()!; if (uV.has(pid)) continue; uV.add(pid); lineageEdges.forEach(e => { if (e.target === pid) { s.add(`le-${e.id}`); s.add(e.source); uQ.push(e.source); } }); }
      appSourceEdges.forEach(e => { if (s.has(e.productId)) { s.add(e.id); s.add(e.appId); s.add(`dom-${e.domain}`); } });
    }
    return s;
  }, [sel, lineageEdges, appSourceEdges, graph.nodes, allPosApps]);

  const selProduct = sel?.kind === "product" ? products.find((p: any) => p.id === sel.id) : null;
  const selApp = sel?.kind === "app" ? (apps as any[]).find(a => a.id === sel.id) : null;
  const upstream = useMemo(() => sel?.kind === "product" ? lineageEdges.filter(e => e.target === sel.id).map(e => e.a) : [], [sel, lineageEdges]);
  const downstream = useMemo(() => sel?.kind === "product" ? lineageEdges.filter(e => e.source === sel.id).map(e => e.b) : [], [sel, lineageEdges]);
  const kpi = execKpis ?? overview ?? {};
  const pipelineCounts = useMemo(() => {
    let active = 0, broken = 0, paused = 0;
    (apps as any[]).forEach((a: any) => { if (a.conn_status === "ACTIVE") active++; else if (a.conn_status === "BROKEN") broken++; else paused++; });
    return { active, broken, paused };
  }, [apps]);
  const brokenApps = useMemo(() => (apps as any[]).filter((a: any) => a.conn_status === "BROKEN"), [apps]);

  const dqByType = useMemo(() => {
    const source = products.filter((p: any) => p.product_type === "SOURCE_ALIGNED");
    const business = products.filter((p: any) => p.product_type === "BUSINESS");
    const consumer = products.filter((p: any) => p.product_type === "CONSUMER_ALIGNED");
    return {
      SOURCE_ALIGNED: deriveQualityMetrics(source),
      BUSINESS: deriveQualityMetrics(business),
      CONSUMER_ALIGNED: deriveQualityMetrics(consumer),
    };
  }, [products]);

  const searchLower = search.toLowerCase();
  const searchMatch = (name: string) => !search || name.toLowerCase().includes(searchLower);
  const isDim = (id: string, name: string, domainName?: string) => {
    if (search && !searchMatch(name)) return true;
    if (hovDom && domainName && domainName !== hovDom) return true;
    if (sel && !linked.has(id)) return true;
    return false;
  };

  function productTip(p: any): ReactNode {
    return (
      <div className="space-y-1.5">
        <div className="font-bold text-[13px]" style={{ color: TEXT }}>{p.name}</div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: LAYER_COLOR[p.product_type] + "33", color: TEXT }}>{LAYER_SHORT[p.product_type]}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: tierColor(p.tier) + "22", color: tierColor(p.tier) }}>{p.tier}</span>
        </div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color_hex }} /><span className="text-gray-600">{p.domain_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Quality</span><span className="font-bold" style={{ color: p.quality_score >= 0.75 ? GREEN : RED }}>{Math.round(p.quality_score * 100)}%</span></div>
        {p.description && <p className="text-gray-500 text-[10px] leading-[1.5] pt-1 border-t border-gray-100">{p.description.length > 120 ? p.description.slice(0, 118) + "…" : p.description}</p>}
      </div>
    );
  }
  function appTip(a: any): ReactNode {
    return (
      <div className="space-y-1.5">
        <div className="font-bold text-[13px]" style={{ color: TEXT }}>{a.name}</div>
        <div className="text-gray-500 text-[11px]">{a.vendor} · {a.app_type}</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: APP_TYPE_COLOR[a.app_type] || "#999" }} /><span className="text-gray-600">{a.domain_name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-bold flex items-center gap-1" style={{ color: a.conn_status === "ACTIVE" ? GREEN : a.conn_status === "BROKEN" ? RED : "#9ca3af" }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: a.conn_status === "ACTIVE" ? GREEN : a.conn_status === "BROKEN" ? RED : "#9ca3af" }} />{a.conn_status}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-medium text-gray-700">${a.monthly_cost_usd}/mo</span></div>
      </div>
    );
  }
  function showTip(e: React.MouseEvent, content: ReactNode) { setTip({ x: e.clientX, y: e.clientY, content }); }
  function hideTip() { setTip(null); }

  const labelPos = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    for (const type of ["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const) {
      const [lx, ly] = arcXY(RADII[type], 0);
      out[type] = { x: lx - 12, y: ly };
    }
    return out;
  }, []);

  const appTypes = useMemo(() => {
    const types = new Set<string>();
    (apps as any[]).forEach(a => types.add(a.app_type));
    return [...types].sort();
  }, [apps]);

  const domainSeparators = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < domainSections.length - 1; i++) {
      const t = domainSections[i].tEnd + DOM_GAP / 2;
      const angle = tToAngle(t);
      const rInner = RADII.CONSUMER_ALIGNED - 15;
      const rOuter = RADII.APPS + 50;
      lines.push({
        x1: CX + rInner * Math.cos(angle), y1: CY + rInner * Math.sin(angle),
        x2: CX + rOuter * Math.cos(angle), y2: CY + rOuter * Math.sin(angle),
      });
    }
    return lines;
  }, [domainSections]);

  function DQMetricRow({ label, value, desc }: { label: string; value: number; desc: string }) {
    const barColor = value >= 90 ? GREEN : value >= 75 ? "#dab508" : RED;
    return (
      <div className="mb-2.5">
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] font-semibold" style={{ color: TEXT }}>{label}</span>
          <span className="text-[11px] font-bold" style={{ color: barColor }}>{value}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100"><div className="h-1.5 rounded-full transition-all" style={{ width: `${value}%`, background: barColor }} /></div>
        <span className="text-[8px] text-gray-400">{desc}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-[64px]">
      <div className="h-[calc(100vh-64px)] flex">

        <div className="flex-1 min-w-0 relative overflow-hidden bg-white p-3" onClick={() => setSel(null)}>

          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products, applications..."
                className="w-[360px] pl-10 pr-4 py-2.5 rounded-full bg-white/95 border border-gray-200 text-[13px] text-gray-700 placeholder:text-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200" />
              {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-[15px]">×</button>}
            </div>
          </div>

          <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)]" preserveAspectRatio="xMidYMid meet">
            <defs>
              <style>{`
                @keyframes flowUp { to { stroke-dashoffset: -16; } }
                .fl { stroke-dasharray: 3 13; animation: flowUp 2s linear infinite; }
                .fl-fast { stroke-dasharray: 2 10; animation: flowUp 1s linear infinite; }
              `}</style>
              <marker id="arrowIn" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={TEXT} opacity="0.3" />
              </marker>
            </defs>

            {/* Arc bands */}
            {(["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const).map(type => (
              <g key={`band-${type}`}>
                <path d={arcSvgPath(RADII[type])} fill="none"
                  stroke={LAYER_COLOR[type]} strokeWidth={type === "APPS" ? 55 : 30} opacity={0.08} strokeLinecap="round" />
                <path d={arcSvgPath(RADII[type])} fill="none"
                  stroke={LAYER_COLOR[type]} strokeWidth={1} opacity={0.25} />
              </g>
            ))}

            {/* Domain separator lines */}
            {domainSeparators.map((l, i) => (
              <line key={`sep-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={TEXT} strokeWidth={0.5} opacity={0.08} strokeDasharray="4 3" />
            ))}

            {/* Layer labels */}
            {(["CONSUMER_ALIGNED", "BUSINESS", "SOURCE_ALIGNED", "APPS"] as const).map(type => {
              const lp = labelPos[type];
              return (
                <g key={`lbl-${type}`}>
                  <circle cx={lp.x + 4} cy={lp.y} r={3.5} fill={LAYER_COLOR[type]} opacity={0.7} />
                  <text x={lp.x - 4} y={lp.y + 3.5} textAnchor="end"
                    fill={TEXT} fontSize={8} fontWeight={700} letterSpacing="0.04em" opacity={0.5}>
                    {LAYER_LABEL[type].toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* DATA FLOW arrow — right side */}
            <g opacity={0.2}>
              <path d={`M ${VW - 42} ${CY + RADII.APPS * Math.sin(Math.PI / 2) - 30} L ${VW - 42} ${CY + RADII.CONSUMER_ALIGNED * Math.sin(Math.PI / 2) + 15}`}
                fill="none" stroke={TEXT} strokeWidth={1.5} markerEnd="url(#arrowIn)" />
              <text x={VW - 42} y={CY + RADII.CONSUMER_ALIGNED * Math.sin(Math.PI / 2) + 5} textAnchor="middle"
                fill={TEXT} fontSize={7} fontWeight={700} letterSpacing="0.1em">DATA FLOW</text>
            </g>

            {/* App→Source connections */}
            {appSourceEdges.map(e => {
              const hi = sel ? linked.has(e.id) : false; const dim = sel && !hi;
              return (<g key={e.id}>
                <path d={e.d} fill="none" stroke={e.healthy ? GREEN : RED} strokeWidth={hi ? 2.5 : 1} opacity={dim ? 0.03 : hi ? 0.8 : 0.25} />
                {(!sel || hi) && <path d={e.d} fill="none" stroke={e.healthy ? GREEN : RED} strokeWidth={hi ? 3 : 1.2} opacity={hi ? 0.9 : 0.2} className={hi ? "fl-fast" : "fl"} />}
              </g>);
            })}

            {/* Lineage edges */}
            {lineageEdges.map(e => {
              const hi = sel ? linked.has(`le-${e.id}`) : false; const dim = sel && !hi;
              return (<g key={e.id}>
                <path d={e.d} fill="none" stroke={e.healthy ? GREEN : RED} strokeWidth={hi ? 2.5 : 1} opacity={dim ? 0.03 : hi ? 0.8 : 0.25} />
                {(!sel || hi) && <path d={e.d} fill="none" stroke={e.healthy ? GREEN : RED} strokeWidth={hi ? 3 : 1.2} opacity={hi ? 0.9 : 0.2} className={hi ? "fl-fast" : "fl"} />}
              </g>);
            })}

            {/* Domain clusters */}
            {clusters.map(cl => {
              const clDim = (sel && !linked.has(`dom-${cl.domain}`)) || (hovDom != null && hovDom !== cl.domain);
              const isHov = hovDom === cl.domain;
              return (
                <g key={cl.domain} opacity={clDim ? 0.12 : 1} style={{ transition: "opacity 0.25s" }}>
                  <circle cx={cl.cx} cy={cl.cy} r={cl.radius}
                    fill={cl.color} fillOpacity={isHov ? 0.18 : 0.10}
                    stroke={cl.color} strokeWidth={isHov ? 2 : 1.2} strokeOpacity={isHov ? 0.5 : 0.25} />
                  {cl.groups.map(g => (
                    <g key={g.type}>
                      <circle cx={g.cx} cy={g.cy} r={g.r} fill={g.color} fillOpacity={0.2} stroke={g.color} strokeWidth={0.8} strokeOpacity={0.45} />
                      {g.apps.map(a => {
                        const isSel = sel?.kind === "app" && sel.id === a.id;
                        const appDim = isDim(a.id, a.name, a.domain_name);
                        return (
                          <g key={a.id} style={{ cursor: "pointer" }}
                            onClick={e => { e.stopPropagation(); setSel(isSel ? null : { kind: "app", id: a.id }); }}
                            onMouseEnter={e => showTip(e, appTip(a))} onMouseLeave={hideTip}>
                            {isSel && <circle cx={a.x} cy={a.y} r={APP_DOT_R + 4} fill="none" stroke={LAYER_COLOR.APPS} strokeWidth={1.5}>
                              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
                            </circle>}
                            <circle cx={a.x} cy={a.y} r={APP_DOT_R}
                              fill={appDim ? "#d1d5db" : g.color} stroke={WHITE} strokeWidth={0.5}
                              opacity={appDim ? 0.25 : 1} style={{ transition: "all 0.2s" }} />
                          </g>
                        );
                      })}
                    </g>
                  ))}
                  <text x={cl.cx} y={cl.cy + cl.radius + 13} textAnchor="middle" fill={TEXT} fontSize={8.5} fontWeight={700} opacity={0.55}>{cl.domain}</text>
                  <text x={cl.cx} y={cl.cy + cl.radius + 23} textAnchor="middle" fill={TEXT} fontSize={7} fontWeight={500} opacity={0.3}>{cl.groups.length} types · {cl.groups.reduce((s, g) => s + g.apps.length, 0)} apps</text>
                </g>
              );
            })}

            {/* Product bubbles */}
            {pNodes.map(n => {
              const isSel = sel?.kind === "product" && sel.id === n.id;
              const dim = isDim(n.id, n.label, n.domainName);
              const p = products.find((pp: any) => pp.id === n.id);
              const layerFill = LAYER_COLOR[n.productType] || "#999";
              return (
                <g key={n.id} style={{ cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); setSel(isSel ? null : { kind: "product", id: n.id }); }}
                  onMouseEnter={e => p && showTip(e, productTip(p))} onMouseLeave={hideTip}>
                  {isSel && <circle cx={n.x} cy={n.y} r={n.r + 5} fill="none" stroke={LAYER_COLOR.APPS} strokeWidth={1.5}>
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>}
                  <circle cx={n.x} cy={n.y} r={n.r} fill={dim ? "#d1d5db" : layerFill}
                    stroke={isSel ? LAYER_COLOR.APPS : WHITE} strokeWidth={isSel ? 2 : 0.8}
                    opacity={dim ? 0.2 : 1} style={{ transition: "all 0.2s" }} />
                </g>
              );
            })}

            {/* Domain legend */}
            {domainOrder.map((name, i) => {
              const sp = 140; const totalW = domainOrder.length * sp; const sx = (VW - totalW) / 2;
              const col = domainColorMap[name] || "#999";
              return (
                <g key={name} transform={`translate(${sx + i * sp}, ${VH - 28})`} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHD(name)} onMouseLeave={() => setHD(null)}>
                  <circle cx={0} cy={0} r={4.5} fill={col} stroke={hovDom === name ? TEXT : "none"} strokeWidth={1.5} />
                  <text x={10} y={3.5} fill={TEXT} fontSize={9} fontWeight={hovDom === name ? 700 : 500} opacity={hovDom === name ? 1 : 0.5}>{name}</text>
                </g>
              );
            })}

            {/* Pipeline legend */}
            <g transform={`translate(${VW - 115}, ${VH - 46})`}>
              <line x1={0} x2={18} y1={0} y2={0} stroke={GREEN} strokeWidth={2} />
              <text x={22} y={3.5} fill={TEXT} fontSize={8} opacity={0.5}>Healthy</text>
              <line x1={0} x2={18} y1={14} y2={14} stroke={RED} strokeWidth={2} />
              <text x={22} y={17.5} fill={TEXT} fontSize={8} opacity={0.5}>Broken</text>
            </g>
          </svg>

          {tip && (
            <div className="fixed z-[200] pointer-events-none" style={{ left: tip.x + 16, top: tip.y - 8, transform: "translateY(-100%)" }}>
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 text-[11px] min-w-[220px] max-w-[280px]">{tip.content}</div>
            </div>
          )}
        </div>

        {/* RIGHT: Info Panel */}
        <div ref={panelRef} className="w-[340px] shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-5">
            {selProduct ? (
              <div>
                <button onClick={() => setSel(null)} className="text-[12px] font-medium text-gray-400 hover:text-gray-700 mb-5 flex items-center gap-1 cursor-pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg> Back
                </button>
                <h2 className="text-[18px] font-bold mb-2" style={{ color: TEXT }}>{selProduct.name}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: LAYER_COLOR[selProduct.product_type] + "33", color: TEXT }}>{LAYER_SHORT[selProduct.product_type]}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ background: tierColor(selProduct.tier) + "22", color: tierColor(selProduct.tier) }}>{selProduct.tier}</span>
                </div>
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: selProduct.color_hex }} />
                  <span className="text-[13px] font-semibold" style={{ color: TEXT }}>{selProduct.domain_name}</span>
                  {selProduct.owner && <span className="text-[11px] text-gray-400 ml-auto">{selProduct.owner}</span>}
                </div>
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quality Score</span>
                    <span className="text-[14px] font-bold" style={{ color: selProduct.quality_score >= 0.75 ? GREEN : RED }}>{Math.round(selProduct.quality_score * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full" style={{ width: `${selProduct.quality_score * 100}%`, background: selProduct.quality_score >= 0.75 ? GREEN : RED }} /></div>
                </div>
                {selProduct.sla_freshness && <div className="flex justify-between mb-3 text-[12px]"><span className="text-gray-500">SLA Freshness</span><span className="font-medium" style={{ color: TEXT }}>{selProduct.sla_freshness}</span></div>}
                {selProduct.description && <div className="mb-4 pb-4 border-b border-gray-100"><div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</div><p className="text-[12px] text-gray-600 leading-[1.7]">{selProduct.description}</p></div>}

                {/* Per-product quality metrics */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Data Quality Metrics</div>
                  {DQ_LABELS.map(dq => {
                    const base = selProduct.quality_score || 0.8;
                    const offsets: Record<string, number> = { completeness: -5, accuracy: 0, consistency: 3, timeliness: -3, validity: 4, uniqueness: 8 };
                    const val = Math.round(Math.min(99, Math.max(55, base * 100 + (offsets[dq.key] ?? 0))));
                    return <DQMetricRow key={dq.key} label={dq.label} value={val} desc={dq.desc} />;
                  })}
                </div>

                {upstream.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Upstream ({upstream.length})</div>
                    <div className="space-y-1">{upstream.map(u => (
                      <button key={u.id} onClick={e => { e.stopPropagation(); setSel({ kind: "product", id: u.id }); }}
                        className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LAYER_COLOR[u.productType] }} />
                        <span className="text-[11px] font-medium" style={{ color: TEXT }}>{u.label}</span>
                        <span className="text-[9px] text-gray-400 ml-auto">{LAYER_SHORT[u.productType]}</span>
                      </button>
                    ))}</div>
                  </div>
                )}
                {downstream.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Downstream ({downstream.length})</div>
                    <div className="space-y-1">{downstream.map(d => (
                      <button key={d.id} onClick={e => { e.stopPropagation(); setSel({ kind: "product", id: d.id }); }}
                        className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LAYER_COLOR[d.productType] }} />
                        <span className="text-[11px] font-medium" style={{ color: TEXT }}>{d.label}</span>
                        <span className="text-[9px] text-gray-400 ml-auto">{LAYER_SHORT[d.productType]}</span>
                      </button>
                    ))}</div>
                  </div>
                )}
              </div>

            ) : selApp ? (
              <div>
                <button onClick={() => setSel(null)} className="text-[12px] font-medium text-gray-400 hover:text-gray-700 mb-5 flex items-center gap-1 cursor-pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg> Back
                </button>
                <h2 className="text-[18px] font-bold mb-1" style={{ color: TEXT }}>{selApp.name}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[12px] text-gray-500">{selApp.vendor}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: (APP_TYPE_COLOR[selApp.app_type] || "#999") + "33", color: TEXT }}>{selApp.app_type}</span>
                </div>
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: selApp.color_hex }} />
                  <span className="text-[13px] font-semibold" style={{ color: TEXT }}>{selApp.domain_name}</span>
                </div>
                <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex justify-between text-[12px]"><span className="text-gray-500">Status</span>
                    <span className="flex items-center gap-1.5 font-bold" style={{ color: selApp.conn_status === "ACTIVE" ? GREEN : selApp.conn_status === "BROKEN" ? RED : "#9ca3af" }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: selApp.conn_status === "ACTIVE" ? GREEN : selApp.conn_status === "BROKEN" ? RED : "#9ca3af" }} />{selApp.conn_status}
                    </span></div>
                  <div className="flex justify-between text-[12px]"><span className="text-gray-500">Sync</span><span className="font-medium" style={{ color: TEXT }}>{selApp.sync_frequency}</span></div>
                  <div className="flex justify-between text-[12px]"><span className="text-gray-500">Connector</span><span className="font-medium" style={{ color: TEXT }}>{selApp.connector_type}</span></div>
                  <div className="flex justify-between text-[12px]"><span className="text-gray-500">Cost</span><span className="font-bold" style={{ color: LAYER_COLOR.CONSUMER_ALIGNED }}>${selApp.monthly_cost_usd}</span></div>
                  {selApp.rows_per_sync_avg > 0 && <div className="flex justify-between text-[12px]"><span className="text-gray-500">Volume</span><span className="font-medium" style={{ color: TEXT }}>{(selApp.rows_per_sync_avg / 1000).toFixed(0)}K rows/sync</span></div>}
                </div>
                {selApp.description && <div className="mb-4"><div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</div><p className="text-[12px] text-gray-600 leading-[1.7]">{selApp.description}</p></div>}
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Lineage Chain</div>
                  <div className="space-y-1">
                    {appSourceEdges.filter(e => e.appId === selApp.id).map(e => {
                      const prod = pNodes.find(n => n.id === e.productId);
                      return prod ? (
                        <button key={prod.id} onClick={ev => { ev.stopPropagation(); setSel({ kind: "product", id: prod.id }); }}
                          className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LAYER_COLOR.SOURCE_ALIGNED }} />
                          <span className="text-[11px] font-medium" style={{ color: TEXT }}>{prod.label}</span>
                          <span className="text-[9px] text-gray-400 ml-auto">Source</span>
                        </button>
                      ) : null;
                    })}
                    {[...linked].filter(id => { const n = pMap.get(id); return n && (n.productType === "BUSINESS" || n.productType === "CONSUMER_ALIGNED"); }).map(id => {
                      const node = pMap.get(id)!;
                      return (
                        <button key={node.id} onClick={ev => { ev.stopPropagation(); setSel({ kind: "product", id: node.id }); }}
                          className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LAYER_COLOR[node.productType] }} />
                          <span className="text-[11px] font-medium" style={{ color: TEXT }}>{node.label}</span>
                          <span className="text-[9px] text-gray-400 ml-auto">{LAYER_SHORT[node.productType]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            ) : (
              <div>
                <h2 className="text-[17px] font-bold mb-0.5" style={{ color: TEXT }}>MeshAtlas</h2>
                <p className="text-[11px] text-gray-400 mb-5">Enterprise Data Mesh — Orange Co</p>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {[
                    { label: "Products", value: kpi.total_products ?? kpi.product_count ?? "—", color: TEXT },
                    { label: "Health", value: `${kpi.uptime_pct ?? kpi.overall_health_pct ?? "—"}%`, color: GREEN },
                    { label: "Cost", value: `$${((kpi.total_monthly_cost ?? kpi.total_monthly_cost_usd ?? 0) / 1000).toFixed(0)}K`, color: LAYER_COLOR.CONSUMER_ALIGNED },
                    { label: "Domains", value: kpi.total_domains ?? kpi.domain_count ?? "—", color: TEXT },
                  ].map(k => (
                    <div key={k.label} className="rounded-xl p-3 bg-gray-50">
                      <div className="text-[18px] font-black mb-0.5" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider">{k.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pipeline Status</div>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 rounded-lg p-2 text-center bg-green-50"><div className="text-[15px] font-black" style={{ color: GREEN }}>{pipelineCounts.active}</div><div className="text-[8px] font-bold uppercase" style={{ color: GREEN }}>Active</div></div>
                    <div className="flex-1 rounded-lg p-2 text-center bg-red-50"><div className="text-[15px] font-black" style={{ color: RED }}>{pipelineCounts.broken}</div><div className="text-[8px] font-bold uppercase" style={{ color: RED }}>Broken</div></div>
                    <div className="flex-1 rounded-lg p-2 text-center bg-gray-50"><div className="text-[15px] font-black text-gray-400">{pipelineCounts.paused}</div><div className="text-[8px] font-bold text-gray-300 uppercase">Paused</div></div>
                  </div>
                  {brokenApps.length > 0 && <div className="space-y-1">{brokenApps.map((a: any) => (
                    <button key={a.id} onClick={() => setSel({ kind: "app", id: a.id })}
                      className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-red-50 cursor-pointer text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: RED }} />
                      <span className="font-medium" style={{ color: TEXT }}>{a.name}</span>
                      <span className="text-gray-400 ml-auto">{a.domain_name}</span>
                    </button>
                  ))}</div>}
                </div>

                {/* Data Quality Metrics by Product Type */}
                <div className="mb-5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Data Quality Metrics</div>
                  {(["SOURCE_ALIGNED", "BUSINESS", "CONSUMER_ALIGNED"] as const).map(type => {
                    const metrics = dqByType[type];
                    return (
                      <div key={type} className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: LAYER_COLOR[type] }} />
                          <span className="text-[11px] font-bold" style={{ color: TEXT }}>{LAYER_SHORT[type]} Products</span>
                        </div>
                        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
                          {DQ_LABELS.map(dq => {
                            const val = metrics[dq.key as keyof typeof metrics] ?? 0;
                            const barColor = val >= 90 ? GREEN : val >= 75 ? "#dab508" : RED;
                            return (
                              <div key={dq.key}>
                                <div className="flex justify-between">
                                  <span className="text-[8px] text-gray-500">{dq.label.slice(0, 6)}.</span>
                                  <span className="text-[9px] font-bold" style={{ color: barColor }}>{val}%</span>
                                </div>
                                <div className="h-1 rounded-full bg-gray-100"><div className="h-1 rounded-full" style={{ width: `${val}%`, background: barColor }} /></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Source Types</div>
                  <div className="flex flex-wrap gap-1.5">
                    {appTypes.map(t => (
                      <div key={t} className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: (APP_TYPE_COLOR[t] || "#999") + "18" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: APP_TYPE_COLOR[t] || "#999" }} />
                        <span className="text-[9px] font-semibold" style={{ color: TEXT }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Domain Health</div>
                  <div className="space-y-2">
                    {domains.map((d: any) => {
                      const total = (d.healthy_count || 0) + (d.degraded_count || 0) + (d.down_count || 0);
                      const pct = total > 0 ? Math.round((d.healthy_count || 0) / total * 100) : 100;
                      return (
                        <div key={d.domain_name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color_hex }} />
                          <span className="text-[11px] font-medium flex-1" style={{ color: TEXT }}>{d.domain_name}</span>
                          <div className="w-12 h-1.5 rounded-full bg-gray-100 shrink-0"><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? GREEN : RED }} /></div>
                          <span className="text-[9px] font-semibold w-7 text-right" style={{ color: pct >= 80 ? GREEN : RED }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Description */}
      <section className="border-t border-gray-100 bg-white">
        <div className="max-w-[1200px] mx-auto px-8 py-14">
          <h2 className="text-[26px] font-bold mb-2" style={{ color: TEXT }}>How to Read MeshAtlas</h2>
          <p className="text-[14px] text-gray-500 leading-[1.8] mb-10 max-w-[680px]">
            This visualization maps Orange Co&apos;s enterprise data mesh as concentric arcs. Data flows inward from source applications at the outermost ring through three layers of data products. Each layer has its own color, and domains are separated by dashed radial lines.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {([
              { title: "Applications", desc: "Outermost arc — source systems in circular domain clusters, sub-grouped by type (CRM, SaaS, API…). Each app connects 1:1 to its source product.", color: LAYER_COLOR.APPS },
              { title: "Source Products", desc: "Raw data products aligned 1:1 with applications. Foundation layer capturing operational data as it enters the mesh.", color: LAYER_COLOR.SOURCE_ALIGNED },
              { title: "Business Products", desc: "Transformed, enriched cross-domain products combining multiple sources for specific business use cases.", color: LAYER_COLOR.BUSINESS },
              { title: "Consumer Products", desc: "Innermost arc — ready-to-consume products powering dashboards, reports, ML models, and analytics.", color: LAYER_COLOR.CONSUMER_ALIGNED },
            ] as const).map(l => (
              <div key={l.title} className="rounded-xl p-5 border border-gray-100">
                <div className="w-3 h-3 rounded-full mb-3" style={{ background: l.color }} />
                <h3 className="text-[13px] font-bold mb-1.5" style={{ color: TEXT }}>{l.title}</h3>
                <p className="text-[11px] text-gray-500 leading-[1.7]">{l.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl p-5 border border-gray-100">
              <h3 className="text-[13px] font-bold mb-2" style={{ color: TEXT }}>Pipeline Health</h3>
              <div className="space-y-2 text-[11px] text-gray-500">
                <div className="flex items-center gap-2"><span className="w-8 h-0.5 rounded" style={{ background: GREEN }} /> Healthy — data flowing correctly</div>
                <div className="flex items-center gap-2"><span className="w-8 h-0.5 rounded" style={{ background: RED }} /> Broken — pipeline failure or issue</div>
              </div>
            </div>
            <div className="rounded-xl p-5 border border-gray-100">
              <h3 className="text-[13px] font-bold mb-2" style={{ color: TEXT }}>Data Quality (6 Dimensions)</h3>
              <div className="space-y-1.5 text-[10px] text-gray-500">
                {DQ_LABELS.map(dq => (
                  <div key={dq.key} className="flex items-start gap-1.5"><span className="font-semibold text-gray-700 shrink-0">{dq.label}:</span> {dq.desc}</div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-5 border border-gray-100">
              <h3 className="text-[13px] font-bold mb-2" style={{ color: TEXT }}>Interaction</h3>
              <div className="space-y-2 text-[11px] text-gray-500 leading-[1.7]">
                <p><strong className="text-gray-700">Search</strong> to find and highlight products or apps.</p>
                <p><strong className="text-gray-700">Click</strong> any bubble for full details + quality metrics.</p>
                <p><strong className="text-gray-700">Hover a domain</strong> in the legend to isolate its slice.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
