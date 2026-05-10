"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

interface GraphNode {
  id: string;
  label: string;
  tier?: string;
  qualityScore?: number;
  productType?: string;
  domainId?: string;
  domainName?: string;
  color: string;
  type: "app" | "product" | "domain";
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  targetX?: number;
  targetY?: number;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  edgeType?: string;
}

interface StoryForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  step: number;
}

const PRODUCT_RING = {
  SOURCE_ALIGNED: 0.32,
  BUSINESS: 0.2,
  CONSUMER_ALIGNED: 0.08,
};

const PRODUCT_SIZE = {
  GOLD: 18,
  SILVER: 14,
  BRONZE: 10,
};

export default function StoryForceGraph({ nodes, edges, step }: StoryForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const prevStepRef = useRef(-1);
  const renderedRef = useRef(false);

  const render = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const { width, height } = svgEl.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height);

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    defs.append("marker").attr("id", "story-arrow").attr("viewBox", "0 0 10 6").attr("refX", 24).attr("refY", 3)
      .attr("markerWidth", 6).attr("markerHeight", 4).attr("orient", "auto")
      .append("path").attr("d", "M0,0 L10,3 L0,6").attr("fill", "rgba(0,0,0,0.2)");

    const glow = defs.append("filter").attr("id", "story-glow");
    glow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // Layers (order = z-order)
    const platformLayer = svg.append("g").attr("class", "platform");
    const govLayer = svg.append("g").attr("class", "governance");
    const bottleneckLayer = svg.append("g").attr("class", "bottleneck");
    const principlesLayer = svg.append("g").attr("class", "principles");
    const ringLabels = svg.append("g").attr("class", "ring-labels");
    const domainLayer = svg.append("g").attr("class", "domains");
    const edgeLayer = svg.append("g").attr("class", "edges");
    const nodeLayer = svg.append("g").attr("class", "nodes");

    // Platform rect
    platformLayer.append("rect").attr("x", cx - width * 0.42).attr("y", cy - height * 0.42)
      .attr("width", width * 0.84).attr("height", height * 0.84).attr("rx", 16)
      .attr("fill", "rgba(86,178,101,0.04)").attr("stroke", "rgba(86,178,101,0.15)").attr("stroke-width", 1).attr("opacity", 0);
    platformLayer.append("text").attr("x", cx).attr("y", cy + height * 0.39).attr("text-anchor", "middle")
      .attr("fill", "rgba(86,178,101,0.5)").attr("font-size", "10px").attr("letter-spacing", "0.15em")
      .text("SELF-SERVE DATA PLATFORM").attr("opacity", 0);

    // Governance ring
    govLayer.append("circle").attr("cx", cx).attr("cy", cy).attr("r", R * 0.46)
      .attr("fill", "none").attr("stroke", "rgba(86,178,101,0.2)").attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6 4").attr("opacity", 0);
    govLayer.append("text").attr("x", cx).attr("y", cy - R * 0.46 - 6).attr("text-anchor", "middle")
      .attr("fill", "rgba(86,178,101,0.5)").attr("font-size", "9px").attr("letter-spacing", "0.15em")
      .text("FEDERATED GOVERNANCE").attr("opacity", 0);

    // Bottleneck: central hub label (NEW)
    bottleneckLayer.append("circle").attr("cx", cx).attr("cy", cy).attr("r", R * 0.07)
      .attr("fill", "rgba(239,68,68,0.06)").attr("stroke", "rgba(239,68,68,0.25)").attr("stroke-width", 1.5)
      .attr("opacity", 0).attr("class", "bn-circle");
    bottleneckLayer.append("text").attr("x", cx).attr("y", cy - 5).attr("text-anchor", "middle")
      .attr("fill", "#ef4444").attr("font-size", "9px").attr("font-weight", "700")
      .attr("letter-spacing", "0.12em").text("CENTRAL DATA").attr("opacity", 0).attr("class", "bn-text");
    bottleneckLayer.append("text").attr("x", cx).attr("y", cy + 8).attr("text-anchor", "middle")
      .attr("fill", "#ef4444").attr("font-size", "9px").attr("font-weight", "700")
      .attr("letter-spacing", "0.12em").text("TEAM").attr("opacity", 0).attr("class", "bn-text");
    bottleneckLayer.append("text").attr("x", cx).attr("y", cy + R * 0.1 + 8).attr("text-anchor", "middle")
      .attr("fill", "rgba(239,68,68,0.4)").attr("font-size", "8px").attr("font-weight", "600")
      .attr("letter-spacing", "0.15em").text("BOTTLENECK").attr("opacity", 0).attr("class", "bn-text");

    // Paradigm shift: principle labels at compass points (NEW)
    const principles = [
      { label: "DOMAIN OWNERSHIP", angle: -Math.PI / 2, color: "#a78bfa" },
      { label: "DATA AS A PRODUCT", angle: 0, color: "#22c55e" },
      { label: "SELF-SERVE PLATFORM", angle: Math.PI / 2, color: "#00d8ff" },
      { label: "FEDERATED GOVERNANCE", angle: Math.PI, color: "#f4a261" },
    ];
    principles.forEach(({ label, angle, color }) => {
      const pr = R * 0.42;
      const px = cx + pr * Math.cos(angle);
      const py = cy + pr * Math.sin(angle);
      principlesLayer.append("text").attr("x", px).attr("y", py).attr("text-anchor", "middle")
        .attr("fill", color).attr("font-size", "9px").attr("font-weight", "700")
        .attr("letter-spacing", "0.1em").text(label).attr("opacity", 0);
    });

    // Product type ring labels
    const ringData = [
      { label: "SOURCE-ALIGNED", r: PRODUCT_RING.SOURCE_ALIGNED, opacity: 0.2 },
      { label: "BUSINESS", r: PRODUCT_RING.BUSINESS, opacity: 0.25 },
      { label: "CONSUMER", r: PRODUCT_RING.CONSUMER_ALIGNED, opacity: 0.3 },
    ];
    ringData.forEach(({ label, r, opacity }) => {
      ringLabels.append("circle").attr("cx", cx).attr("cy", cy).attr("r", R * r)
        .attr("fill", "none").attr("stroke", `rgba(0,0,0,${opacity * 0.15})`).attr("stroke-width", 0.5)
        .attr("stroke-dasharray", "3 6").attr("opacity", 0).attr("class", "type-ring");
      ringLabels.append("text").attr("x", cx + R * r + 4).attr("y", cy - 2)
        .attr("fill", `rgba(0,0,0,${opacity * 0.6})`).attr("font-size", "8px").attr("letter-spacing", "0.1em")
        .text(label).attr("opacity", 0).attr("class", "type-ring-label");
    });

    // Domain backgrounds
    const productNodes = nodes.filter((n) => n.type === "product");
    const domainIds = [...new Set(productNodes.map((n) => n.domainId))];
    const domainColors: Record<string, string> = {};
    productNodes.forEach((n) => { if (n.domainId) domainColors[n.domainId] = n.color; });

    domainIds.forEach((did, i) => {
      const angle = (i / domainIds.length) * 2 * Math.PI - Math.PI / 2;
      const r = R * 0.28;
      const dx = cx + r * Math.cos(angle);
      const dy = cy + r * Math.sin(angle);
      domainLayer.append("circle").attr("class", `domain-bg-${did}`).attr("cx", dx).attr("cy", dy)
        .attr("r", R * 0.14).attr("fill", domainColors[did!] || "#666").style("filter", "url(#story-glow)").attr("opacity", 0);
      domainLayer.append("text").attr("class", `domain-lbl-${did}`).attr("x", dx).attr("y", dy - R * 0.11)
        .attr("text-anchor", "middle").attr("fill", domainColors[did!] || "#666")
        .attr("font-size", "10px").attr("font-weight", "700").attr("letter-spacing", "0.05em")
        .text(productNodes.find((n) => n.domainId === did)?.domainName?.toUpperCase() || "").attr("opacity", 0);
    });

    // Compute target positions
    productNodes.forEach((n) => {
      const dIdx = domainIds.indexOf(n.domainId);
      const domainAngle = (dIdx / domainIds.length) * 2 * Math.PI - Math.PI / 2;
      const ringR = R * (PRODUCT_RING[(n.productType as keyof typeof PRODUCT_RING)] || 0.25);
      const sameTypeSameDomain = productNodes.filter((p) => p.domainId === n.domainId && p.productType === n.productType);
      const pIdx = sameTypeSameDomain.indexOf(n);
      const spread = sameTypeSameDomain.length > 1 ? 0.3 : 0;
      const pAngle = domainAngle + (pIdx - (sameTypeSameDomain.length - 1) / 2) * spread;
      n.targetX = cx + ringR * Math.cos(pAngle);
      n.targetY = cy + ringR * Math.sin(pAngle);
    });

    // Tooltip
    let tooltipEl = document.querySelector(".story-tooltip") as HTMLDivElement | null;
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "story-tooltip";
      Object.assign(tooltipEl.style, {
        position: "fixed", background: "#ffffff", border: "1px solid #e2e8f0",
        borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#1e293b",
        pointerEvents: "none", opacity: "0", zIndex: "100", maxWidth: "260px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)", transition: "opacity 0.15s", lineHeight: "1.5",
      });
      document.body.appendChild(tooltipEl);
    }
    const tooltip = d3.select(tooltipEl);

    // Edges
    const edgeEls = edgeLayer.selectAll("line").data(edges).enter().append("line")
      .attr("stroke", "rgba(0,0,0,0.12)").attr("stroke-width", 1).attr("opacity", 0);

    // Nodes
    const nodeEls = nodeLayer.selectAll("g").data(productNodes).enter().append("g").attr("opacity", 0).attr("cursor", "default");

    nodeEls.filter((d) => d.productType === "CONSUMER_ALIGNED").append("circle")
      .attr("r", (d) => (PRODUCT_SIZE[(d.tier as keyof typeof PRODUCT_SIZE)] || 12) + 4)
      .attr("fill", "none").attr("stroke", (d) => d.color).attr("stroke-width", 1).attr("stroke-opacity", 0.15)
      .attr("stroke-dasharray", "2 2");

    nodeEls.append("circle").attr("class", "main-circle")
      .attr("r", (d) => PRODUCT_SIZE[(d.tier as keyof typeof PRODUCT_SIZE)] || 12)
      .attr("fill", (d) => d.color).attr("fill-opacity", 0.12)
      .attr("stroke", (d) => d.color).attr("stroke-width", 1.5)
      .on("mouseenter", (_event: MouseEvent, d: GraphNode) => {
        const typeLabel = d.productType === "SOURCE_ALIGNED" ? "Source Data Products" : d.productType === "BUSINESS" ? "Business Data Products" : "Consumer Data Products";
        const tier = d.tier ? `<span style="opacity:0.5">${d.tier}</span>` : "";
        const qs = d.qualityScore != null ? `<br/>Quality: <strong>${(d.qualityScore * 100).toFixed(0)}%</strong>` : "";
        tooltip.html(`<strong>${d.label}</strong> ${tier}<br/><span style="color:${d.color}">${d.domainName}</span> · ${typeLabel}${qs}`).style("opacity", "1");
      })
      .on("mousemove", (event: MouseEvent) => { tooltip.style("left", event.clientX + 14 + "px").style("top", event.clientY - 10 + "px"); })
      .on("mouseleave", () => tooltip.style("opacity", "0"));

    nodeEls.filter((d) => d.productType === "BUSINESS").append("circle")
      .attr("r", 3).attr("cx", 0).attr("cy", (d) => -(PRODUCT_SIZE[(d.tier as keyof typeof PRODUCT_SIZE)] || 12) - 5)
      .attr("fill", (d) => d.color).attr("fill-opacity", 0.6);

    nodeEls.append("text").attr("dy", "0.35em").attr("text-anchor", "middle").attr("fill", "#1e293b")
      .attr("font-size", "8px").attr("pointer-events", "none").text((d) => {
        if (d.label.length > 12) return d.label.slice(0, 11) + "\u2026";
        return d.label;
      });

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(productNodes)
      .force("x", d3.forceX<GraphNode>((d) => d.targetX || cx).strength(0.12))
      .force("y", d3.forceY<GraphNode>((d) => d.targetY || cy).strength(0.12))
      .force("collide", d3.forceCollide(18))
      .force("charge", d3.forceManyBody().strength(-20))
      .alphaDecay(0.025)
      .on("tick", () => {
        nodeEls.attr("transform", (d) => `translate(${d.x},${d.y})`);
        edgeEls
          .attr("x1", (d: any) => (typeof d.source === "object" ? d.source.x : 0))
          .attr("y1", (d: any) => (typeof d.source === "object" ? d.source.y : 0))
          .attr("x2", (d: any) => (typeof d.target === "object" ? d.target.x : 0))
          .attr("y2", (d: any) => (typeof d.target === "object" ? d.target.y : 0));
      });

    sim.force("link", d3.forceLink<GraphNode, GraphEdge>(edges).id((d) => d.id).distance(60).strength(0.2));
    simRef.current = sim;
    renderedRef.current = true;

    applyStep(step, svg, sim, productNodes, nodeEls, edgeEls, cx, cy, width, height, domainIds, R);
  }, [nodes, edges, step]);

  useEffect(() => {
    render();
    const handleResize = () => render();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [render]);

  useEffect(() => {
    if (prevStepRef.current === step || !renderedRef.current) return;
    prevStepRef.current = step;
    const svgEl = svgRef.current;
    if (!svgEl || !simRef.current) return;
    const svg = d3.select(svgEl);
    const { width, height } = svgEl.getBoundingClientRect();
    const R = Math.min(width, height);
    const cx = width / 2;
    const cy = height / 2;
    const productNodes = nodes.filter((n) => n.type === "product");
    const domainIds = [...new Set(productNodes.map((n) => n.domainId))];
    const nodeEls = svg.select(".nodes").selectAll<SVGGElement, GraphNode>("g");
    const edgeEls = svg.select(".edges").selectAll<SVGLineElement, GraphEdge>("line");
    applyStep(step, svg, simRef.current, productNodes, nodeEls, edgeEls, cx, cy, width, height, domainIds, R);
  }, [step, nodes]);

  return <svg ref={svgRef} className="w-full h-full" />;
}

/*
 * Steps 0-9:
 *   0  Scattered dots
 *   1  Bottleneck — all nodes to center (NEW)
 *   2  Paradigm shift — explode outward, principles flash (NEW)
 *   3  Domain clusters form (was step 1)
 *   4  Node labels visible (was step 2)
 *   5  Product-type rings (was step 3)
 *   6  Lineage edges (was step 4)
 *   7  Health coloring (was step 5)
 *   8  Platform layer (was step 6)
 *   9  Governance ring (was step 7)
 */
function applyStep(
  step: number,
  svg: d3.Selection<any, unknown, any, any>,
  sim: d3.Simulation<GraphNode, GraphEdge>,
  productNodes: GraphNode[],
  nodeEls: d3.Selection<SVGGElement, GraphNode, any, any>,
  edgeEls: d3.Selection<SVGLineElement, GraphEdge, any, any>,
  cx: number, cy: number, width: number, height: number,
  domainIds: (string | undefined)[],
  R: number
) {
  const t = d3.transition().duration(800).ease(d3.easeCubicInOut);

  // --- Step 0: Scattered dots ---
  if (step === 0) {
    productNodes.forEach((n) => {
      n.x = cx + (Math.random() - 0.5) * width * 0.6;
      n.y = cy + (Math.random() - 0.5) * height * 0.6;
    });
    sim.force("x", d3.forceX<GraphNode>(cx).strength(0.015));
    sim.force("y", d3.forceY<GraphNode>(cy).strength(0.015));
    sim.force("charge", d3.forceManyBody().strength(-20));
    sim.force("collide", d3.forceCollide(18));
    sim.alpha(0.8).restart();
    nodeEls.transition(t as any).attr("opacity", 1);
    nodeEls.selectAll(".main-circle").attr("fill-opacity", 0.06).attr("stroke-opacity", 0.2).attr("stroke", (d: any) => d.color);
    nodeEls.selectAll("text").attr("opacity", 0);
  }

  // --- Step 1: Bottleneck (NEW) ---
  if (step === 1) {
    sim.force("x", d3.forceX<GraphNode>(cx).strength(0.35));
    sim.force("y", d3.forceY<GraphNode>(cy).strength(0.35));
    sim.force("collide", d3.forceCollide(6));
    sim.force("charge", d3.forceManyBody().strength(-5));
    sim.alpha(0.9).restart();
    nodeEls.transition(t as any).attr("opacity", 1);
    nodeEls.selectAll(".main-circle").transition(t as any)
      .attr("fill-opacity", 0.08).attr("stroke-opacity", 0.35).attr("stroke", "#ef4444");
    nodeEls.selectAll("text").transition(t as any).attr("opacity", 0);
    svg.selectAll(".bn-circle").transition(t as any).attr("opacity", 1);
    svg.selectAll(".bn-text").transition(t as any).attr("opacity", 1);
  } else {
    svg.selectAll(".bn-circle").transition(t as any).attr("opacity", 0);
    svg.selectAll(".bn-text").transition(t as any).attr("opacity", 0);
  }

  // --- Step 2: Paradigm shift (NEW) ---
  if (step === 2) {
    sim.force("x", d3.forceX<GraphNode>(cx).strength(0.01));
    sim.force("y", d3.forceY<GraphNode>(cy).strength(0.01));
    sim.force("charge", d3.forceManyBody().strength(-120));
    sim.force("collide", d3.forceCollide(20));
    sim.alpha(0.9).restart();
    nodeEls.selectAll(".main-circle").transition(t as any)
      .attr("stroke", (d: any) => d.color).attr("fill-opacity", 0.08).attr("stroke-opacity", 0.4);
    svg.select(".principles").selectAll("text").transition(t as any).attr("opacity", 0.8);
  } else {
    svg.select(".principles").selectAll("text").transition(t as any).attr("opacity", 0);
  }

  // --- Step 3+: Domain clustering ---
  if (step >= 3) {
    sim.force("x", d3.forceX<GraphNode>((d: any) => d.targetX || cx).strength(0.1));
    sim.force("y", d3.forceY<GraphNode>((d: any) => d.targetY || cy).strength(0.1));
    sim.force("charge", d3.forceManyBody().strength(-20));
    sim.force("collide", d3.forceCollide(18));
    sim.alpha(0.5).restart();
    domainIds.forEach((did) => {
      svg.select(`.domain-bg-${did}`).transition(t as any).attr("opacity", 0.05);
      svg.select(`.domain-lbl-${did}`).transition(t as any).attr("opacity", 0.6);
    });
  }

  // Hide domains at steps 0-2
  if (step < 3) {
    domainIds.forEach((did) => {
      svg.select(`.domain-bg-${did}`).transition(t as any).attr("opacity", 0);
      svg.select(`.domain-lbl-${did}`).transition(t as any).attr("opacity", 0);
    });
  }

  // --- Step 4: Labels visible ---
  if (step >= 4) {
    nodeEls.transition(t as any).attr("opacity", 1);
    nodeEls.selectAll(".main-circle").transition(t as any).attr("fill-opacity", 0.15).attr("stroke-opacity", 0.8).attr("stroke", (d: any) => d.color);
    nodeEls.selectAll("text").transition(t as any).attr("opacity", 0.8);
  } else if (step < 4) {
    nodeEls.selectAll("text").transition(t as any).attr("opacity", 0);
  }

  // --- Step 5: Product-type rings ---
  if (step >= 5) {
    svg.selectAll(".type-ring").transition(t as any).attr("opacity", 1);
    svg.selectAll(".type-ring-label").transition(t as any).attr("opacity", 1);
    nodeEls.selectAll<SVGCircleElement, GraphNode>(".main-circle").transition(t as any)
      .attr("r", (d) => PRODUCT_SIZE[(d.tier as keyof typeof PRODUCT_SIZE)] || 12)
      .attr("fill-opacity", 0.2);
  } else {
    svg.selectAll(".type-ring").transition(t as any).attr("opacity", 0);
    svg.selectAll(".type-ring-label").transition(t as any).attr("opacity", 0);
  }

  // --- Step 6: Lineage edges ---
  edgeEls.transition(t as any)
    .attr("opacity", step >= 6 ? 0.35 : 0)
    .attr("stroke-width", step >= 6 ? 1.2 : 0)
    .attr("marker-end", step >= 6 ? "url(#story-arrow)" : "");

  // --- Step 7: Health coloring ---
  if (step >= 7) {
    nodeEls.selectAll<SVGCircleElement, GraphNode>(".main-circle").transition(t as any)
      .attr("fill", (d) => {
        if (!d.qualityScore) return d.color;
        if (d.qualityScore >= 0.9) return "#22c55e";
        if (d.qualityScore >= 0.8) return d.color;
        return "#eab308";
      }).attr("fill-opacity", 0.25);
  } else if (step >= 4 && step < 7) {
    nodeEls.selectAll<SVGCircleElement, GraphNode>(".main-circle").transition(t as any)
      .attr("fill", (d) => d.color).attr("fill-opacity", 0.15);
  }

  // --- Step 8: Platform ---
  svg.select(".platform rect").transition(t as any).attr("opacity", step >= 8 ? 0.8 : 0);
  svg.select(".platform text").transition(t as any).attr("opacity", step >= 8 ? 0.8 : 0);

  // --- Step 9: Governance ---
  svg.select(".governance circle").transition(t as any).attr("opacity", step >= 9 ? 0.5 : 0);
  svg.select(".governance text").transition(t as any).attr("opacity", step >= 9 ? 0.7 : 0);
}
