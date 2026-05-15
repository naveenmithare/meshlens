"use client";

import { useState } from "react";
import Link from "next/link";

/* ── types ── */
interface Domain {
  domain_name: string;
  color_hex: string;
  app_count: number;
  product_count: number;
  healthy_count: number;
  degraded_count: number;
  down_count: number;
  monthly_cost_usd: number;
}
interface App {
  id: string;
  name: string;
  app_type: string;
  vendor: string;
  description: string;
  domain_id: string;
  domain_name: string;
  color_hex: string;
  owner_team: string;
  conn_status: string;
  sync_frequency: string;
  monthly_cost_usd: number;
  rows_per_sync_avg: number;
  connector_type: string;
  destination_name: string;
}
interface Product {
  id: string;
  name: string;
  product_type: string;
  domain_id: string;
  domain_name: string;
  color_hex: string;
  quality_score: number;
  sla_freshness: string;
  owner: string;
  description: string;
}
interface Policy {
  id: string;
  name: string;
  policy_type: string;
  description: string;
  scope: string;
  domain_name: string | null;
  enforced: number;
}
interface LineageItem {
  product_id: string;
  source_names: string;
}
interface Overview {
  domain_count: number;
  app_count: number;
  product_count: number;
  connection_count: number;
  lineage_edges: number;
}
interface Props {
  overview: Overview;
  domains: Domain[];
  apps: App[];
  products: Product[];
  policies: Policy[];
  lineage: LineageItem[];
}

/* ── small reusable components ── */

function SectionHeading({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <span className="section-label">{`0${number}`}</span>
      <h2 className="heading-display">{children}</h2>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide border"
      style={{
        borderColor: `${color}30`,
        backgroundColor: `${color}10`,
        color,
      }}
    >
      {children}
    </span>
  );
}

const DOMAIN_ICONS: Record<string, { path: string; vb: string }> = {
  Sales:          { vb: "0 0 24 24", path: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" },
  Finance:        { vb: "0 0 24 24", path: "M11.8 2L2 7v2h20V7L11.8 2zM4 11v6h3v-6H4zm5 0v6h3v-6H9zm5 0v6h3v-6h-3zm-14 8v2h20v-2H0z" },
  "Supply Chain": { vb: "0 0 24 24", path: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM20 9.5l2.5 3H17V9.5h3zm-2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" },
  Marketing:      { vb: "0 0 24 24", path: "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" },
  Product:        { vb: "0 0 24 24", path: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" },
  HR:             { vb: "0 0 24 24", path: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
  Support:        { vb: "0 0 24 24", path: "M12 1a9 9 0 00-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2a7 7 0 0114 0v2h-4v8h3c1.66 0 3-1.34 3-3v-7a9 9 0 00-9-9z" },
};

function DomainIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
  const icon = DOMAIN_ICONS[name];
  if (!icon) return <div className="rounded-md shrink-0" style={{ width: size, height: size, backgroundColor: color }} />;
  return (
    <svg viewBox={icon.vb} width={size} height={size} className="shrink-0">
      <path d={icon.path} fill={color} />
    </svg>
  );
}

const APP_TYPE_ICONS: Record<string, string> = {
  CRM: "🏢",
  ERP: "⚙️",
  SaaS: "☁️",
  API: "🔌",
  STREAMING: "📡",
  DATABASE: "🗄️",
  DEVTOOLS: "🛠️",
  HRIS: "👥",
  ANALYTICS: "📊",
};

const DOMAIN_STORIES: Record<string, string> = {
  Sales: "The Sales domain drives Orange Co's revenue engine. The team manages the full customer lifecycle from lead generation to deal closure. ZoomInfo identifies target accounts. Outreach and Salesloft run multi-channel sequences. Gong records and analyzes every customer call, surfacing coaching insights and deal risk signals. Salesforce is the system of record for pipeline and opportunities, while CPQ handles complex quoting for enterprise deals. DocuSign closes the loop with electronic signatures. HubSpot supplements as a secondary CRM for the SMB segment. Salesforce Marketing Cloud powers sales-driven email campaigns. Clari provides pipeline forecasting for leadership.",
  Finance: "The Finance domain manages all financial operations — revenue recognition, billing, accounts payable, tax compliance, and financial planning. EBS and Oracle Financials handle the general ledger and enterprise accounting. Stripe processes payment transactions from the e-commerce platform. Zuora manages subscription billing — renewals, upgrades, and usage-based add-ons. NetSuite handles revenue schedules and ASC 606 compliance. Coupa manages procurement spend. Avalara automates tax calculations across jurisdictions. Anaplan powers the FP&A team's budgeting and forecasting models.",
  "Supply Chain": "The Supply Chain domain orchestrates everything from raw material procurement to last-mile delivery. SAP SCM manages procurement planning and vendor relationships with manufacturing partners. Oracle SCM Cloud handles demand forecasting and inventory optimization. Kafka streams real-time events — order lifecycle events and inventory movements across warehouses. Kinaxis provides demand sensing and S&OP scenario planning. Manhattan WMS controls warehouse operations — receiving, putaway, wave planning, picking, and packing. FourKites tracks in-transit shipments and predicts ETAs. ShipStation manages carrier selection and last-mile shipping labels.",
  Marketing: "The Marketing domain generates demand and nurtures prospects through the entire buyer journey. Google Ads and Meta Ads run paid acquisition — prospecting, retargeting, and lookalike campaigns. LinkedIn Ads targets enterprise decision-makers for the B2B wholesale channel. Google Analytics 4 tracks web and app sessions. Segment acts as the customer data platform, collecting events from every digital touchpoint into unified user profiles. Marketo powers B2B lead nurturing and MQL handoff to Sales. Braze and Iterable drive lifecycle messaging — onboarding flows, re-engagement, and churn prevention. Contentful manages structured content for the website and landing pages.",
  Product: "The Product domain builds and operates Orange Co's digital platform. Amplitude and Pendo measure product adoption — feature usage, retention cohorts, and NPS. Kafka streams real-time clickstream data for behavioral analytics and the recommendation engine. GitHub hosts all source code and tracks pull request velocity. Jira manages sprint planning across engineering squads. LaunchDarkly controls feature flags for progressive rollouts and A/B experiments. Datadog provides infrastructure and application monitoring. PagerDuty manages on-call rotations and incident response. PostgreSQL is the primary application database.",
  HR: "The HR domain manages the full employee lifecycle — from hiring to offboarding. Workday is the core HRIS — employee records, org hierarchy, compensation, benefits, and payroll. BambooHR supplements as a lightweight platform for specific regions. Greenhouse runs the recruiting pipeline — job postings, applicant tracking, structured interview scorecards, and offer management. Lattice powers performance reviews, OKRs, and career growth plans. Culture Amp runs engagement surveys and pulse checks, feeding eNPS and action plans to managers. Deel manages compliance, contracts, and payments for international contractors.",
  Support: "The Support domain ensures every customer interaction is tracked, resolved, and measured. Zendesk is the primary help desk — ticketing, agent assignment, SLA tracking, and satisfaction surveys. Intercom handles live chat, in-app messaging, and product tours for self-serve support. Statuspage communicates real-time system health to customers during incidents. Confluence stores internal knowledge base articles, troubleshooting runbooks, and support playbooks. SurveyMonkey captures post-interaction CSAT and NPS scores to close the feedback loop.",
};

const APP_DESCRIPTIONS: Record<string, string> = {
  Salesforce: "Primary CRM. System of record for accounts, contacts, opportunities, and the full sales pipeline. Used by 200+ reps globally.",
  HubSpot: "Secondary CRM for the SMB segment. Manages inbound leads, email sequences, and deal tracking for the self-serve funnel.",
  Gong: "Revenue intelligence platform. Records sales calls, surfaces coaching insights, and tracks deal engagement signals.",
  "CPQ (Salesforce)": "Configure-Price-Quote engine for complex deals. Generates quotes, manages approval workflows, and syncs pricing to Salesforce.",
  DocuSign: "Electronic signature platform for contracts, MSAs, and order forms. Integrated into the deal close workflow.",
  Outreach: "Sales engagement platform. Manages multi-step email and call sequences for outbound prospecting.",
  Salesloft: "Alternative sales engagement platform. Used by the enterprise BDR team for high-touch outbound cadences.",
  Clari: "Revenue forecasting platform. Provides AI-driven pipeline predictions and deal risk scoring for leadership.",
  ZoomInfo: "B2B data provider. Enriches leads with firmographic and contact data for account-based marketing and prospecting.",
  "Salesforce Marketing Cloud": "Enterprise email and marketing automation for sales-driven campaigns, event invitations, and customer communications.",
  "EBS": "Core ERP system. Manages general ledger, accounts payable/receivable, cost centers, and vendor master data.",
  "Oracle Financials": "Enterprise financial management. Handles multi-entity consolidation, intercompany transactions, and statutory reporting.",
  Stripe: "Payment processing platform. Handles online transactions, subscriptions, invoicing, and payout reconciliation.",
  Zuora: "Subscription management and billing. Powers recurring revenue models, usage-based pricing, and subscription lifecycle.",
  NetSuite: "Financial management for revenue schedules, ASC 606 compliance, and multi-subsidiary accounting.",
  Coupa: "Procurement platform. Manages purchase requisitions, vendor selection, and spend management.",
  Avalara: "Automated tax compliance. Calculates sales tax, VAT, and GST across jurisdictions in real time.",
  Anaplan: "Connected planning platform. Powers financial modeling, what-if scenarios, and rolling forecasts for the FP&A team.",
  "SAP SCM": "Supply chain management ERP. Handles procurement planning, vendor management, and production scheduling.",
  "Oracle SCM Cloud": "Cloud-based supply chain planning. Manages demand forecasting, inventory optimization, and logistics.",
  "Kafka — Order Events": "Real-time event stream for order lifecycle — creation, payment, fulfillment, shipping, and delivery updates.",
  "Kafka — Inventory Events": "Real-time stream of inventory movements — stock receipts, transfers, adjustments, and depletion events across warehouses.",
  Kinaxis: "Concurrent planning platform. Provides demand sensing, supply planning, and S&OP scenario analysis.",
  "Manhattan WMS": "Warehouse management system. Controls receiving, putaway, wave planning, picking, packing, and shipping operations.",
  FourKites: "Real-time supply chain visibility. Tracks shipments in transit, predicts ETAs, and alerts on delays.",
  ShipStation: "Shipping and fulfillment platform. Manages carrier selection, label printing, and last-mile delivery tracking.",
  "Google Ads": "Paid search and display advertising. Manages keyword bidding, ad creative, and conversion tracking across Google's network.",
  "Meta Ads": "Social advertising across Facebook and Instagram. Runs prospecting, retargeting, and lookalike campaigns.",
  "LinkedIn Ads": "B2B advertising platform. Targets decision-makers by job title, company, and industry for account-based campaigns.",
  "Google Analytics 4": "Web and app analytics. Tracks user sessions, page flows, conversions, and attribution across digital properties.",
  Segment: "Customer data platform. Collects events from web, mobile, and server-side sources into a unified user profile.",
  Marketo: "B2B marketing automation. Manages lead scoring, nurture programs, and marketing-qualified lead handoff to Sales.",
  Braze: "Customer engagement platform. Sends personalized push notifications, in-app messages, and lifecycle emails.",
  Iterable: "Cross-channel marketing automation. Orchestrates email, SMS, and push campaigns based on user behavior.",
  Contentful: "Headless CMS. Manages structured content for the website, landing pages, and in-product help documentation.",
  Amplitude: "Product analytics platform. Tracks feature adoption, user retention, and behavioral cohorts.",
  Pendo: "Product experience platform. Captures usage data, powers in-app guides, and collects feature feedback.",
  "Kafka — Clickstream": "Real-time stream of user interactions — page views, clicks, scrolls, and form events from the web platform.",
  GitHub: "Source code hosting and collaboration. Tracks commits, pull requests, code reviews, and deployment frequency.",
  Jira: "Project management and issue tracking. Manages sprints, epics, story points, and engineering delivery metrics.",
  LaunchDarkly: "Feature flag management. Controls progressive rollouts, A/B experiments, and kill switches in production.",
  Datadog: "Infrastructure and application monitoring. Collects metrics, traces, and logs from all production services.",
  PagerDuty: "Incident management platform. Manages on-call schedules, escalation policies, and incident response workflows.",
  "PostgreSQL — App DB": "Primary relational database for the core application. Stores user accounts, product catalog, and transactional data.",
  Workday: "Core HRIS platform. Manages employee records, organizational hierarchy, compensation, benefits, and payroll processing.",
  BambooHR: "Lightweight HR platform for specific regions. Handles onboarding, PTO tracking, and employee self-service.",
  Greenhouse: "Applicant tracking system. Manages job requisitions, candidate pipelines, interview scorecards, and offer letters.",
  Lattice: "Performance management platform. Powers review cycles, OKR tracking, 1:1 agendas, and career growth plans.",
  "Culture Amp": "Employee engagement platform. Runs pulse surveys, eNPS tracking, and action planning for managers.",
  Deel: "Global payroll and contractor management. Handles international compliance, contracts, and payments for 15+ countries.",
  Zendesk: "Primary help desk platform. Manages support tickets, agent workflows, SLA policies, macros, and customer satisfaction ratings.",
  Intercom: "Customer messaging platform. Powers live chat, product tours, in-app messaging, and self-serve knowledge base articles.",
  Statuspage: "Public status page for communicating system health. Tracks incidents, scheduled maintenances, and component uptime.",
  Confluence: "Internal knowledge base. Stores support playbooks, troubleshooting runbooks, and team documentation.",
  SurveyMonkey: "Survey platform for post-interaction feedback. Captures CSAT and NPS scores across support channels.",
};

/* constants removed — architecture is now a self-contained component */

/* ── main component ── */

export default function IntroClient(props: Props) {
  const { overview, domains, apps, products } = props;
  const [expandedDomain, setExpandedDomain] = useState<string | null>(domains[0]?.domain_name ?? null);
  const grouped = domains.map((d) => ({
    ...d,
    apps: apps.filter((a) => a.domain_name === d.domain_name),
    products: products.filter((p) => p.domain_name === d.domain_name),
  }));

  return (
    <div className="pt-20 sm:pt-24 page-responsive">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO — WHAT IS DATA MESH                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-20 pb-12 relative z-10">
          <span className="section-label">Introduction</span>
          <h1 className="heading-display !text-[clamp(1.75rem,3.8vw,2.8rem)] mb-8">
            What Is a Data Mesh — <span className="text-mesh-accent">and Why Enterprise Needs One</span>
          </h1>
          <p className="text-[17px] text-mesh-text-muted leading-[1.9] mb-16">
            A data mesh is a <strong className="text-mesh-text font-medium">decentralized, domain-oriented architecture</strong> for
            analytical data. Instead of funneling everything into a central data lake owned by one
            overwhelmed team, each business domain owns, produces, and serves its own data as
            a product — with shared governance and a self-serve platform underneath.
          </p>

          {/* 4 principles diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
            {[
              {
                title: "Domain Ownership",
                desc: "Each business domain owns its analytical data end-to-end — the people closest to the data manage it.",
                bg: "#b8e6c8",
                icon: (
                  <svg viewBox="0 0 40 40" className="w-11 h-11">
                    <circle cx="20" cy="12" r="5" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
                    <path d="M8 34c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
                  </svg>
                ),
              },
              {
                title: "Data as a Product",
                desc: "Treat datasets like APIs — discoverable, documented, versioned, with quality SLAs and clear ownership.",
                bg: "#ffe49a",
                icon: (
                  <svg viewBox="0 0 40 40" className="w-11 h-11">
                    <rect x="8" y="8" width="24" height="24" rx="4" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
                    <line x1="8" y1="16" x2="32" y2="16" stroke="#1a1a1a" strokeWidth="1.5" />
                    <line x1="20" y1="16" x2="20" y2="32" stroke="#1a1a1a" strokeWidth="1.5" />
                  </svg>
                ),
              },
              {
                title: "Self-Serve Platform",
                desc: "A shared infrastructure layer that lets any domain team build, deploy, and monitor data products autonomously.",
                bg: "#a8d4f5",
                icon: (
                  <svg viewBox="0 0 40 40" className="w-11 h-11">
                    <rect x="6" y="22" width="28" height="10" rx="3" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
                    <circle cx="12" cy="27" r="1.5" fill="#1a1a1a" />
                    <rect x="10" y="8" width="20" height="10" rx="3" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
                    <circle cx="16" cy="13" r="1.5" fill="#1a1a1a" />
                  </svg>
                ),
              },
              {
                title: "Federated Governance",
                desc: "Global standards for interoperability, security, privacy, and quality — agreed by all domains, enforced as code.",
                bg: "#dbb8e6",
                icon: (
                  <svg viewBox="0 0 40 40" className="w-11 h-11">
                    <path d="M20 6l12 8v12l-12 8-12-8V14z" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
                    <path d="M20 14v12M14 18l6 4 6-4" fill="none" stroke="#1a1a1a" strokeWidth="1.2" opacity="0.6" />
                  </svg>
                ),
              },
            ].map((p) => (
              <div key={p.title} className="card-colored" style={{ backgroundColor: p.bg }}>
                <div className="mb-5">{p.icon}</div>
                <h3 className="text-[17px] font-bold text-mesh-text mb-3">{p.title}</h3>
                <p className="text-[14px] text-mesh-text/70 leading-[1.7]">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* The great divide — why mesh matters */}
          <div className="card-block mb-12">
            <h3 className="text-[14px] font-bold text-mesh-accent uppercase tracking-[0.1em] mb-6">Why Enterprises Are Adopting Data Mesh</h3>
            <div className="space-y-5 text-[16px] text-mesh-text-muted leading-[1.9]">
              <p>
                Enterprise data has always lived in two worlds: <strong className="text-mesh-text">operational
                systems</strong> that run the business in real time, and <strong className="text-mesh-text">analytical
                systems</strong> that look backward for insight.{" "}
                <a href="https://martinfowler.com/articles/data-mesh-principles.html" target="_blank" rel="noopener noreferrer"
                  className="text-mesh-accent hover:underline">Zhamak Dehghani</a> calls
                this <em>the great divide of data</em> — and the traditional answer of funneling everything into a
                central warehouse or lake only works at modest scale. As organizations grow in source systems,
                consumers, and use cases, the central team becomes a bottleneck, not an enabler.
              </p>
              <p>
                Data mesh addresses these dimensions by inverting the topology —{" "}
                <strong className="text-mesh-text">organizing data by domains, not by technology stack</strong>. As{" "}
                <a href="https://martinfowler.com/articles/data-mesh-principles.html" target="_blank" rel="noopener noreferrer"
                  className="text-mesh-accent hover:underline">Fowler and Dehghani</a> describe,
                the four principles are collectively necessary and sufficient: domain ownership localizes
                accountability, product thinking ensures quality, a self-serve platform removes friction, and
                federated governance maintains interoperability without centralized control.
              </p>
              <p>
                The result is not a new technology — it is a new <strong className="text-mesh-text">operating
                model</strong>. One where every team publishes its data as a product with SLAs, documentation, and
                access controls, and a shared platform makes that publication as easy as deploying a microservice.
              </p>
            </div>
          </div>

          {/* The problem & solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="card-colored" style={{ backgroundColor: "#fef0ed" }}>
              <h3 className="text-[14px] font-bold text-mesh-text uppercase tracking-[0.1em] mb-5">The Problem — Central Data Team</h3>
              <div className="flex items-center justify-center my-6">
                <CentralTeamDiagram />
              </div>
              <ul className="space-y-3 text-[15px] text-mesh-text/80">
                <li className="flex gap-3"><span className="text-red-600 font-bold mt-0.5">✕</span> Central team becomes the bottleneck for every request</li>
                <li className="flex gap-3"><span className="text-red-600 font-bold mt-0.5">✕</span> Engineers lack domain context — data quality degrades</li>
                <li className="flex gap-3"><span className="text-red-600 font-bold mt-0.5">✕</span> &ldquo;ETL spaghetti&rdquo; grows faster than the team can maintain it</li>
                <li className="flex gap-3"><span className="text-red-600 font-bold mt-0.5">✕</span> Business decisions wait days or weeks for data</li>
              </ul>
            </div>
            <div className="card-colored" style={{ backgroundColor: "#edf8f0" }}>
              <h3 className="text-[14px] font-bold text-mesh-text uppercase tracking-[0.1em] mb-5">The Solution — Data Mesh</h3>
              <div className="flex items-center justify-center my-6">
                <MeshDiagram domains={domains} />
              </div>
              <ul className="space-y-3 text-[15px] text-mesh-text/80">
                <li className="flex gap-3"><span className="text-green-700 font-bold mt-0.5">✓</span> Domain teams own, produce, and serve their own data</li>
                <li className="flex gap-3"><span className="text-green-700 font-bold mt-0.5">✓</span> Data is discoverable, documented, and versioned like an API</li>
                <li className="flex gap-3"><span className="text-green-700 font-bold mt-0.5">✓</span> Shared platform with federated governance as code</li>
                <li className="flex gap-3"><span className="text-green-700 font-bold mt-0.5">✓</span> Cross-domain composition without centralized bottlenecks</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 1 — OUR ENTERPRISE                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 section-gap">
        <SectionHeading number="1">Meet Orange Co</SectionHeading>

        {/* Company brand strap */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-5 mb-10 rounded-2xl bg-gradient-to-r from-[#eb7a35] via-[#f59e0b] to-[#eb7a35] px-5 py-5 sm:px-8">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-3xl font-black text-white">O</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Orange Co</h3>
              <p className="text-[13px] text-white/80 font-medium">Technology-Driven Commerce · Global Enterprise</p>
            </div>
          </div>
          <div className="flex gap-8 sm:ml-auto border-t border-white/25 pt-4 sm:border-t-0 sm:pt-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{overview.domain_count}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Domains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{overview.app_count}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Applications</div>
            </div>
          </div>
        </div>

        <div className="space-y-5 text-[16px] text-mesh-text-muted leading-[1.9]">
          <p>
            <strong className="text-mesh-text">Orange Co</strong> is an imaginary multi-million-dollar
            technology-driven commerce company with thousands of employees globally. The company
            designs, manufactures, and sells both physical products and digital subscriptions —
            direct-to-consumer through its own e-commerce platform and through a network of
            wholesale and retail partners.
          </p>
          <p>
            Like most enterprises at this scale, Orange Co runs{" "}
            <strong className="text-mesh-text">{overview.app_count} operational
            applications</strong> across <strong className="text-mesh-text">{overview.domain_count} business
            domains</strong> — SaaS platforms for CRM and marketing, ERPs for finance and
            supply chain, real-time streaming systems for inventory and clickstream data,
            developer tooling for engineering velocity, HRIS platforms for people operations,
            and customer support systems for post-sale experience.
            Over time, these systems became <strong className="text-mesh-text">data silos</strong>:
            each generating valuable information, but none of it connected.
          </p>
          <p>
            The result was a familiar pattern: a small central data team trying to serve the
            entire company, spending most of their time fixing broken pipelines and learning
            unfamiliar domains. Business questions that should take hours took weeks. Strategic
            decisions were made on gut instinct instead of data.
          </p>
          <p>
            That&apos;s why Orange Co adopted a{" "}
            <strong className="text-mesh-text">data mesh architecture</strong> — shifting data
            ownership to the domain teams who know it best, while keeping a shared platform
            and federated governance underneath.
          </p>
        </div>

        {/* How the business operates */}
        <h3 className="text-[18px] font-bold text-mesh-text mt-16 mb-6">How Orange Co Operates</h3>
        {(() => {
          const items = [
            { title: "Sell", desc: "The sales team manages the full revenue cycle — prospecting via ZoomInfo, engaging through Outreach and Gong, closing in Salesforce, and signing contracts via DocuSign. The SMB segment runs self-serve through HubSpot.", color: "#e76f51", icon: "Sales" },
            { title: "Market", desc: "Marketing drives demand through Google Ads, Meta, and LinkedIn campaigns. Segment stitches every customer touchpoint into a unified event stream. Braze and Iterable handle lifecycle messaging for subscribers.", color: "#a78bfa", icon: "Marketing" },
            { title: "Fulfill", desc: "Supply Chain orchestrates end-to-end fulfillment — SAP and Oracle SCM for procurement, Kafka for real-time order and inventory events, Manhattan WMS for warehouse operations, and ShipStation for last-mile delivery.", color: "#2a9d8f", icon: "Supply Chain" },
            { title: "Build", desc: "Product & Engineering builds and operates the platform. Amplitude and Pendo capture product usage. GitHub and Jira track delivery velocity. Datadog and PagerDuty keep systems healthy. Kafka streams real-time clickstream data.", color: "#60a5fa", icon: "Product" },
            { title: "Finance", desc: "Finance runs on EBS and Oracle Financials for ledger and GL. Stripe and Zuora handle billing and subscriptions. NetSuite manages revenue schedules. Anaplan powers FP&A planning.", color: "#e9c46a", icon: "Finance" },
            { title: "People", desc: "HR manages the employee lifecycle through Workday and BambooHR. Greenhouse handles recruiting. Lattice and Culture Amp drive performance reviews and engagement surveys. Deel manages global contractors.", color: "#f472b6", icon: "HR" },
            { title: "Support", desc: "Customer Support ensures every interaction is tracked and resolved. Zendesk manages tickets and SLAs. Intercom handles live chat. Statuspage communicates incidents. Confluence stores runbooks. SurveyMonkey captures CSAT scores.", color: "#f97316", icon: "Support" },
          ];
          const topRow = items.slice(0, 4);
          const bottomRow = items.slice(4);
          const renderCard = (item: typeof items[0]) => (
            <div key={item.title}
              className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${item.color}15` }}>
                  <DomainIcon name={item.icon} color={item.color} size={18} />
                </div>
                <h4 className="text-[15px] font-bold text-mesh-text">{item.title}</h4>
              </div>
              <p className="text-[13px] text-mesh-text-muted leading-[1.7]">{item.desc}</p>
            </div>
          );
          return (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {topRow.map(renderCard)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[75%] mx-auto lg:max-w-none lg:grid-cols-3 lg:px-[12.5%]">
                {bottomRow.map(renderCard)}
              </div>
            </>
          );
        })()}
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 2 — DOMAINS & APPLICATIONS                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 section-gap">
        <SectionHeading number="2">Domains &amp; Their Applications</SectionHeading>
        <p className="text-[16px] text-mesh-text-muted leading-[1.9] mb-4">
          Following domain-driven design, we organized the enterprise into seven autonomous domains.
          Each domain has a dedicated team that knows its data best — and owns the applications
          that generate it.
        </p>
        <p className="text-[13px] text-mesh-accent font-medium mb-8 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
          </svg>
          Click any domain below to explore its application landscape and the systems that power it.
        </p>

        {/* Domain selector + detail — single card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-7 gap-0 border-b border-[#f0f0f0]">
            {grouped.map((d) => {
              const isOpen = expandedDomain === d.domain_name;
              return (
                <button key={d.domain_name}
                  onClick={() => setExpandedDomain(isOpen ? null : d.domain_name)}
                  className="flex shrink-0 flex-col items-center gap-1.5 py-4 px-3 sm:px-0 text-center transition-all duration-200 cursor-pointer relative min-w-[92px] sm:min-w-0"
                  style={{
                    background: isOpen ? `${d.color_hex}0D` : "transparent",
                  }}>
                  {isOpen && (
                    <span className="absolute bottom-0 left-[20%] right-[20%] h-[3px] rounded-full" style={{ background: d.color_hex }} />
                  )}
                  <DomainIcon name={d.domain_name} color={isOpen ? d.color_hex : "#9ca3af"} size={22} />
                  <div className={`text-[12px] font-bold ${isOpen ? "text-mesh-text" : "text-gray-500"}`}>{d.domain_name}</div>
                  <div className="text-[11px] font-semibold" style={{ color: d.color_hex }}>{d.app_count} apps</div>
                </button>
              );
            })}
          </div>

          {/* Expanded domain detail */}
          {expandedDomain && (() => {
            const d = grouped.find((g) => g.domain_name === expandedDomain);
            if (!d) return null;
            const domainStory = DOMAIN_STORIES[d.domain_name] ?? "";
            return (
              <div className="p-4 sm:p-8 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${d.color_hex}15` }}>
                    <DomainIcon name={d.domain_name} color={d.color_hex} size={22} />
                  </div>
                  <div>
                    <h4 className="text-[17px] font-bold text-mesh-text">{d.domain_name}</h4>
                    <span className="text-[12px] font-medium" style={{ color: d.color_hex }}>
                      {d.app_count} applications
                    </span>
                  </div>
                </div>
                <p className="text-[15px] text-mesh-text-muted leading-[1.8] mb-6">{domainStory}</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {d.apps.map((a) => (
                    <div key={a.id} className="rounded-xl bg-[#f8f8f8] p-4 hover:bg-[#f2f2f2] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{APP_TYPE_ICONS[a.app_type] ?? "📦"}</span>
                        <span className="text-[13px] font-bold text-mesh-text">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Badge color={d.color_hex}>{a.app_type}</Badge>
                        <span className="text-[11px] text-mesh-text-muted">{a.vendor}</span>
                      </div>
                      <p className="text-[12px] text-mesh-text-muted leading-[1.7]">
                        {APP_DESCRIPTIONS[a.name] ?? `${a.vendor} ${a.app_type.toLowerCase()} platform.`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 3 — BUILDING THE ENTERPRISE MESH              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 section-gap">
        <SectionHeading number="3">Building the Enterprise Mesh</SectionHeading>

        {/* Narrative — data products philosophy */}
        <div className="space-y-5 text-[16px] text-mesh-text-muted leading-[1.9] mb-12">
          <p>
            In a mesh, data is not a by-product that gets dumped into a lake — it is a{" "}
            <a href="https://martinfowler.com/articles/data-mesh-principles.html" target="_blank" rel="noopener noreferrer"
              className="text-mesh-accent hover:underline">first-class product</a> with
            an owner, a schema contract, quality SLAs, and documented access patterns.
            Every data product should be discoverable, addressable, trustworthy, and composable — ensuring
            consumers can find, understand, and reliably use data across domain boundaries.
          </p>
          <p>
            At Orange Co, we organize {overview.product_count} data products into three layers:
          </p>
        </div>

        {/* Three product layers — overview only */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { label: "Source Data Products", count: products.filter((p) => p.product_type === "SOURCE_ALIGNED").length, color: "#c2702e", desc: "Every source application gets a 1:1 data product — a schema-faithful landing zone that preserves the original structure while making it queryable and governed inside the mesh.", icon: "M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2z" },
            { label: "Business Data Products", count: products.filter((p) => p.product_type === "BUSINESS").length, color: "#eab308", desc: "Domain teams compose source products into analytical entities — Customer 360, Revenue Ledger, Campaign Performance — combining data across systems into a single trusted view.", icon: "M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H2v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-3z" },
            { label: "Consumer Data Products", count: products.filter((p) => p.product_type === "CONSUMER_ALIGNED").length, color: "#22c55e", desc: "Purpose-built for specific audiences and use cases — board-ready dashboards, churn prediction features, demand forecasting APIs, and self-serve analytics for business teams.", icon: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" },
          ].map((layer) => (
            <div key={layer.label} className="card-block text-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 mx-auto mb-3" fill={layer.color} opacity={0.7}>
                <path d={layer.icon} />
              </svg>
              <div className="text-3xl font-black mb-1" style={{ color: layer.color }}>{layer.count}</div>
              <div className="text-[14px] font-bold text-mesh-text mb-2">{layer.label}</div>
              <p className="text-[13px] text-mesh-text-muted leading-[1.6]">{layer.desc}</p>
            </div>
          ))}
        </div>

        {/* Architecture diagram */}
        <h3 className="text-[17px] font-bold text-mesh-text mt-12 mb-3">Platform Architecture</h3>
        <p className="text-[15px] text-mesh-text-muted leading-[1.8] mb-8">
          Orange Co&apos;s data mesh runs on a four-stage architecture. Source systems (SaaS, ERPs,
          streaming, databases) feed into a managed ingestion layer. All {products.length} data products
          land in a <strong className="text-mesh-text">Cloud Warehouse</strong> organized into Source,
          Business, and Consumer layers — with environment isolation across dev, pre-prod, and production.
          A self-serve platform provides transformation, orchestration, quality monitoring, and CI/CD
          so domain teams ship data products independently. Federated governance enforces security,
          lineage, and data contracts across the entire mesh.
        </p>
        <ArchitectureDiagram products={products} />

        {/* Governance bar */}
        <h3 className="text-[17px] font-bold text-mesh-text mt-12 mb-3">Federated Governance</h3>
        <p className="text-[15px] text-mesh-text-muted leading-[1.8] mb-6">
          Governance in a mesh is not a gate — it is a set of computational policies baked into the platform.
          Domain teams retain autonomy over their data models, but agree to global standards for interoperability,
          security, and quality. As Fowler puts it: the governance group maintains an <em>equilibrium between
          centralization and decentralization</em>.
        </p>
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "RBAC", path: "M12 2a5 5 0 015 5v2a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9a2 2 0 012-2V7a5 5 0 015-5zm3 7V7a3 3 0 10-6 0v2h6z", desc: "Row & column security per role and environment" },
              { label: "PII Masking", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", desc: "Automatic masking of sensitive fields" },
              { label: "Retention", path: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm1-13h-2v6l5.25 3.15.75-1.23-4-2.42V7z", desc: "Time-based archival policies per data class" },
              { label: "Regulation", path: "M12 3L2 8v4c0 5.55 3.84 10.74 10 12 6.16-1.26 10-6.45 10-12V8L12 3zm-1 15l-4-4 1.41-1.41L11 15.17l6.59-6.59L19 10l-8 8z", desc: "SOX, GDPR, CCPA — audit trails and consent" },
              { label: "Quality", path: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z", desc: "Freshness SLAs, uniqueness, referential integrity" },
              { label: "Lineage", path: "M4 6h2v12H4V6zm14 0h2v12h-2V6zM11 4h2v16h-2V4zM7 9h10v2H7V9zm0 4h10v2H7v-2z", desc: "Source-to-consumer tracking with impact analysis" },
            ].map((g) => (
              <div key={g.label} className="p-5 text-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto mb-2" fill="#f472b6" opacity="0.8">
                  <path d={g.path} />
                </svg>
                <div className="text-[13px] font-bold text-mesh-text mb-1">{g.label}</div>
                <p className="text-[12px] text-mesh-text-muted leading-[1.6]">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 5 — ABOUT MESHLENS                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 section-gap">
        <SectionHeading number="4">Introducing MeshLens</SectionHeading>

        <div className="space-y-5 text-[16px] text-mesh-text-muted leading-[1.9] mb-12">
          <p>
            A data mesh at enterprise scale is a living system. Domains evolve, data products multiply,
            consumers shift, pipelines change, and quality can drift. Static wikis and slide decks
            quickly fall behind.
          </p>
          <p>
            MeshLens turns enterprise mesh metadata into an interactive data ecosystem map — connecting
            domains, applications, data products, lineage, quality, cost, and operational health in one
            navigable view. Built as a visualization layer on top of mesh metadata, MeshLens helps teams
            make the ecosystem easier to explore, measure, and communicate — from CTO-level architecture
            reviews to day-to-day analysis by data product owners, platform teams, and analysts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {[
            {
              href: "/meshatlas", label: "MeshAtlas", title: "The Living Mesh", bg: "#a8d4f5",
              icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
              desc: "Navigate the entire data mesh as an interactive, living map. See how domains connect, which pipelines are healthy, where data flows — and why this architecture matters. An interactive experience that turns complexity into clarity.",
            },
            {
              href: "/semantic", label: "Semantic Layer", title: "The Blueprint", bg: "#b8e6c8",
              icon: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-3-7H9v-2h6v2zm0 4H9v-2h6v2z",
              desc: "A reference schema design showing how to structure a mesh from ERD to materialized views. Use it as a starting point — adapt the data models, naming conventions, and layer boundaries to fit your own enterprise.",
            },
          ].map((v) => (
            <Link key={v.href} href={v.href}
              className="group card-colored" style={{ backgroundColor: v.bg }}>
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#1a1a1a" opacity={0.7}><path d={v.icon} /></svg>
                <span className="text-[15px] uppercase tracking-[0.08em] font-bold text-mesh-text/82">{v.label}</span>
              </div>
              <div className="text-[15px] font-semibold text-mesh-text/85 mb-3">{v.title}</div>
              <p className="text-[14px] text-mesh-text/65 leading-[1.7] mb-5">{v.desc}</p>
              <div className="flex items-center gap-2 text-[14px] font-bold text-mesh-text">
                Explore
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>

      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* SVG DIAGRAMS                                          */
/* ═══════════════════════════════════════════════════════ */

function CentralTeamDiagram() {
  const cx = 260;
  const cy = 190;
  const outerR = 140;
  const nodeR = 28;
  const nodes = [
    { label: "Sales",        angle: -90 },
    { label: "Finance",      angle: -38.6 },
    { label: "Supply Chain", angle: 12.9 },
    { label: "Marketing",    angle: 64.3 },
    { label: "Product",      angle: 115.7 },
    { label: "HR",           angle: 167.1 },
    { label: "Support",      angle: 218.6 },
  ].map((n) => {
    const rad = (n.angle * Math.PI) / 180;
    return { ...n, x: cx + outerR * Math.cos(rad), y: cy + outerR * Math.sin(rad) };
  });

  return (
    <svg viewBox="0 0 520 400" className="w-full max-w-[500px]" fill="none">
      {nodes.map((n) => (
        <line key={n.label} x1={n.x} y1={n.y} x2={cx} y2={cy} stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
      ))}

      <circle cx={cx} cy={cy} r="48" fill="#fff5f5" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3" opacity="0.8" />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#ef4444" fontWeight="700" style={{ fontSize: 14 }}>CENTRAL</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#ef4444" fontWeight="700" style={{ fontSize: 14 }}>DATA TEAM</text>

      <rect x={cx - 48} y={cy - 72} width="96" height="20" rx="10" fill="#ef4444" opacity="0.12" />
      <text x={cx} y={cy - 58} textAnchor="middle" fill="#ef4444" fontWeight="700" style={{ fontSize: 10, letterSpacing: "0.12em" }}>BOTTLENECK</text>

      {nodes.map((n) => {
        const icon = DOMAIN_ICONS[n.label];
        return (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r={nodeR} fill="#ffffff" stroke="#ef4444" strokeWidth="2" opacity="0.8" />
            {icon && (
              <g transform={`translate(${n.x - 12}, ${n.y - 12}) scale(1)`}>
                <path d={icon.path} fill="#ef4444" opacity="0.7" />
              </g>
            )}
            <text x={n.x} y={n.y + nodeR + 16} textAnchor="middle" fill="#1e293b" fontWeight="600" style={{ fontSize: 12 }}>
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MeshDiagram({ domains }: { domains: Domain[] }) {
  const cx = 260;
  const cy = 190;
  const outerR = 140;
  const nodeR = 28;

  const domainLabels = ["Sales", "Finance", "Supply Chain", "Marketing", "Product", "HR", "Support"];
  const step = 360 / 7;

  const nodes = domainLabels.map((label, i) => {
    const angle = -90 + i * step;
    const rad = (angle * Math.PI) / 180;
    const d = domains.find((dm) => dm.domain_name === label);
    return {
      label,
      x: cx + outerR * Math.cos(rad),
      y: cy + outerR * Math.sin(rad),
      color: d?.color_hex ?? "#94a3b8",
    };
  });

  const lines: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
    [0, 3], [1, 4], [2, 5], [3, 6],
  ];

  return (
    <svg viewBox="0 0 520 400" className="w-full max-w-[500px]" fill="none">
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="#22c55e" strokeWidth="1.5" opacity="0.4"
        />
      ))}

      <circle cx={cx} cy={cy} r="70" fill="#22c55e" fillOpacity="0.06" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 3" opacity="0.7" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#22c55e" fontWeight="700" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
        SELF-SERVE DATA
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" fill="#22c55e" fontWeight="700" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
        PLATFORM
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill="#22c55e" fontWeight="700" style={{ fontSize: 9, letterSpacing: "0.06em" }}>
        FEDERATED GOVERNANCE
      </text>

      {nodes.map((n) => {
        const icon = DOMAIN_ICONS[n.label];
        return (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r={nodeR} fill="#ffffff" stroke={n.color} strokeWidth="2" />
            {icon && (
              <g transform={`translate(${n.x - 12}, ${n.y - 12}) scale(1)`}>
                <path d={icon.path} fill={n.color} opacity="0.85" />
              </g>
            )}
            <text x={n.x} y={n.y + nodeR + 16} textAnchor="middle" fill="#1e293b" fontWeight="600" style={{ fontSize: 12 }}>
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ArchitectureDiagram({ products }: { products: Product[] }) {
  const srcCount = products.filter((p) => p.product_type === "SOURCE_ALIGNED").length;
  const bizCount = products.filter((p) => p.product_type === "BUSINESS").length;
  const conCount = products.filter((p) => p.product_type === "CONSUMER_ALIGNED").length;
  const total = srcCount + bizCount + conCount;

  const W = 920;
  const pad = 24;
  const arrowGap = 28;

  const srcBox = { x: pad, w: 135 };
  const ingBox = { x: srcBox.x + srcBox.w + arrowGap, w: 135 };
  const sfBox = { x: ingBox.x + ingBox.w + arrowGap, w: 340 };
  const conBox = { x: sfBox.x + sfBox.w + arrowGap, w: 135 };

  const flowY = 24;
  const flowBoxH = 185;
  const toolY = flowY + flowBoxH + 32;
  const toolH = 62;
  const govY = toolY + toolH + 16;
  const govH = 38;
  const totalH = govY + govH + pad;

  const itemH = 22;
  const itemGap = 5;
  const headerH = 34;

  const sources = [
    { name: "SaaS Apps", icon: "M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" },
    { name: "ERP Systems", icon: "M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z" },
    { name: "Kafka Streams", icon: "M7 5h10v2H7V5zm0 4h10v2H7V9zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" },
    { name: "Databases", icon: "M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2z" },
    { name: "APIs & Webhooks", icon: "M14 12l-2 2-2-2 2-2 2 2zm-2-6l2.12 2.12 2.5-2.5L12 1 7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12-2.5-2.5L1 12l4.62 4.62 2.5-2.5L6 12zm12 0l-2.12 2.12 2.5 2.5L23 12l-4.62-4.62-2.5 2.5L18 12zm-6 6l-2.12-2.12-2.5 2.5L12 23l4.62-4.62-2.5-2.5L12 18z" },
  ];
  const ingestion = [
    { name: "SaaS ELT Tools", icon: "M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" },
    { name: "Event Streaming", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" },
    { name: "Batch Loaders", icon: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" },
    { name: "Custom EL", icon: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" },
  ];
  const consumers = [
    { name: "MeshLens", icon: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" },
    { name: "BI Dashboards", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
    { name: "ML Models", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm-1 4h2v2h-2V6zm3 10H9v-2h2v-3H9V9h4v5h2v2z" },
    { name: "Data APIs", icon: "M14 12l-2 2-2-2 2-2 2 2zm-2-6l2.12 2.12 2.5-2.5L12 1 7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12-2.5-2.5L1 12l4.62 4.62 2.5-2.5L6 12zm12 0l-2.12 2.12 2.5 2.5L23 12l-4.62-4.62-2.5 2.5L18 12zm-6 6l-2.12-2.12-2.5 2.5L12 23l4.62-4.62-2.5-2.5L12 18z" },
  ];

  const dpLayers = [
    { label: "Source Data Products", count: srcCount, color: "#c2702e" },
    { label: "Business Data Products", count: bizCount, color: "#eab308" },
    { label: "Consumer Data Products", count: conCount, color: "#22c55e" },
  ];

  const envs = [
    { label: "DEV", color: "#94a3b8" },
    { label: "PRE-PROD", color: "#eab308" },
    { label: "PROD", color: "#22c55e" },
  ];

  const tools = [
    { label: "Transformation", desc: "Model & Test", color: "#ff694a" },
    { label: "Orchestration", desc: "Schedule & Run", color: "#00c7d4" },
    { label: "Version Control", desc: "Track & Review", color: "#1e293b" },
    { label: "CI/CD", desc: "Build & Deploy", color: "#eab308" },
    { label: "Data Quality", desc: "Monitor & Alert", color: "#22c55e" },
    { label: "Observability", desc: "Trace & Debug", color: "#a78bfa" },
  ];

  const govItems = ["RBAC", "PII Masking", "Retention", "Regulation", "Quality", "Lineage"];

  const renderBox = (x: number, w: number, label: string, color: string, items: { name: string; icon: string }[]) => {
    const boxH = flowBoxH;
    return (
      <g>
        <rect x={x} y={flowY} width={w} height={boxH} rx="12" fill={`${color}15`} stroke={`${color}50`} strokeWidth="1.2" />
        <text x={x + w / 2} y={flowY + 22} textAnchor="middle" fill={color} fontWeight="700"
          style={{ fontSize: 11, letterSpacing: "0.06em" }}>{label.toUpperCase()}</text>
        {items.map((item, i) => {
          const iy = flowY + headerH + i * (itemH + itemGap);
          const iconSize = 12;
          const iconX = x + 16;
          const iconY = iy + (itemH - iconSize) / 2;
          return (
            <g key={item.name}>
              <rect x={x + 10} y={iy} width={w - 20} height={itemH} rx="6"
                fill={`${color}18`} stroke={`${color}30`} strokeWidth="0.8" />
              <g transform={`translate(${iconX},${iconY}) scale(${iconSize / 24})`}>
                <path d={item.icon} fill={color} opacity="0.7" />
              </g>
              <text x={x + 32} y={iy + 14} fill="#1e293b" style={{ fontSize: 10 }}>{item.name}</text>
            </g>
          );
        })}
      </g>
    );
  };

  const renderArrow = (x1: number, x2: number) => {
    const y = flowY + flowBoxH / 2;
    return (
      <line x1={x1} y1={y} x2={x2} y2={y}
        stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4"
        markerEnd="url(#arch-arrow)" className="arch-flow" opacity="0.6" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-mesh-border p-8 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${totalH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arch-arrow" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <path d="M0,0 L7,2.5 L0,5" fill="#94a3b8" opacity="0.6" />
          </marker>
        </defs>
        <style>{`@keyframes archFlow{0%{stroke-dashoffset:18}100%{stroke-dashoffset:0}}.arch-flow{animation:archFlow 1.5s linear infinite}`}</style>

        {/* Sources */}
        {renderBox(srcBox.x, srcBox.w, "Sources", "#94a3b8", sources)}

        {/* Arrow: Sources → Ingestion */}
        {renderArrow(srcBox.x + srcBox.w + 4, ingBox.x - 4)}

        {/* Ingestion */}
        {renderBox(ingBox.x, ingBox.w, "Ingestion", "#e76f51", ingestion)}

        {/* Arrow: Ingestion → Snowflake */}
        {renderArrow(ingBox.x + ingBox.w + 4, sfBox.x - 4)}

        {/* ── Snowflake: the big box containing Data Products ── */}
        <rect x={sfBox.x} y={flowY} width={sfBox.w} height={flowBoxH}
          rx="12" fill="#29b5e812" stroke="#29b5e860" strokeWidth="1.5" />

        {/* Snowflake header */}
        <text x={sfBox.x + sfBox.w / 2} y={flowY + 20} textAnchor="middle"
          fill="#29b5e8" fontWeight="700" style={{ fontSize: 12, letterSpacing: "0.06em" }}>
          CLOUD WAREHOUSE — ENTERPRISE DATA MESH
        </text>

        {/* Environment badges */}
        {envs.map((env, i) => {
          const ex = sfBox.x + 16 + i * 62;
          return (
            <g key={env.label}>
              <rect x={ex} y={flowY + 28} width={52} height={16} rx="8"
                fill={`${env.color}25`} stroke={`${env.color}50`} strokeWidth="0.8" />
              <text x={ex + 26} y={flowY + 39} textAnchor="middle"
                fill={env.color} style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.08em" }}>{env.label}</text>
            </g>
          );
        })}

        {/* Multi-tenant badge */}
        <text x={sfBox.x + sfBox.w - 16} y={flowY + 40} textAnchor="end"
          fill="#29b5e8" opacity="0.5" style={{ fontSize: 8, letterSpacing: "0.05em" }}>MULTI-TENANT</text>

        {/* Data product layers inside Snowflake */}
        {dpLayers.map((layer, li) => {
          const lx = sfBox.x + 16;
          const lw = sfBox.w - 32;
          const ly = flowY + 52 + li * 40;
          const lh = 34;
          return (
            <g key={layer.label}>
              <rect x={lx} y={ly} width={lw} height={lh} rx="7"
                fill={`${layer.color}18`} stroke={`${layer.color}40`} strokeWidth="1" />
              <text x={lx + 14} y={ly + lh / 2 + 4} fill={layer.color} fontWeight="700"
                style={{ fontSize: 10 }}>{layer.label}</text>
              <text x={lx + lw - 14} y={ly + lh / 2 + 4} textAnchor="end"
                fill="#1e293b" opacity="0.5" style={{ fontSize: 10 }}>{layer.count} products</text>

              {/* Flow arrows between layers */}
              {li < dpLayers.length - 1 && (
                <line x1={lx + lw / 2} y1={ly + lh + 1}
                  x2={lx + lw / 2} y2={ly + lh + 5}
                  stroke="#94a3b8" strokeWidth="0.8" opacity="0.4" markerEnd="url(#arch-arrow)" />
              )}
            </g>
          );
        })}

        {/* Total badge */}
        <text x={sfBox.x + sfBox.w / 2} y={flowY + flowBoxH - 8} textAnchor="middle"
          fill="#29b5e8" opacity="0.6" style={{ fontSize: 9, fontWeight: 600 }}>
          {total} Data Products
        </text>

        {/* Arrow: Snowflake → Consumers */}
        {renderArrow(sfBox.x + sfBox.w + 4, conBox.x - 4)}

        {/* Consumers */}
        {renderBox(conBox.x, conBox.w, "Consumers", "#a78bfa", consumers)}

        {/* ── Enabling Tools ── */}
        <rect x={pad} y={toolY} width={W - pad * 2} height={toolH}
          rx="10" fill="#a78bfa08" stroke="#a78bfa25" strokeWidth="0.8" strokeDasharray="5 3" />
        <text x={W / 2} y={toolY + 16} textAnchor="middle" fill="#a78bfa" opacity="0.7" fontWeight="700"
          style={{ fontSize: 9, letterSpacing: "0.15em" }}>SELF-SERVE DATA PLATFORM</text>

        {(() => {
          const tw = 112;
          const totalToolsW = tools.length * tw + (tools.length - 1) * 10;
          const startX = pad + (W - pad * 2 - totalToolsW) / 2;
          return tools.map((t, i) => {
            const tx = startX + i * (tw + 10);
            return (
              <g key={t.label}>
                <rect x={tx} y={toolY + 26} width={tw} height={26} rx="6"
                  fill={`${t.color}18`} stroke={`${t.color}35`} strokeWidth="0.8" />
                <text x={tx + tw / 2} y={toolY + 42} textAnchor="middle"
                  fill={t.color} fontWeight="600" style={{ fontSize: 10 }}>{t.label}</text>
              </g>
            );
          });
        })()}

        {/* ── Federated Governance ── */}
        <rect x={pad} y={govY} width={W - pad * 2} height={govH}
          rx="10" fill="#f472b612" stroke="#f472b640" strokeWidth="1" />
        <text x={pad + 14} y={govY + govH / 2 + 4} fill="#f472b6" fontWeight="700"
          style={{ fontSize: 9, letterSpacing: "0.12em" }}>FEDERATED GOVERNANCE</text>
        {govItems.map((g, gi) => {
          const gx = 240 + gi * ((W - 280) / govItems.length);
          return (
            <text key={g} x={gx} y={govY + govH / 2 + 4} textAnchor="start"
              fill="#1e293b" opacity="0.5" style={{ fontSize: 9 }}>{g}</text>
          );
        })}
      </svg>
    </div>
  );
}
