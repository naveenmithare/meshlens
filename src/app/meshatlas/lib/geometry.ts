/** Append alpha (0–100% of opacity) to `#RRGGBB` for layer-tinted card borders and fills */
export function hexWithOpacity(hexColor: string, opacityPct: number): string {
  const raw = hexColor.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return hexColor;
  const n = Math.max(0, Math.min(100, opacityPct));
  const byte = Math.round((n / 100) * 255);
  return `#${raw}${byte.toString(16).padStart(2, "0")}`;
}

export function tToAngle(t: number, pad: number) {
  const aLeft = Math.PI * (1 - pad);
  return aLeft - t * (aLeft - Math.PI * pad);
}

export function arcXY(r: number, t: number, cx: number, cy: number, pad: number): [number, number] {
  const a = tToAngle(t, pad);
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

export function arcSvgPath(r: number, cx: number, cy: number, pad: number) {
  const [x1, y1] = arcXY(r, 0, cx, cy, pad);
  const [x2, y2] = arcXY(r, 1, cx, cy, pad);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

export function qualityToStars(q: number): number {
  if (q >= 0.95) return 5;
  if (q >= 0.85) return 4;
  if (q >= 0.75) return 3;
  if (q >= 0.6) return 2;
  return 1;
}

export function deriveCharScore(p: any): Record<string, number> {
  const q = p.quality_score || 0;
  const hash = (p.id || "").split("").reduce((s: number, c: string) => s + c.charCodeAt(0), 0);
  return {
    discoverable: Math.min(100, Math.round(q * 100 + ((hash * 7) % 11) - 5)),
    addressable: Math.min(100, Math.round(q * 100 + ((hash * 3) % 9) - 4)),
    understandable: Math.min(100, Math.round(q * (p.description ? 105 : 70))),
    trustworthy: Math.min(100, Math.round(q * (p.sla_freshness ? 102 : 80))),
    accessible: Math.min(100, Math.round(q * 100 + ((hash * 11) % 7) - 2)),
    interoperable: Math.min(100, Math.round(q * 100 + ((hash * 13) % 8) - 3)),
    valuable: Math.min(100, Math.round(q * (p.owner ? 103 : 75))),
    secure: Math.min(100, Math.round(q * 100 + ((hash * 5) % 10) - 5)),
  };
}

export function typeGroupR(count: number) {
  return count <= 1 ? 10 : count <= 2 ? 13 : count <= 3 ? 15 : count <= 5 ? 18 : 20;
}

export function dotsInGroup(cx: number, cy: number, count: number, groupR: number, dotR: number): [number, number][] {
  if (count === 0) return [];
  if (count === 1) return [[cx, cy]];
  const ringR = groupR - dotR - 2;
  if (count <= 6)
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 - Math.PI / 2;
      return [cx + ringR * Math.cos(a), cy + ringR * Math.sin(a)] as [number, number];
    });
  const outerN = Math.ceil(count * 0.6),
    innerN = count - outerN,
    innerR = ringR * 0.5;
  const pos: [number, number][] = [];
  for (let i = 0; i < outerN; i++) {
    const a = (i / outerN) * Math.PI * 2 - Math.PI / 2;
    pos.push([cx + ringR * Math.cos(a), cy + ringR * Math.sin(a)]);
  }
  for (let i = 0; i < innerN; i++) {
    const a = (i / innerN) * Math.PI * 2 - Math.PI / 2;
    pos.push([cx + innerR * Math.cos(a), cy + innerR * Math.sin(a)]);
  }
  return pos;
}

export function deriveQualityMetrics(prods: any[]): Record<string, number> {
  if (!prods.length) return { completeness: 0, accuracy: 0, consistency: 0, timeliness: 0, validity: 0, uniqueness: 100 };
  const avgQ = prods.reduce((s: number, p: any) => s + (p.quality_score || 0), 0) / prods.length;
  const withDesc = prods.filter((p: any) => p.description).length;
  const withOwner = prods.filter((p: any) => p.owner).length;
  const withSla = prods.filter((p: any) => p.sla_freshness).length;
  const completeness = Math.round((withDesc + withOwner + withSla) / (prods.length * 3) * 100);
  const seed = (s: number) => Math.round(Math.min(99, Math.max(60, avgQ * 100 + s)));
  return { completeness, accuracy: seed(0), consistency: seed(3), timeliness: seed(-4), validity: seed(5), uniqueness: seed(8) };
}
