"use client";

interface Props {
  overview: any;
  domains: any[];
}

const STORIES = [
  {
    title: "How 55 Apps Became One Mesh",
    desc: "The journey from scattered data silos to a unified enterprise data mesh, told through the lens of Orange Co's digital transformation.",
    tag: "Architecture",
    bg: "#b8e6c8",
  },
  {
    title: "Customer 360: From 7 Sources to 1 Truth",
    desc: "How Sales, Marketing, and Support data products compose into a single customer view that powers personalization across channels.",
    tag: "Lineage",
    bg: "#ffe49a",
  },
  {
    title: "The Cost of Broken Pipelines",
    desc: "A deep dive into SLA breaches, pipeline failures, and the real business cost of degraded data quality across domains.",
    tag: "Operations",
    bg: "#fdd8d0",
  },
  {
    title: "Governance Without the Gate",
    desc: "How federated governance policies — RBAC, PII masking, retention — are enforced as code without slowing domain teams down.",
    tag: "Governance",
    bg: "#a8d4f5",
  },
  {
    title: "Supply Chain Visibility in Real Time",
    desc: "From Kafka order events to FourKites tracking, how the Supply Chain domain achieves end-to-end fulfillment visibility.",
    tag: "Domain Deep Dive",
    bg: "#dbb8e6",
  },
  {
    title: "The Revenue Ledger: Finance Meets Data Mesh",
    desc: "How Finance built a cross-domain revenue ledger that feeds the CFO's weekly board report with zero manual intervention.",
    tag: "Domain Deep Dive",
    bg: "#f0d0e8",
  },
];

export default function StoriesClient({ overview, domains }: Props) {
  return (
    <div className="min-h-screen pt-28 px-8 pb-24">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-16">
          <span className="section-label">Data Stories</span>
          <h1 className="heading-display mb-5">Narratives from the Mesh</h1>
          <p className="text-mesh-text-muted leading-[1.9] text-[16px]">
            Interactive stories that bring data mesh concepts to life through real scenarios
            from Orange Co&apos;s {overview.domain_count} domains and {overview.product_count} data products.
          </p>
        </div>

        {/* Stories grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STORIES.map((story) => (
            <div key={story.title}
              className="card-colored cursor-pointer group"
              style={{ backgroundColor: story.bg }}>
              <span className="inline-block text-[11px] uppercase tracking-[0.08em] font-bold px-3 py-1 rounded-full bg-white/50 text-mesh-text mb-5">
                {story.tag}
              </span>
              <h3 className="text-[19px] font-bold text-mesh-text mb-3">{story.title}</h3>
              <p className="text-[15px] text-mesh-text/65 leading-[1.7] mb-6">{story.desc}</p>
              <div className="flex items-center gap-2 text-[14px] font-bold text-mesh-text">
                Coming soon
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
