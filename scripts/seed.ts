import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "db", "mesh_metadata.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function uid() { return crypto.randomUUID().replace(/-/g, "").slice(0, 16); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randBetween(min: number, max: number) { return min + Math.random() * (max - min); }
const toSnake = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
function dateOffset(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// ── DOMAINS ──
const DOMAINS = [
  { id: "sales", name: "Sales", description: "Revenue generation, CRM, pipeline management, deal tracking", owner_team: "Sales Ops", color_hex: "#e76f51" },
  { id: "finance", name: "Finance", description: "Accounting, billing, financial planning & analysis, compliance", owner_team: "Finance Engineering", color_hex: "#e9c46a" },
  { id: "supply-chain", name: "Supply Chain", description: "Procurement, logistics, inventory, warehouse operations", owner_team: "Supply Chain Tech", color_hex: "#2a9d8f" },
  { id: "marketing", name: "Marketing", description: "Campaigns, attribution, content, brand analytics, growth", owner_team: "Marketing Analytics", color_hex: "#a78bfa" },
  { id: "product", name: "Product", description: "Product analytics, feature flags, experimentation, observability", owner_team: "Product Engineering", color_hex: "#60a5fa" },
  { id: "hr", name: "HR", description: "People analytics, recruiting, compensation, HRIS, engagement", owner_team: "People Analytics", color_hex: "#f472b6" },
  { id: "support", name: "Support", description: "Customer support, ticketing, knowledge base, CSAT", owner_team: "Support Engineering", color_hex: "#f97316" },
];

// ── 55 APPLICATIONS ──
const APPS = [
  // Sales (10)
  { name: "Salesforce", app_type: "SaaS", domain_id: "sales", vendor: "Salesforce", description: "Primary CRM — opportunities, accounts, contacts, leads" },
  { name: "HubSpot", app_type: "SaaS", domain_id: "sales", vendor: "HubSpot", description: "Inbound sales CRM & marketing hub" },
  { name: "Gong", app_type: "SaaS", domain_id: "sales", vendor: "Gong.io", description: "Revenue intelligence — call recordings, deal risk scoring" },
  { name: "Outreach", app_type: "SaaS", domain_id: "sales", vendor: "Outreach", description: "Sales engagement sequences & cadences" },
  { name: "Clari", app_type: "SaaS", domain_id: "sales", vendor: "Clari", description: "Revenue operations & forecast intelligence" },
  { name: "ZoomInfo", app_type: "API", domain_id: "sales", vendor: "ZoomInfo", description: "B2B contact & company enrichment" },
  { name: "Salesloft", app_type: "SaaS", domain_id: "sales", vendor: "Salesloft", description: "Sales engagement analytics" },
  { name: "CPQ (Salesforce)", app_type: "SaaS", domain_id: "sales", vendor: "Salesforce", description: "Configure-price-quote for complex deals" },
  { name: "DocuSign", app_type: "SaaS", domain_id: "sales", vendor: "DocuSign", description: "Contract & e-signature management" },
  { name: "Salesforce Marketing Cloud", app_type: "SaaS", domain_id: "sales", vendor: "Salesforce", description: "B2B marketing automation tied to CRM" },
  // Finance (8)
  { name: "EBS", app_type: "SaaS", domain_id: "finance", vendor: "SAP", description: "Core ERP — GL, AP/AR, fixed assets, cost centers" },
  { name: "Oracle Financials", app_type: "SaaS", domain_id: "finance", vendor: "Oracle", description: "General ledger, intercompany, consolidation" },
  { name: "Stripe", app_type: "API", domain_id: "finance", vendor: "Stripe", description: "Payment processing — charges, refunds, disputes" },
  { name: "NetSuite", app_type: "SaaS", domain_id: "finance", vendor: "Oracle", description: "Cloud ERP — accounting & revenue recognition" },
  { name: "Coupa", app_type: "SaaS", domain_id: "finance", vendor: "Coupa", description: "Procurement & spend management" },
  { name: "Avalara", app_type: "API", domain_id: "finance", vendor: "Avalara", description: "Tax compliance automation (sales tax, VAT)" },
  { name: "Zuora", app_type: "SaaS", domain_id: "finance", vendor: "Zuora", description: "Subscription billing & ASC 606 revenue recognition" },
  { name: "Anaplan", app_type: "SaaS", domain_id: "finance", vendor: "Anaplan", description: "Financial planning, budgeting, forecasting" },
  // Supply Chain (8)
  { name: "SAP SCM", app_type: "SaaS", domain_id: "supply-chain", vendor: "SAP", description: "Supply chain planning, MRP, demand forecasting" },
  { name: "Kinaxis", app_type: "SaaS", domain_id: "supply-chain", vendor: "Kinaxis", description: "Supply chain planning & S&OP orchestration" },
  { name: "Manhattan WMS", app_type: "SaaS", domain_id: "supply-chain", vendor: "Manhattan Associates", description: "Warehouse management — pick/pack/ship" },
  { name: "FourKites", app_type: "API", domain_id: "supply-chain", vendor: "FourKites", description: "Real-time transportation visibility & ETAs" },
  { name: "Oracle SCM Cloud", app_type: "SaaS", domain_id: "supply-chain", vendor: "Oracle", description: "Cloud procurement & order management" },
  { name: "Kafka — Inventory Events", app_type: "Streaming", domain_id: "supply-chain", vendor: "Confluent", description: "Real-time inventory movement events (50K msgs/sec)" },
  { name: "Kafka — Order Events", app_type: "Streaming", domain_id: "supply-chain", vendor: "Confluent", description: "Real-time order placement & fulfillment events" },
  { name: "ShipStation", app_type: "SaaS", domain_id: "supply-chain", vendor: "ShipStation", description: "Multi-carrier shipping & order fulfillment" },
  // Marketing (9)
  { name: "Google Ads", app_type: "API", domain_id: "marketing", vendor: "Google", description: "Paid search — campaigns, ad groups, keywords" },
  { name: "Meta Ads", app_type: "API", domain_id: "marketing", vendor: "Meta", description: "Social advertising — campaigns, audiences, conversions" },
  { name: "LinkedIn Ads", app_type: "API", domain_id: "marketing", vendor: "LinkedIn", description: "B2B advertising — account targeting, lead gen forms" },
  { name: "Marketo", app_type: "SaaS", domain_id: "marketing", vendor: "Adobe", description: "Marketing automation — lead scoring, nurture programs" },
  { name: "Segment", app_type: "Streaming", domain_id: "marketing", vendor: "Twilio", description: "Customer data platform — event collection & routing" },
  { name: "Google Analytics 4", app_type: "SaaS", domain_id: "marketing", vendor: "Google", description: "Web & app analytics — sessions, conversions, attribution" },
  { name: "Braze", app_type: "SaaS", domain_id: "marketing", vendor: "Braze", description: "Cross-channel messaging — push, email, in-app" },
  { name: "Contentful", app_type: "SaaS", domain_id: "marketing", vendor: "Contentful", description: "Headless CMS for content operations" },
  { name: "Iterable", app_type: "SaaS", domain_id: "marketing", vendor: "Iterable", description: "Lifecycle marketing & experimentation" },
  // Product (9)
  { name: "Jira", app_type: "SaaS", domain_id: "product", vendor: "Atlassian", description: "Issue tracking — sprints, epics, velocity" },
  { name: "GitHub", app_type: "SaaS", domain_id: "product", vendor: "GitHub", description: "Source control — PRs, deployments, code review" },
  { name: "LaunchDarkly", app_type: "API", domain_id: "product", vendor: "LaunchDarkly", description: "Feature flags — rollout %, targeting rules" },
  { name: "Amplitude", app_type: "SaaS", domain_id: "product", vendor: "Amplitude", description: "Product analytics — funnels, cohorts, retention" },
  { name: "Pendo", app_type: "SaaS", domain_id: "product", vendor: "Pendo", description: "Product experience — guides, NPS, feature usage" },
  { name: "PagerDuty", app_type: "API", domain_id: "product", vendor: "PagerDuty", description: "Incident management — alerts, on-call, escalation" },
  { name: "Datadog", app_type: "API", domain_id: "product", vendor: "Datadog", description: "Infrastructure monitoring — APM, logs, traces" },
  { name: "Kafka — Clickstream", app_type: "Streaming", domain_id: "product", vendor: "Confluent", description: "Real-time user clickstream (200K events/sec)" },
  { name: "PostgreSQL — App DB", app_type: "Database", domain_id: "product", vendor: "PostgreSQL", description: "Primary application database — users, tenants, subscriptions" },
  // HR (6)
  { name: "Workday", app_type: "SaaS", domain_id: "hr", vendor: "Workday", description: "Core HRIS — org structure, compensation, payroll" },
  { name: "Greenhouse", app_type: "SaaS", domain_id: "hr", vendor: "Greenhouse", description: "Recruiting ATS — requisitions, candidates, scorecards" },
  { name: "Lattice", app_type: "SaaS", domain_id: "hr", vendor: "Lattice", description: "Performance management — reviews, goals, 1:1s" },
  { name: "Deel", app_type: "SaaS", domain_id: "hr", vendor: "Deel", description: "Global payroll & contractor management" },
  { name: "Culture Amp", app_type: "SaaS", domain_id: "hr", vendor: "Culture Amp", description: "Employee engagement surveys & pulse checks" },
  { name: "BambooHR", app_type: "SaaS", domain_id: "hr", vendor: "BambooHR", description: "HR management — PTO, onboarding, employee records" },
  // Support (5)
  { name: "Zendesk", app_type: "SaaS", domain_id: "support", vendor: "Zendesk", description: "Help desk — tickets, agents, SLA tracking, macros" },
  { name: "Intercom", app_type: "SaaS", domain_id: "support", vendor: "Intercom", description: "Live chat, product tours, knowledge base articles" },
  { name: "Statuspage", app_type: "SaaS", domain_id: "support", vendor: "Atlassian", description: "Public status page — incidents, components, uptime" },
  { name: "Confluence", app_type: "SaaS", domain_id: "support", vendor: "Atlassian", description: "Internal knowledge base, runbooks, support playbooks" },
  { name: "SurveyMonkey", app_type: "SaaS", domain_id: "support", vendor: "Momentive", description: "CSAT and NPS post-interaction surveys" },
];

// ── DATA PRODUCTS — Three Types ──
// SOURCE_ALIGNED: Direct mirror of source app, minimal transformation
// BUSINESS: Combines multiple sources into domain-specific business entities
// CONSUMER_ALIGNED: Purpose-built for a specific use case (dashboard, ML, API)

const DATA_PRODUCTS = [
  // ── SOURCE-ALIGNED (one per major app family) ──
  { id: "src-salesforce-raw", name: "Salesforce", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.88, sla_freshness: "< 1hr", owner: "Sales Ops", description: "Raw Salesforce objects: Opportunity, Account, Contact, Lead, Task, Event" },
  { id: "src-hubspot-raw", name: "HubSpot", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.85, sla_freshness: "< 1hr", owner: "Sales Ops", description: "HubSpot contacts, companies, deals, engagements" },
  { id: "src-sap-raw", name: "EBS", domain_id: "finance", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.92, sla_freshness: "< 6hr", owner: "Finance Engineering", description: "SAP GL entries, AP/AR transactions, cost centers, journals" },
  { id: "src-stripe-raw", name: "Stripe", domain_id: "finance", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.95, sla_freshness: "< 15min", owner: "Finance Engineering", description: "Stripe charges, refunds, disputes, subscriptions, invoices" },
  { id: "src-netsuite-raw", name: "NetSuite", domain_id: "finance", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.87, sla_freshness: "< 6hr", owner: "Finance Engineering", description: "NetSuite transactions, accounts, vendors, revenue schedules" },
  { id: "src-kafka-inventory", name: "Inventory Events Stream", domain_id: "supply-chain", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.91, sla_freshness: "< 5min", owner: "Supply Chain Tech", description: "Real-time inventory movements: receipts, transfers, adjustments" },
  { id: "src-kafka-orders", name: "Order Events Stream", domain_id: "supply-chain", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.93, sla_freshness: "< 5min", owner: "Supply Chain Tech", description: "Order lifecycle events: created, confirmed, shipped, delivered" },
  { id: "src-wms-raw", name: "Manhattan WMS", domain_id: "supply-chain", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.84, sla_freshness: "< 1hr", owner: "Supply Chain Tech", description: "Manhattan WMS: picks, packs, shipments, warehouse zones" },
  { id: "src-google-ads", name: "Google Ads", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.90, sla_freshness: "< 6hr", owner: "Marketing Analytics", description: "Google Ads: campaigns, ad groups, keywords, conversions" },
  { id: "src-meta-ads", name: "Meta Ads", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.88, sla_freshness: "< 6hr", owner: "Marketing Analytics", description: "Meta Ads: campaigns, audiences, ad sets, conversions" },
  { id: "src-segment-events", name: "Segment Events Stream", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.86, sla_freshness: "< 15min", owner: "Marketing Analytics", description: "Segment: track, identify, page, screen events" },
  { id: "src-amplitude-raw", name: "Amplitude", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.89, sla_freshness: "< 1hr", owner: "Product Analytics", description: "Amplitude events: user actions, properties, sessions" },
  { id: "src-clickstream", name: "Clickstream Events", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.87, sla_freshness: "< 5min", owner: "Product Engineering", description: "Raw clickstream: page views, clicks, scrolls, form interactions" },
  { id: "src-github-raw", name: "GitHub", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.94, sla_freshness: "< 1hr", owner: "Engineering", description: "GitHub: PRs, commits, reviews, deployments, actions" },
  { id: "src-jira-raw", name: "Jira", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.91, sla_freshness: "< 1hr", owner: "Engineering", description: "Jira: issues, sprints, boards, worklogs, transitions" },
  { id: "src-pagerduty-raw", name: "PagerDuty", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.93, sla_freshness: "< 15min", owner: "SRE", description: "PagerDuty: incidents, alerts, on-call schedules" },
  { id: "src-workday-raw", name: "Workday", domain_id: "hr", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.90, sla_freshness: "< 24hr", owner: "People Analytics", description: "Workday: employees, positions, comp, org hierarchy" },
  { id: "src-greenhouse-raw", name: "Greenhouse", domain_id: "hr", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.86, sla_freshness: "< 24hr", owner: "Talent Acquisition", description: "Greenhouse: applications, candidates, interviews, offers" },
  // Sales (8 missing)
  { id: "src-gong-raw", name: "Gong", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.87, sla_freshness: "< 1hr", owner: "Sales Ops", description: "Gong call recordings, transcripts, deal engagement scores" },
  { id: "src-outreach-raw", name: "Outreach", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.84, sla_freshness: "< 6hr", owner: "Sales Ops", description: "Outreach sequences, tasks, mailbox activities, meeting events" },
  { id: "src-clari-raw", name: "Clari", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.82, sla_freshness: "< 6hr", owner: "Rev Ops", description: "Clari pipeline snapshots, forecast submissions, deal scores" },
  { id: "src-zoominfo-raw", name: "ZoomInfo", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.86, sla_freshness: "< 24hr", owner: "Sales Ops", description: "ZoomInfo contacts, companies, intent signals, technographics" },
  { id: "src-salesloft-raw", name: "Salesloft", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.83, sla_freshness: "< 6hr", owner: "Sales Ops", description: "Salesloft cadences, steps, email metrics, call logs" },
  { id: "src-cpq-raw", name: "CPQ", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.85, sla_freshness: "< 6hr", owner: "Sales Ops", description: "CPQ quotes, line items, discount approvals, product bundles" },
  { id: "src-docusign-raw", name: "DocuSign", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.90, sla_freshness: "< 1hr", owner: "Sales Ops", description: "DocuSign envelopes, signatures, completion events, audit trails" },
  { id: "src-sfmc-raw", name: "SF Marketing Cloud", domain_id: "sales", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.84, sla_freshness: "< 6hr", owner: "Sales Ops", description: "SFMC email sends, opens, clicks, journey events" },
  // Finance (5 missing)
  { id: "src-oracle-fin-raw", name: "Oracle Financials", domain_id: "finance", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.91, sla_freshness: "< 6hr", owner: "Finance Engineering", description: "Oracle GL journals, intercompany transactions, consolidation data" },
  { id: "src-coupa-raw", name: "Coupa", domain_id: "finance", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.85, sla_freshness: "< 24hr", owner: "FP&A", description: "Coupa purchase orders, requisitions, invoices, supplier data" },
  { id: "src-avalara-raw", name: "Avalara", domain_id: "finance", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.88, sla_freshness: "< 1hr", owner: "Finance Engineering", description: "Avalara tax calculations, exemptions, jurisdiction mappings" },
  { id: "src-zuora-raw", name: "Zuora", domain_id: "finance", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.90, sla_freshness: "< 1hr", owner: "Finance Engineering", description: "Zuora subscriptions, invoices, payments, usage records" },
  { id: "src-anaplan-raw", name: "Anaplan", domain_id: "finance", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.83, sla_freshness: "< 24hr", owner: "FP&A", description: "Anaplan model data, planning scenarios, budget submissions" },
  // Supply Chain (5 missing)
  { id: "src-sap-scm-raw", name: "SAP SCM", domain_id: "supply-chain", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.89, sla_freshness: "< 6hr", owner: "Supply Chain Tech", description: "SAP SCM purchase orders, MRP results, vendor schedules" },
  { id: "src-kinaxis-raw", name: "Kinaxis", domain_id: "supply-chain", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.85, sla_freshness: "< 6hr", owner: "Supply Chain Tech", description: "Kinaxis demand plans, supply scenarios, S&OP snapshots" },
  { id: "src-oracle-scm-raw", name: "Oracle SCM", domain_id: "supply-chain", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.86, sla_freshness: "< 6hr", owner: "Supply Chain Tech", description: "Oracle SCM orders, procurement, receiving, returns" },
  { id: "src-fourkites-raw", name: "FourKites", domain_id: "supply-chain", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.88, sla_freshness: "< 15min", owner: "Supply Chain Tech", description: "FourKites shipment tracking, ETA predictions, carrier data" },
  { id: "src-shipstation-raw", name: "ShipStation", domain_id: "supply-chain", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.87, sla_freshness: "< 1hr", owner: "Supply Chain Tech", description: "ShipStation labels, carrier rates, tracking events, returns" },
  // Marketing (6 missing)
  { id: "src-linkedin-ads-raw", name: "LinkedIn Ads", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.85, sla_freshness: "< 6hr", owner: "Marketing Analytics", description: "LinkedIn campaign metrics, lead gen form submissions, audiences" },
  { id: "src-marketo-raw", name: "Marketo", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.84, sla_freshness: "< 6hr", owner: "Marketing Analytics", description: "Marketo leads, programs, email activities, scoring history" },
  { id: "src-ga4-raw", name: "GA4", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.90, sla_freshness: "< 1hr", owner: "Marketing Analytics", description: "GA4 sessions, events, conversions, user properties, attribution" },
  { id: "src-braze-raw", name: "Braze", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.86, sla_freshness: "< 1hr", owner: "Marketing Analytics", description: "Braze campaigns, canvas flows, push/email delivery, in-app messages" },
  { id: "src-contentful-raw", name: "Contentful", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.92, sla_freshness: "< 24hr", owner: "Marketing Analytics", description: "Contentful content entries, assets, content types, locales" },
  { id: "src-iterable-raw", name: "Iterable", domain_id: "marketing", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.85, sla_freshness: "< 6hr", owner: "Marketing Analytics", description: "Iterable campaigns, workflows, email/push events, user lists" },
  // Product (4 missing)
  { id: "src-launchdarkly-raw", name: "LaunchDarkly", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.89, sla_freshness: "< 15min", owner: "Engineering", description: "LaunchDarkly flag evaluations, targeting rules, experiments" },
  { id: "src-pendo-raw", name: "Pendo", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.87, sla_freshness: "< 1hr", owner: "Product Analytics", description: "Pendo feature usage, guides, NPS responses, user feedback" },
  { id: "src-datadog-raw", name: "Datadog", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.91, sla_freshness: "< 15min", owner: "SRE", description: "Datadog metrics, traces, logs, monitors, SLOs" },
  { id: "src-postgres-raw", name: "PostgreSQL", domain_id: "product", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.93, sla_freshness: "< 15min", owner: "Engineering", description: "App DB CDC: users, tenants, products, subscriptions, orders" },
  // HR (4 missing)
  { id: "src-lattice-raw", name: "Lattice", domain_id: "hr", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.85, sla_freshness: "< 24hr", owner: "People Analytics", description: "Lattice reviews, goals, OKRs, feedback, 1:1 notes" },
  { id: "src-deel-raw", name: "Deel", domain_id: "hr", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.84, sla_freshness: "< 24hr", owner: "People Analytics", description: "Deel contracts, payments, compliance docs, contractor profiles" },
  { id: "src-cultureamp-raw", name: "Culture Amp", domain_id: "hr", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.83, sla_freshness: "< 24hr", owner: "People Analytics", description: "Culture Amp survey responses, eNPS scores, action items" },
  { id: "src-bamboohr-raw", name: "BambooHR", domain_id: "hr", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.86, sla_freshness: "< 24hr", owner: "People Analytics", description: "BambooHR employee data, PTO, onboarding checklists" },
  // Support (5 new)
  { id: "src-zendesk-raw", name: "Zendesk", domain_id: "support", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.90, sla_freshness: "< 15min", owner: "Support Engineering", description: "Zendesk tickets, agents, SLA policies, macros, satisfaction ratings" },
  { id: "src-intercom-raw", name: "Intercom", domain_id: "support", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.88, sla_freshness: "< 15min", owner: "Support Engineering", description: "Intercom conversations, articles, product tours, resolution times" },
  { id: "src-statuspage-raw", name: "Statuspage", domain_id: "support", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.92, sla_freshness: "< 5min", owner: "Support Engineering", description: "Statuspage incidents, components, scheduled maintenances, metrics" },
  { id: "src-confluence-raw", name: "Confluence", domain_id: "support", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.85, sla_freshness: "< 24hr", owner: "Support Engineering", description: "Confluence pages, spaces, comments, attachment metadata" },
  { id: "src-surveymonkey-raw", name: "SurveyMonkey", domain_id: "support", product_type: "SOURCE_ALIGNED", tier: "BRONZE", quality_score: 0.87, sla_freshness: "< 24hr", owner: "Support Engineering", description: "SurveyMonkey CSAT responses, NPS scores, survey completions" },

  // ── BUSINESS PRODUCTS (combine multiple sources within/across domains) ──
  { id: "biz-customer-360", name: "Customer 360", domain_id: "sales", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.94, sla_freshness: "< 1hr", owner: "Sales Ops", description: "Unified customer profile merging CRM, product usage, support, and billing signals" },
  { id: "biz-pipeline-forecast", name: "Pipeline Forecast", domain_id: "sales", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.88, sla_freshness: "< 6hr", owner: "Rev Ops", description: "AI-scored pipeline with historical close rates and deal-stage weighting" },
  { id: "biz-account-hierarchy", name: "Account Hierarchy", domain_id: "sales", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.90, sla_freshness: "< 24hr", owner: "Sales Ops", description: "B2B account relationships, territories, and parent-child ownership structure" },
  { id: "biz-revenue-ledger", name: "Revenue Ledger", domain_id: "finance", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.97, sla_freshness: "< 24hr", owner: "Finance Engineering", description: "ASC 606 revenue recognition with ARR/MRR by segment, cohort, and product" },
  { id: "biz-spend-analytics", name: "Spend Analytics", domain_id: "finance", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.85, sla_freshness: "< 24hr", owner: "FP&A", description: "Procurement and vendor spend by category, department, and cost center" },
  { id: "biz-unit-economics", name: "Unit Economics", domain_id: "finance", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.89, sla_freshness: "< 24hr", owner: "FP&A", description: "CAC, LTV, payback period, and gross margin by customer segment and channel" },
  { id: "biz-contract-lifecycle", name: "Contract Lifecycle", domain_id: "finance", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.84, sla_freshness: "< 24hr", owner: "Finance Ops", description: "Contract status, renewal dates, obligations, and risk across legal and sales" },
  { id: "biz-order-fulfillment", name: "Order & Subscription Fulfillment", domain_id: "supply-chain", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.89, sla_freshness: "< 15min", owner: "Logistics Ops", description: "Contract-to-active provisioning, order status, and fulfillment SLA tracking" },
  { id: "biz-vendor-performance", name: "Vendor Performance", domain_id: "supply-chain", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.82, sla_freshness: "< 24hr", owner: "Supply Chain Tech", description: "Supplier scorecards, SLA adherence, delivery reliability, and spend analysis" },
  { id: "biz-campaign-perf", name: "Campaign Performance", domain_id: "marketing", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.86, sla_freshness: "< 6hr", owner: "Marketing Analytics", description: "Cross-channel campaign metrics: spend, reach, and conversion normalized" },
  { id: "biz-attribution", name: "Multi-Touch Attribution", domain_id: "marketing", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.78, sla_freshness: "< 24hr", owner: "Growth Analytics", description: "Channel contribution to pipeline and revenue across all digital touchpoints" },
  { id: "biz-product-usage", name: "Product Usage", domain_id: "product", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.92, sla_freshness: "< 1hr", owner: "Product Analytics", description: "Feature adoption, DAU/WAU/MAU, retention cohorts, and engagement scoring" },
  { id: "biz-product-catalog", name: "Product Catalog Master", domain_id: "product", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.91, sla_freshness: "< 24hr", owner: "Product Ops", description: "Unified product, offering, and SKU definitions across pricing and packaging" },
  { id: "biz-dev-velocity", name: "Dev Velocity (DORA)", domain_id: "product", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.81, sla_freshness: "< 24hr", owner: "Engineering", description: "Deployment frequency, lead time, change failure rate, and MTTR" },
  { id: "biz-incident-metrics", name: "Incident Metrics", domain_id: "product", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.87, sla_freshness: "< 15min", owner: "SRE", description: "Incident count, severity, resolution time, postmortem coverage by service" },
  { id: "biz-headcount", name: "Headcount Analytics", domain_id: "hr", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.93, sla_freshness: "< 24hr", owner: "People Analytics", description: "Active headcount, org structure, attrition rates, and diversity metrics" },
  { id: "biz-employee-lifecycle", name: "Employee Lifecycle", domain_id: "hr", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.85, sla_freshness: "< 24hr", owner: "People Analytics", description: "Hire-to-exit events, tenure, promotion velocity, and internal mobility" },
  { id: "biz-recruiting-funnel", name: "Recruiting Funnel", domain_id: "hr", product_type: "BUSINESS", tier: "SILVER", quality_score: 0.79, sla_freshness: "< 24hr", owner: "Talent Acquisition", description: "Source-to-hire funnel metrics, time-to-fill, and channel effectiveness" },
  { id: "biz-support-metrics", name: "Support Metrics", domain_id: "support", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.91, sla_freshness: "< 1hr", owner: "Support Engineering", description: "Ticket volume, resolution time, CSAT, escalation rates by segment and tier" },
  { id: "biz-customer-health", name: "Customer Health Score", domain_id: "support", product_type: "BUSINESS", tier: "GOLD", quality_score: 0.88, sla_freshness: "< 6hr", owner: "Support Engineering", description: "Composite risk and engagement score from usage, support, and billing signals" },

  // ── CONSUMER-ALIGNED (purpose-built for specific use cases) ──
  { id: "con-ceo-dashboard", name: "CEO Weekly Digest", domain_id: "finance", product_type: "CONSUMER_ALIGNED", tier: "GOLD", quality_score: 0.96, sla_freshness: "< 24hr", owner: "FP&A", description: "Curated weekly summary of revenue, ARR, pipeline, headcount, and NPS for executives" },
  { id: "con-board-deck", name: "Board Metrics", domain_id: "finance", product_type: "CONSUMER_ALIGNED", tier: "GOLD", quality_score: 0.98, sla_freshness: "< 24hr", owner: "FP&A", description: "Quarterly board-ready financial statements, cohort analysis, and unit economics" },
  { id: "con-finance-close", name: "Finance Close Package", domain_id: "finance", product_type: "CONSUMER_ALIGNED", tier: "GOLD", quality_score: 0.95, sla_freshness: "< 24hr", owner: "Accounting", description: "Month- and quarter-close metrics, accruals, and reconciliation for FP&A" },
  { id: "con-revenue-monitor", name: "Real-Time Revenue Monitor", domain_id: "finance", product_type: "CONSUMER_ALIGNED", tier: "GOLD", quality_score: 0.93, sla_freshness: "< 15min", owner: "Finance Ops", description: "Live ARR, MRR, bookings, and churn for finance operations and RevOps" },
  { id: "con-sales-leaderboard", name: "Sales Leaderboard", domain_id: "sales", product_type: "CONSUMER_ALIGNED", tier: "SILVER", quality_score: 0.91, sla_freshness: "< 1hr", owner: "Sales Ops", description: "Rep and team performance rankings, quota attainment, and activity metrics" },
  { id: "con-renewal-dashboard", name: "Contract Renewal Dashboard", domain_id: "sales", product_type: "CONSUMER_ALIGNED", tier: "GOLD", quality_score: 0.87, sla_freshness: "< 6hr", owner: "Customer Success", description: "Renewal pipeline, at-risk contracts, and expansion signals for CS and finance" },
  { id: "con-churn-model", name: "Churn Prediction Features", domain_id: "product", product_type: "CONSUMER_ALIGNED", tier: "GOLD", quality_score: 0.85, sla_freshness: "< 6hr", owner: "Data Science", description: "ML feature store with usage decline signals, billing anomalies, and support velocity" },
  { id: "con-upsell-signals", name: "Upsell & Expansion Signals", domain_id: "sales", product_type: "CONSUMER_ALIGNED", tier: "GOLD", quality_score: 0.84, sla_freshness: "< 6hr", owner: "Data Science", description: "ML features for expansion propensity based on usage growth and product adoption" },
  { id: "con-demand-forecast", name: "Demand Forecast", domain_id: "supply-chain", product_type: "CONSUMER_ALIGNED", tier: "GOLD", quality_score: 0.83, sla_freshness: "< 24hr", owner: "Supply Chain Tech", description: "14-day demand and capacity forecast by product line for procurement planning" },
  { id: "con-marketing-roi", name: "Marketing ROI Report", domain_id: "marketing", product_type: "CONSUMER_ALIGNED", tier: "SILVER", quality_score: 0.80, sla_freshness: "< 24hr", owner: "Growth Analytics", description: "Channel-level CAC, LTV:CAC ratio, and payback period for marketing leadership" },
  { id: "con-eng-health", name: "Engineering Health API", domain_id: "product", product_type: "CONSUMER_ALIGNED", tier: "SILVER", quality_score: 0.88, sla_freshness: "< 1hr", owner: "Engineering", description: "REST API serving DORA metrics and incident status to internal tools and Slack" },
  { id: "con-talent-insights", name: "Talent Insights Dashboard", domain_id: "hr", product_type: "CONSUMER_ALIGNED", tier: "SILVER", quality_score: 0.82, sla_freshness: "< 24hr", owner: "People Analytics", description: "Headcount, attrition, recruiting velocity, and diversity pipeline for HR leaders" },
  { id: "con-support-dashboard", name: "Support Ops Dashboard", domain_id: "support", product_type: "CONSUMER_ALIGNED", tier: "SILVER", quality_score: 0.86, sla_freshness: "< 1hr", owner: "Support Engineering", description: "Real-time queue depth, SLA compliance, agent performance, and CSAT trends" },
  { id: "con-vendor-risk", name: "Vendor Risk Alerts", domain_id: "supply-chain", product_type: "CONSUMER_ALIGNED", tier: "SILVER", quality_score: 0.81, sla_freshness: "< 24hr", owner: "Procurement", description: "Vendor risk scoring, contract renewal alerts, and compliance flags for procurement" },
];

// ── LINEAGE: Source → Business → Consumer ──
const LINEAGE_EDGES = [
  // Source → Business
  { source: "src-salesforce-raw", target: "biz-customer-360", type: "FEEDS", desc: "CRM accounts & contacts → unified profile" },
  { source: "src-hubspot-raw", target: "biz-customer-360", type: "FEEDS", desc: "HubSpot contacts & deals → unified profile" },
  { source: "src-amplitude-raw", target: "biz-customer-360", type: "FEEDS", desc: "Product usage enriches customer profile" },
  { source: "src-stripe-raw", target: "biz-customer-360", type: "FEEDS", desc: "Billing history & subscription status" },
  { source: "src-salesforce-raw", target: "biz-pipeline-forecast", type: "FEEDS", desc: "Pipeline opportunities → forecast model" },
  { source: "src-sap-raw", target: "biz-revenue-ledger", type: "FEEDS", desc: "GL entries → revenue recognition" },
  { source: "src-stripe-raw", target: "biz-revenue-ledger", type: "FEEDS", desc: "Stripe payments → revenue matching" },
  { source: "src-netsuite-raw", target: "biz-revenue-ledger", type: "FEEDS", desc: "NetSuite revenue schedules → ASC 606" },
  { source: "src-sap-raw", target: "biz-spend-analytics", type: "FEEDS", desc: "Cost center & vendor spend" },
  { source: "src-netsuite-raw", target: "biz-spend-analytics", type: "FEEDS", desc: "AP transactions → spend categories" },
  { source: "src-kafka-orders", target: "biz-order-fulfillment", type: "FEEDS", desc: "Order lifecycle events" },
  { source: "src-wms-raw", target: "biz-order-fulfillment", type: "FEEDS", desc: "Pick/pack/ship status" },
  { source: "src-salesforce-raw", target: "biz-account-hierarchy", type: "FEEDS", desc: "Account hierarchy & territories" },
  { source: "src-hubspot-raw", target: "biz-account-hierarchy", type: "FEEDS", desc: "Company relationships → hierarchy" },
  { source: "src-stripe-raw", target: "biz-unit-economics", type: "FEEDS", desc: "Payment data → unit economics" },
  { source: "src-salesforce-raw", target: "biz-unit-economics", type: "FEEDS", desc: "Deal data → CAC calculation" },
  { source: "src-docusign-raw", target: "biz-contract-lifecycle", type: "FEEDS", desc: "Contract status → lifecycle tracking" },
  { source: "src-salesforce-raw", target: "biz-contract-lifecycle", type: "FEEDS", desc: "Opportunity → contract linkage" },
  { source: "src-zuora-raw", target: "biz-contract-lifecycle", type: "FEEDS", desc: "Subscription terms → contract data" },
  { source: "src-coupa-raw", target: "biz-vendor-performance", type: "FEEDS", desc: "PO history → vendor scorecards" },
  { source: "src-sap-scm-raw", target: "biz-vendor-performance", type: "FEEDS", desc: "Supplier delivery → performance" },
  { source: "src-cpq-raw", target: "biz-product-catalog", type: "FEEDS", desc: "Pricing & packaging → product master" },
  { source: "src-stripe-raw", target: "biz-product-catalog", type: "FEEDS", desc: "SKUs & plans → product catalog" },
  { source: "src-workday-raw", target: "biz-employee-lifecycle", type: "FEEDS", desc: "HR events → employee lifecycle" },
  { source: "src-bamboohr-raw", target: "biz-employee-lifecycle", type: "FEEDS", desc: "Employee records → lifecycle" },
  { source: "src-lattice-raw", target: "biz-employee-lifecycle", type: "FEEDS", desc: "Reviews → promotion velocity" },
  { source: "src-google-ads", target: "biz-campaign-perf", type: "FEEDS", desc: "Google campaign metrics" },
  { source: "src-meta-ads", target: "biz-campaign-perf", type: "FEEDS", desc: "Meta campaign metrics" },
  { source: "src-segment-events", target: "biz-attribution", type: "FEEDS", desc: "User touchpoint events" },
  { source: "src-google-ads", target: "biz-attribution", type: "FEEDS", desc: "Ad click → conversion path" },
  { source: "src-amplitude-raw", target: "biz-product-usage", type: "FEEDS", desc: "Product event data" },
  { source: "src-clickstream", target: "biz-product-usage", type: "FEEDS", desc: "Raw clickstream → feature usage" },
  { source: "src-github-raw", target: "biz-dev-velocity", type: "FEEDS", desc: "PR & deploy frequency" },
  { source: "src-jira-raw", target: "biz-dev-velocity", type: "FEEDS", desc: "Issue cycle time & throughput" },
  { source: "src-pagerduty-raw", target: "biz-incident-metrics", type: "FEEDS", desc: "Incident data → MTTR" },
  { source: "src-workday-raw", target: "biz-headcount", type: "FEEDS", desc: "Employee records → headcount" },
  { source: "src-greenhouse-raw", target: "biz-recruiting-funnel", type: "FEEDS", desc: "Applicant data → funnel" },
  // New source → business
  { source: "src-gong-raw", target: "biz-customer-360", type: "FEEDS", desc: "Call sentiment → customer profile" },
  { source: "src-docusign-raw", target: "biz-customer-360", type: "FEEDS", desc: "Contract status → customer profile" },
  { source: "src-clari-raw", target: "biz-pipeline-forecast", type: "FEEDS", desc: "AI forecast → pipeline model" },
  { source: "src-zuora-raw", target: "biz-revenue-ledger", type: "FEEDS", desc: "Subscription billing → revenue" },
  { source: "src-oracle-fin-raw", target: "biz-revenue-ledger", type: "FEEDS", desc: "Oracle GL → revenue consolidation" },
  { source: "src-coupa-raw", target: "biz-spend-analytics", type: "FEEDS", desc: "PO & invoices → spend analytics" },
  { source: "src-linkedin-ads-raw", target: "biz-campaign-perf", type: "FEEDS", desc: "LinkedIn metrics → campaign performance" },
  { source: "src-marketo-raw", target: "biz-attribution", type: "FEEDS", desc: "Lead touchpoints → attribution" },
  { source: "src-ga4-raw", target: "biz-attribution", type: "FEEDS", desc: "Web sessions → attribution paths" },
  { source: "src-pendo-raw", target: "biz-product-usage", type: "FEEDS", desc: "Feature usage → product analytics" },
  { source: "src-datadog-raw", target: "biz-incident-metrics", type: "FEEDS", desc: "APM alerts → incident metrics" },
  { source: "src-lattice-raw", target: "biz-headcount", type: "FEEDS", desc: "Performance data → headcount analytics" },
  { source: "src-cultureamp-raw", target: "biz-headcount", type: "FEEDS", desc: "Engagement data → headcount analytics" },
  { source: "src-sap-scm-raw", target: "biz-order-fulfillment", type: "FEEDS", desc: "SCM procurement → fulfillment planning" },
  { source: "src-kinaxis-raw", target: "biz-order-fulfillment", type: "FEEDS", desc: "Demand plans → fulfillment planning" },
  { source: "src-fourkites-raw", target: "biz-order-fulfillment", type: "FEEDS", desc: "Shipment tracking → fulfillment status" },
  { source: "src-shipstation-raw", target: "biz-order-fulfillment", type: "FEEDS", desc: "Last-mile delivery → fulfillment" },
  // Support source → business
  { source: "src-zendesk-raw", target: "biz-support-metrics", type: "FEEDS", desc: "Zendesk tickets → support metrics" },
  { source: "src-intercom-raw", target: "biz-support-metrics", type: "FEEDS", desc: "Intercom conversations → support metrics" },
  { source: "src-surveymonkey-raw", target: "biz-support-metrics", type: "FEEDS", desc: "CSAT survey results → support metrics" },
  { source: "src-zendesk-raw", target: "biz-customer-health", type: "FEEDS", desc: "Support ticket patterns → health score" },
  { source: "src-intercom-raw", target: "biz-customer-health", type: "FEEDS", desc: "Chat interactions → health signals" },
  // Previously orphaned sources → Business
  { source: "src-kafka-inventory", target: "biz-order-fulfillment", type: "FEEDS", desc: "Inventory events → fulfillment stock checks" },
  { source: "src-zoominfo-raw", target: "biz-customer-360", type: "FEEDS", desc: "Firmographic & intent data → customer profile" },
  { source: "src-outreach-raw", target: "biz-pipeline-forecast", type: "FEEDS", desc: "Sequence engagement → pipeline scoring" },
  { source: "src-salesloft-raw", target: "biz-pipeline-forecast", type: "FEEDS", desc: "Cadence metrics → pipeline signals" },
  { source: "src-sfmc-raw", target: "biz-campaign-perf", type: "FEEDS", desc: "Email engagement metrics → campaign performance" },
  { source: "src-avalara-raw", target: "biz-revenue-ledger", type: "FEEDS", desc: "Tax calculations → revenue adjustments" },
  { source: "src-anaplan-raw", target: "biz-spend-analytics", type: "FEEDS", desc: "Budget & planning data → spend variance" },
  { source: "src-oracle-scm-raw", target: "biz-vendor-performance", type: "FEEDS", desc: "Procurement data → vendor delivery scores" },
  { source: "src-braze-raw", target: "biz-campaign-perf", type: "FEEDS", desc: "Push & in-app engagement → campaign metrics" },
  { source: "src-contentful-raw", target: "biz-campaign-perf", type: "FEEDS", desc: "Content performance → campaign attribution" },
  { source: "src-iterable-raw", target: "biz-attribution", type: "FEEDS", desc: "Email workflow events → attribution touchpoints" },
  { source: "src-launchdarkly-raw", target: "biz-product-usage", type: "FEEDS", desc: "Feature flag exposure → usage analytics" },
  { source: "src-postgres-raw", target: "biz-product-usage", type: "FEEDS", desc: "App DB records → product usage metrics" },
  { source: "src-deel-raw", target: "biz-employee-lifecycle", type: "FEEDS", desc: "Contractor data → workforce lifecycle" },
  { source: "src-statuspage-raw", target: "biz-incident-metrics", type: "FEEDS", desc: "Service status → incident tracking" },
  { source: "src-confluence-raw", target: "biz-support-metrics", type: "FEEDS", desc: "KB article usage → support content metrics" },

  // Business → Business (cross-domain)
  { source: "biz-customer-360", target: "biz-pipeline-forecast", type: "DERIVES", desc: "Customer health score informs pipeline weighting" },
  { source: "biz-customer-360", target: "biz-attribution", type: "DERIVES", desc: "Customer segments define attribution windows" },
  { source: "biz-order-fulfillment", target: "biz-revenue-ledger", type: "FEEDS", desc: "Fulfilled orders → revenue recognition trigger" },
  { source: "biz-vendor-performance", target: "biz-order-fulfillment", type: "FEEDS", desc: "Supplier reliability gates fulfillment" },
  { source: "biz-campaign-perf", target: "biz-attribution", type: "FEEDS", desc: "Campaign touchpoints → attribution model" },
  { source: "biz-recruiting-funnel", target: "biz-headcount", type: "FEEDS", desc: "Accepted offers → projected headcount" },
  { source: "biz-headcount", target: "biz-spend-analytics", type: "AGGREGATES", desc: "People costs roll into spend analytics" },
  { source: "biz-product-usage", target: "biz-customer-360", type: "FEEDS", desc: "Usage data enriches customer health" },
  { source: "biz-incident-metrics", target: "biz-dev-velocity", type: "FEEDS", desc: "Incident rates affect velocity scoring" },
  { source: "biz-product-usage", target: "biz-customer-health", type: "FEEDS", desc: "Usage decline → health score" },
  { source: "biz-customer-360", target: "biz-customer-health", type: "FEEDS", desc: "Account data → health context" },
  { source: "biz-revenue-ledger", target: "biz-unit-economics", type: "FEEDS", desc: "Revenue data → LTV calculation" },
  { source: "biz-spend-analytics", target: "biz-unit-economics", type: "FEEDS", desc: "Spend data → CAC calculation" },
  { source: "biz-customer-360", target: "biz-unit-economics", type: "FEEDS", desc: "Cohort data → segment economics" },
  { source: "biz-account-hierarchy", target: "biz-customer-360", type: "FEEDS", desc: "Account structure → customer context" },
  { source: "biz-contract-lifecycle", target: "biz-revenue-ledger", type: "FEEDS", desc: "Contract terms → revenue scheduling" },
  { source: "biz-product-catalog", target: "biz-order-fulfillment", type: "FEEDS", desc: "Product definitions → order validation" },
  { source: "biz-employee-lifecycle", target: "biz-headcount", type: "FEEDS", desc: "Lifecycle events → headcount changes" },
  { source: "biz-spend-analytics", target: "biz-vendor-performance", type: "FEEDS", desc: "Vendor spend → performance context" },

  // Business → Consumer
  { source: "biz-revenue-ledger", target: "con-ceo-dashboard", type: "FEEDS", desc: "Revenue → CEO weekly digest" },
  { source: "biz-pipeline-forecast", target: "con-ceo-dashboard", type: "FEEDS", desc: "Pipeline health → CEO weekly digest" },
  { source: "biz-headcount", target: "con-ceo-dashboard", type: "FEEDS", desc: "Headcount → CEO weekly digest" },
  { source: "biz-product-usage", target: "con-ceo-dashboard", type: "FEEDS", desc: "NPS & engagement → CEO weekly digest" },
  { source: "biz-revenue-ledger", target: "con-board-deck", type: "FEEDS", desc: "Financial statements for board" },
  { source: "biz-spend-analytics", target: "con-board-deck", type: "FEEDS", desc: "Unit economics for board" },
  { source: "biz-customer-360", target: "con-board-deck", type: "FEEDS", desc: "Cohort analysis for board" },
  { source: "biz-customer-360", target: "con-sales-leaderboard", type: "FEEDS", desc: "Account ownership → rep attribution" },
  { source: "biz-pipeline-forecast", target: "con-sales-leaderboard", type: "FEEDS", desc: "Quota attainment calculation" },
  { source: "biz-customer-360", target: "con-churn-model", type: "FEEDS", desc: "Customer features → churn prediction" },
  { source: "biz-product-usage", target: "con-churn-model", type: "FEEDS", desc: "Usage decline → churn signal" },
  { source: "biz-vendor-performance", target: "con-demand-forecast", type: "FEEDS", desc: "Supplier capacity → demand planning" },
  { source: "biz-order-fulfillment", target: "con-demand-forecast", type: "FEEDS", desc: "Order velocity → demand model" },
  { source: "biz-campaign-perf", target: "con-marketing-roi", type: "FEEDS", desc: "Spend & conversions → ROI" },
  { source: "biz-attribution", target: "con-marketing-roi", type: "FEEDS", desc: "Attribution → channel CAC" },
  { source: "biz-customer-360", target: "con-marketing-roi", type: "FEEDS", desc: "LTV data → LTV:CAC ratio" },
  { source: "biz-dev-velocity", target: "con-eng-health", type: "FEEDS", desc: "DORA metrics → API" },
  { source: "biz-incident-metrics", target: "con-eng-health", type: "FEEDS", desc: "Incident status → API" },
  { source: "biz-recruiting-funnel", target: "con-talent-insights", type: "FEEDS", desc: "Funnel metrics → dashboard" },
  { source: "biz-headcount", target: "con-talent-insights", type: "FEEDS", desc: "Diversity & attrition → dashboard" },
  { source: "biz-support-metrics", target: "con-support-dashboard", type: "FEEDS", desc: "Support metrics → ops dashboard" },
  { source: "biz-customer-health", target: "con-support-dashboard", type: "FEEDS", desc: "Health scores → ops dashboard" },
  { source: "biz-customer-health", target: "con-ceo-dashboard", type: "FEEDS", desc: "Customer health → CEO digest" },
  { source: "biz-customer-health", target: "con-churn-model", type: "FEEDS", desc: "Health score → churn prediction" },
  { source: "biz-revenue-ledger", target: "con-finance-close", type: "FEEDS", desc: "Revenue schedules → close package" },
  { source: "biz-spend-analytics", target: "con-finance-close", type: "FEEDS", desc: "Accruals and spend → close package" },
  { source: "biz-contract-lifecycle", target: "con-finance-close", type: "FEEDS", desc: "Contract obligations → close metrics" },
  { source: "biz-revenue-ledger", target: "con-revenue-monitor", type: "FEEDS", desc: "Revenue data → live monitor" },
  { source: "biz-unit-economics", target: "con-revenue-monitor", type: "FEEDS", desc: "Unit economics → revenue context" },
  { source: "biz-contract-lifecycle", target: "con-renewal-dashboard", type: "FEEDS", desc: "Contract renewals → renewal pipeline" },
  { source: "biz-customer-health", target: "con-renewal-dashboard", type: "FEEDS", desc: "Health score → at-risk contracts" },
  { source: "biz-customer-360", target: "con-renewal-dashboard", type: "FEEDS", desc: "Account data → renewal context" },
  { source: "biz-product-usage", target: "con-upsell-signals", type: "FEEDS", desc: "Usage growth → expansion propensity" },
  { source: "biz-customer-360", target: "con-upsell-signals", type: "FEEDS", desc: "Customer data → upsell scoring" },
  { source: "biz-customer-health", target: "con-upsell-signals", type: "FEEDS", desc: "Health score → expansion readiness" },
  { source: "biz-vendor-performance", target: "con-vendor-risk", type: "FEEDS", desc: "Vendor scores → risk alerts" },
  { source: "biz-spend-analytics", target: "con-vendor-risk", type: "FEEDS", desc: "Spend concentration → risk flags" },
  { source: "biz-employee-lifecycle", target: "con-talent-insights", type: "FEEDS", desc: "Lifecycle data → talent insights" },
  { source: "biz-unit-economics", target: "con-board-deck", type: "FEEDS", desc: "Unit economics → board metrics" },
];

// ── CONSUMERS ──
const CONSUMERS = [
  { product_id: "con-ceo-dashboard", consumer_name: "CEO Weekly Email", consumer_type: "REPORT", team: "Executive", access_frequency: "WEEKLY" },
  { product_id: "con-ceo-dashboard", consumer_name: "Executive Tableau Dashboard", consumer_type: "DASHBOARD", team: "FP&A", access_frequency: "DAILY" },
  { product_id: "con-board-deck", consumer_name: "Board Meeting Slides", consumer_type: "REPORT", team: "Executive", access_frequency: "MONTHLY" },
  { product_id: "con-board-deck", consumer_name: "Investor Relations Portal", consumer_type: "APPLICATION", team: "Finance", access_frequency: "MONTHLY" },
  { product_id: "con-sales-leaderboard", consumer_name: "Sales Slack Bot", consumer_type: "APPLICATION", team: "Sales", access_frequency: "DAILY" },
  { product_id: "con-sales-leaderboard", consumer_name: "Salesforce Dashboard", consumer_type: "DASHBOARD", team: "Sales Ops", access_frequency: "REALTIME" },
  { product_id: "con-churn-model", consumer_name: "Churn Prediction Model v3", consumer_type: "ML_MODEL", team: "Data Science", access_frequency: "DAILY" },
  { product_id: "con-churn-model", consumer_name: "CS Health Score API", consumer_type: "API", team: "Customer Success", access_frequency: "HOURLY" },
  { product_id: "con-demand-forecast", consumer_name: "Procurement Planning Tool", consumer_type: "APPLICATION", team: "Supply Chain", access_frequency: "DAILY" },
  { product_id: "con-demand-forecast", consumer_name: "Demand Forecast Notebook", consumer_type: "NOTEBOOK", team: "Data Science", access_frequency: "WEEKLY" },
  { product_id: "con-marketing-roi", consumer_name: "CFO Monthly Report", consumer_type: "REPORT", team: "Finance", access_frequency: "MONTHLY" },
  { product_id: "con-marketing-roi", consumer_name: "Marketing Looker Dashboard", consumer_type: "DASHBOARD", team: "Marketing", access_frequency: "DAILY" },
  { product_id: "con-eng-health", consumer_name: "Engineering Slack Bot", consumer_type: "APPLICATION", team: "Engineering", access_frequency: "REALTIME" },
  { product_id: "con-eng-health", consumer_name: "VP Eng Weekly Review", consumer_type: "DASHBOARD", team: "Engineering", access_frequency: "WEEKLY" },
  { product_id: "con-talent-insights", consumer_name: "CHRO Dashboard", consumer_type: "DASHBOARD", team: "HR Leadership", access_frequency: "WEEKLY" },
  { product_id: "con-talent-insights", consumer_name: "Recruiting Ops Spreadsheet", consumer_type: "REPORT", team: "Talent Acquisition", access_frequency: "DAILY" },
  { product_id: "con-support-dashboard", consumer_name: "Support Ops Slack Bot", consumer_type: "APPLICATION", team: "Support", access_frequency: "REALTIME" },
  { product_id: "con-support-dashboard", consumer_name: "VP Support Weekly Review", consumer_type: "DASHBOARD", team: "Support Leadership", access_frequency: "WEEKLY" },
  { product_id: "con-finance-close", consumer_name: "Controller Close Checklist", consumer_type: "DASHBOARD", team: "Accounting", access_frequency: "MONTHLY" },
  { product_id: "con-finance-close", consumer_name: "External Audit Package", consumer_type: "REPORT", team: "Finance", access_frequency: "MONTHLY" },
  { product_id: "con-revenue-monitor", consumer_name: "RevOps Slack Alerts", consumer_type: "APPLICATION", team: "Revenue Ops", access_frequency: "REALTIME" },
  { product_id: "con-revenue-monitor", consumer_name: "CFO Revenue Dashboard", consumer_type: "DASHBOARD", team: "Finance", access_frequency: "DAILY" },
  { product_id: "con-renewal-dashboard", consumer_name: "CS Renewal Playbook", consumer_type: "DASHBOARD", team: "Customer Success", access_frequency: "DAILY" },
  { product_id: "con-renewal-dashboard", consumer_name: "Finance Renewal Forecast", consumer_type: "REPORT", team: "FP&A", access_frequency: "WEEKLY" },
  { product_id: "con-upsell-signals", consumer_name: "Expansion Propensity Model", consumer_type: "ML_MODEL", team: "Data Science", access_frequency: "DAILY" },
  { product_id: "con-upsell-signals", consumer_name: "AE Expansion Alerts", consumer_type: "APPLICATION", team: "Sales", access_frequency: "DAILY" },
  { product_id: "con-vendor-risk", consumer_name: "Procurement Risk Dashboard", consumer_type: "DASHBOARD", team: "Procurement", access_frequency: "WEEKLY" },
  { product_id: "con-vendor-risk", consumer_name: "Vendor Alert Emails", consumer_type: "REPORT", team: "Supply Chain", access_frequency: "DAILY" },
];

// ── GOVERNANCE ──
const POLICIES = [
  { name: "PII Masking Standard", policy_type: "PII", description: "All PII fields hashed/masked in non-production; email, phone, SSN, address", scope: "GLOBAL", domain_id: null, enforced: true },
  { name: "GDPR Right to Erasure", policy_type: "PII", description: "Customer PII deletion within 30 days of request; cascades to all products", scope: "GLOBAL", domain_id: null, enforced: true },
  { name: "Financial Data 7yr Retention", policy_type: "RETENTION", description: "Financial records retained 7 years minimum for SOX compliance", scope: "DOMAIN", domain_id: "finance", enforced: true },
  { name: "SOX Audit Logging", policy_type: "ACCESS", description: "All access to financial ledger must be logged with user identity", scope: "DOMAIN", domain_id: "finance", enforced: true },
  { name: "RBAC Salary Data", policy_type: "ACCESS", description: "Compensation data restricted to HR leadership & Finance", scope: "DOMAIN", domain_id: "hr", enforced: true },
  { name: "Gold Product Quality Gate", policy_type: "QUALITY", description: "Gold-tier products must maintain quality_score >= 0.85", scope: "GLOBAL", domain_id: null, enforced: true },
  { name: "Marketing Data 2yr TTL", policy_type: "RETENTION", description: "Marketing event-level data expires after 24 months", scope: "DOMAIN", domain_id: "marketing", enforced: false },
  { name: "PHI Encryption at Rest", policy_type: "PII", description: "Employee health data encrypted at rest and in transit", scope: "DOMAIN", domain_id: "hr", enforced: true },
];

// ── SEED EXECUTION ──
console.log("Seeding MeshLens database...\n");

// Clear in reverse FK order
for (const t of ["sla_breach", "data_product_consumer", "governance_policy", "schema_change", "pipeline_health", "sync_daily_stats", "sync_log", "product_pipeline_run", "lineage_edge", "data_product_source", "data_product", "connection", "destination", "application", "domain"]) {
  try { db.exec(`DELETE FROM ${t}`); } catch { /* table may not exist yet */ }
}

// Domains
const insertDomain = db.prepare("INSERT INTO domain (id, name, description, owner_team, color_hex) VALUES (?, ?, ?, ?, ?)");
for (const d of DOMAINS) insertDomain.run(d.id, d.name, d.description, d.owner_team, d.color_hex);
console.log(`  ${DOMAINS.length} domains`);

// Destinations
const DESTS = [
  { id: "dest-sf-prod", name: "SNOWFLAKE_PROD", type: "SNOWFLAKE", region: "us-east-1", database_name: "ENTERPRISE_DW" },
  { id: "dest-sf-dev", name: "SNOWFLAKE_DEV", type: "SNOWFLAKE", region: "us-east-1", database_name: "ENTERPRISE_DEV" },
  { id: "dest-sf-analytics", name: "SNOWFLAKE_ANALYTICS", type: "SNOWFLAKE", region: "us-west-2", database_name: "ANALYTICS_PROD" },
];
const insertDest = db.prepare("INSERT INTO destination (id, name, type, region, database_name) VALUES (?, ?, ?, ?, ?)");
for (const d of DESTS) insertDest.run(d.id, d.name, d.type, d.region, d.database_name);
console.log(`  ${DESTS.length} destinations`);

// Applications
const insertApp = db.prepare("INSERT INTO application (id, name, app_type, domain_id, description, vendor, environment) VALUES (?, ?, ?, ?, ?, ?, ?)");
const appIds: string[] = [];
for (const a of APPS) {
  const id = `app-${a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
  insertApp.run(id, a.name, a.app_type, a.domain_id, a.description, a.vendor, "PROD");
  appIds.push(id);
}
console.log(`  ${APPS.length} applications`);

// Connections
const connTypes: Record<string, string[]> = {
  SaaS: ["fivetran", "custom", "api"],
  Database: ["airbyte", "fivetran"],
  API: ["api", "fivetran"],
  Streaming: ["kafka"],
};
const freqs = ["5min", "15min", "1hr", "6hr", "24hr"];
const healthyStatuses = ["ACTIVE","ACTIVE","ACTIVE","ACTIVE","ACTIVE","ACTIVE","ACTIVE","ACTIVE","ACTIVE","ACTIVE"];
const costs = { "5min": 450, "15min": 280, "1hr": 150, "6hr": 80, "24hr": 40 };

// 6 broken app-to-source connections (1 finance, 1 sales, 1 marketing, 1 product, 1 supply-chain, 1 support)
const BROKEN_APPS: Record<string, string> = {
  "Zuora": "Fivetran sync error: OAuth2 refresh token expired for Zuora billing API (billing.zuora.com). HTTP 401 Unauthorized — re-authenticate in connector dashboard",
  "Outreach": "Fivetran connector outreach_sequences: HTTP 429 Too Many Requests — rate limit 100 req/min exceeded, retry budget exhausted after 5 attempts over 25 min",
  "Meta Ads": "Airbyte source meta-ads: Error 190 — access token invalidated by user password change. Re-authorization required at business.facebook.com/settings",
  "Datadog": "Custom connector datadog_metrics: API quota exceeded — 429 Too Many Requests, organization daily limit of 3600 calls hit at 14:02 UTC. Resets at midnight UTC",
  "FourKites": "Fivetran connector fourkites_visibility: ECONNREFUSED 10.42.8.91:443 — shipment tracking endpoint unreachable, possible VPN/firewall change. Last successful connection 2026-05-06 08:15 UTC",
  "Intercom": "Airbyte source intercom_conversations: Pagination cursor expired — cursor token valid for 24h, sync exceeded window due to 2.1M conversation backlog. Requires full re-sync",
};

// 2 paused app-to-source connections (1 marketing, 1 hr)
const PAUSED_APPS: Record<string, string> = {
  "LinkedIn Ads": "Connector paused by data-ops admin (JIRA: OPS-4521). LinkedIn Ads API sync disabled since 2026-04-28 — quarterly API budget cap reached, re-enable after May billing cycle",
  "Greenhouse": "Connector paused by HR team request (JIRA: HR-2201). Greenhouse ATS migration to new tenant in progress — sync will resume after cutover",
};

const insertConn = db.prepare("INSERT INTO connection (id, application_id, destination_id, connector_type, connection_name, schema_name, status, sync_frequency, setup_at, paused, monthly_cost_usd, rows_per_sync_avg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
const connIds: string[] = [];
const brokenConnIndices: number[] = [];
const pausedConnIndices: number[] = [];

for (let i = 0; i < APPS.length; i++) {
  const app = APPS[i];
  const appId = appIds[i];
  const connId = `conn-${uid()}`;
  const ctype = pick(connTypes[app.app_type] || ["fivetran"]);
  const dest = pick(DESTS);
  const isBroken = app.name in BROKEN_APPS;
  const isPaused = app.name in PAUSED_APPS;
  const status = isBroken ? "BROKEN" : isPaused ? "PAUSED" : pick(healthyStatuses);
  const freq = app.app_type === "Streaming" ? "5min" : pick(freqs);
  const schema = `raw_${app.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const cost = costs[freq as keyof typeof costs] * (0.7 + Math.random() * 0.6);
  const rowsAvg = Math.floor(randBetween(500, 200000));

  insertConn.run(connId, appId, dest.id, ctype, `${app.name} → ${dest.name}`, schema, status, freq, dateOffset(Math.floor(randBetween(30, 365))), isPaused ? 1 : 0, Math.round(cost), rowsAvg);
  connIds.push(connId);
  if (isBroken) brokenConnIndices.push(i);
  if (isPaused) pausedConnIndices.push(i);
}
console.log(`  ${connIds.length} connections (${brokenConnIndices.length} broken, ${pausedConnIndices.length} paused)`);

// Data Products
const insertDP = db.prepare("INSERT INTO data_product (id, name, domain_id, description, owner, sla_freshness, quality_score, tier, product_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
for (const dp of DATA_PRODUCTS) {
  insertDP.run(dp.id, dp.name, dp.domain_id, dp.description, dp.owner, dp.sla_freshness, dp.quality_score, dp.tier, dp.product_type);
}
console.log(`  ${DATA_PRODUCTS.length} data products (${DATA_PRODUCTS.filter(d => d.product_type === "SOURCE_ALIGNED").length} source, ${DATA_PRODUCTS.filter(d => d.product_type === "BUSINESS").length} business, ${DATA_PRODUCTS.filter(d => d.product_type === "CONSUMER_ALIGNED").length} consumer)`);

// Data Product Sources — accurate 1:1 mapping for SOURCE_ALIGNED products
const insertDPS = db.prepare("INSERT OR IGNORE INTO data_product_source (data_product_id, connection_id, table_name) VALUES (?, ?, ?)");
let dpsCount = 0;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const PRODUCT_TO_APP: Record<string, string> = {
  "Inventory Events Stream": "Kafka — Inventory Events",
  "Order Events Stream": "Kafka — Order Events",
  "Segment Events Stream": "Segment",
  "Clickstream Events": "Kafka — Clickstream",
  "CPQ": "CPQ (Salesforce)",
  "SF Marketing Cloud": "Salesforce Marketing Cloud",
  "GA4": "Google Analytics 4",
  "PostgreSQL": "PostgreSQL — App DB",
};

for (const dp of DATA_PRODUCTS) {
  if (dp.product_type === "SOURCE_ALIGNED") {
    const explicitAppName = PRODUCT_TO_APP[dp.name];
    let bestIdx = -1, bestScore = 0;
    if (explicitAppName) {
      bestIdx = APPS.findIndex(a => a.name === explicitAppName && a.domain_id === dp.domain_id);
    }
    if (bestIdx < 0) {
      const dpNorm = norm(dp.name);
      for (let i = 0; i < APPS.length; i++) {
        if (APPS[i].domain_id !== dp.domain_id) continue;
        const appNorm = norm(APPS[i].name);
        if (appNorm === dpNorm) { bestIdx = i; break; }
        if (dpNorm.includes(appNorm) || appNorm.includes(dpNorm)) {
          const score = Math.min(appNorm.length, dpNorm.length) / Math.max(appNorm.length, dpNorm.length);
          if (score > bestScore) { bestScore = score; bestIdx = i; }
        }
      }
    }
    if (bestIdx >= 0) {
      insertDPS.run(dp.id, connIds[bestIdx], `${dp.name.toLowerCase().replace(/\s+/g, "_")}_raw`);
      dpsCount++;
    } else {
      console.warn(`  ⚠ No app match for source product: ${dp.name} (${dp.domain_id})`);
    }
  } else {
    const domainConns = connIds.filter((_, i) => APPS[i].domain_id === dp.domain_id);
    for (const connId of domainConns.slice(0, Math.min(3, domainConns.length))) {
      insertDPS.run(dp.id, connId, `${dp.name.toLowerCase().replace(/\s+/g, "_")}_raw`);
      dpsCount++;
    }
  }
}
console.log(`  ${dpsCount} data product sources`);

// Lineage — with edge_status for pipeline failure cascade
// Source products fed by broken/paused apps
const brokenAppNames = new Set(Object.keys(BROKEN_APPS));
const pausedAppNames = new Set(Object.keys(PAUSED_APPS));
const brokenSourceProducts = new Set<string>();
const pausedSourceProducts = new Set<string>();
for (const dp of DATA_PRODUCTS) {
  if (dp.product_type !== "SOURCE_ALIGNED") continue;
  const explicitAppName = PRODUCT_TO_APP[dp.name];
  const matchName = explicitAppName || dp.name;
  if (brokenAppNames.has(matchName)) brokenSourceProducts.add(dp.id);
  if (pausedAppNames.has(matchName)) pausedSourceProducts.add(dp.id);
}

// 4 independently broken source-to-business DAG edges
// Error templates receive the real model name at generation time so names always match
const BROKEN_DAGS: Record<string, { target: string; errorFn: (model: string) => string }> = {
  "src-salesforce-raw": {
    target: "biz-pipeline-forecast",
    errorFn: (m) => `airflow.exceptions.AirflowTaskTimeout: Model ${m} exceeded SLA of 2700s (45min). Process killed (SIGKILL) — memory 4.1GB exceeded 4.0GB limit. Root cause: Salesforce Opportunity table grew from 2.1M→3.8M rows after Q2 territory realignment. DAG: dag_pipeline_forecast_daily, task: ${m}, execution_date: 2026-05-08T04:00:00+00:00`,
  },
  "src-amplitude-raw": {
    target: "biz-product-usage",
    errorFn: (m) => `dbt.exceptions.DatabaseError: 100038 (22018): Numeric value 'page_view' is not recognized. Runtime Error in model ${m} (models/staging/${m}.sql:47): column 'event_type' is of type INTEGER but expression is of type VARCHAR. Caused by Amplitude export format change on 2026-05-07. dbt run-id: 1a7c3f, node: model.meshlens.${m}`,
  },
};

// Collect all business products that have at least one upstream broken or warning source
const businessWithBrokenUpstream = new Set<string>();

const insertEdge = db.prepare("INSERT INTO lineage_edge (id, source_product_id, target_product_id, edge_type, description, edge_status, status_reason) VALUES (?, ?, ?, ?, ?, ?, ?)");
const edgeCounts = { HEALTHY: 0, BROKEN: 0, WARNING: 0 };

// Pre-compute model names for broken DAG edges so edge status_reason matches pipeline runs
const brokenDagEdgeReason: Record<string, string> = {};
for (const [srcId, dag] of Object.entries(BROKEN_DAGS)) {
  const targetDp = DATA_PRODUCTS.find(d => d.id === dag.target);
  const srcDp = DATA_PRODUCTS.find(d => d.id === srcId);
  if (targetDp && srcDp) {
    const bizSnake = toSnake(targetDp.name);
    const srcSnake = toSnake(srcDp.name);
    const modelName = `stg_${bizSnake}__${srcSnake}`;
    brokenDagEdgeReason[`${srcId}|${dag.target}`] = dag.errorFn(modelName);
  }
}

for (const le of LINEAGE_EDGES) {
  let edgeStatus = "HEALTHY";
  let statusReason: string | null = null;

  const dagEntry = BROKEN_DAGS[le.source];

  if (dagEntry && dagEntry.target === le.target) {
    edgeStatus = "BROKEN";
    statusReason = brokenDagEdgeReason[`${le.source}|${le.target}`] || "DAG failure";
    businessWithBrokenUpstream.add(le.target);
  } else if (brokenSourceProducts.has(le.source) && le.target.startsWith("biz-")) {
    edgeStatus = "WARNING";
    const srcName = DATA_PRODUCTS.find(d => d.id === le.source)?.name || le.source;
    statusReason = `Upstream source product "${srcName}" has broken ingestion connector — no fresh data landing in raw schema, downstream marts serving stale data`;
    businessWithBrokenUpstream.add(le.target);
  } else if (pausedSourceProducts.has(le.source) && le.target.startsWith("biz-")) {
    edgeStatus = "WARNING";
    const srcName = DATA_PRODUCTS.find(d => d.id === le.source)?.name || le.source;
    statusReason = `Upstream source product "${srcName}" connector is PAUSED — data sync suspended, freshness degrading since pause date`;
    businessWithBrokenUpstream.add(le.target);
  }

  insertEdge.run(`edge-${uid()}`, le.source, le.target, le.type, le.desc, edgeStatus, statusReason);
  edgeCounts[edgeStatus as keyof typeof edgeCounts]++;
}
console.log(`  ${LINEAGE_EDGES.length} lineage edges (${edgeCounts.BROKEN} broken, ${edgeCounts.WARNING} warning, ${edgeCounts.HEALTHY} healthy)`);

// Consumers
const insertConsumer = db.prepare("INSERT INTO data_product_consumer (id, data_product_id, consumer_name, consumer_type, team, access_frequency) VALUES (?, ?, ?, ?, ?, ?)");
for (const c of CONSUMERS) insertConsumer.run(`consumer-${uid()}`, c.product_id, c.consumer_name, c.consumer_type, c.team, c.access_frequency);
console.log(`  ${CONSUMERS.length} data product consumers`);

// Sync Logs & Daily Stats (90 days)
console.log("  Generating 90 days of sync history...");
const insertSyncLog = db.prepare("INSERT INTO sync_log (id, connection_id, sync_id, event_type, message, rows_synced, bytes_synced, started_at, completed_at, duration_sec) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
const insertDailyStats = db.prepare("INSERT OR REPLACE INTO sync_daily_stats (connection_id, measured_date, syncs_completed, rows_synced, errors_count, avg_duration_sec) VALUES (?, ?, ?, ?, ?, ?)");

let logCount = 0, statsCount = 0;

const insertLogsBatch = db.transaction(() => {
  for (const connId of connIds) {
    for (let day = 0; day < 90; day++) {
      const date = new Date(); date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().slice(0, 10);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const syncsPerDay = isWeekend ? Math.floor(randBetween(2, 6)) : Math.floor(randBetween(4, 16));
      let dayRows = 0, dayErrors = 0, dayDuration = 0;

      for (let s = 0; s < syncsPerDay; s++) {
        const syncId = `sync-${uid()}`;
        const hour = Math.floor(randBetween(0, 24));
        const minute = Math.floor(randBetween(0, 60));
        const startTime = `${dateStr} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
        const hasError = Math.random() < (isWeekend ? 0.08 : 0.03);
        const rows = hasError ? 0 : Math.floor(randBetween(100, 50000));
        const bytes = rows * Math.floor(randBetween(200, 800));
        const duration = hasError ? randBetween(1, 5) : randBetween(10, 300);
        const endDate = new Date(`${startTime.replace(" ", "T")}Z`);
        endDate.setSeconds(endDate.getSeconds() + duration);
        const endTime = endDate.toISOString().slice(0, 19).replace("T", " ");
        const eventType = hasError ? "ERROR" : "SYNC_END";
        const message = hasError
          ? pick(["Connection timeout after 30s", "Authentication failed: token expired", "Rate limit exceeded (429)", "Schema drift: column 'status' type changed", "Source unavailable: HTTP 503", "Memory limit exceeded during extraction", "Primary key violation in target"])
          : `Synced ${rows.toLocaleString()} rows (${(bytes / 1024 / 1024).toFixed(1)}MB) in ${duration.toFixed(0)}s`;

        insertSyncLog.run(`log-${uid()}`, connId, syncId, eventType, message, rows, bytes, startTime, endTime, Math.round(duration * 100) / 100);
        logCount++;
        dayRows += rows;
        if (hasError) dayErrors++;
        dayDuration += duration;
      }

      insertDailyStats.run(connId, dateStr, syncsPerDay, dayRows, dayErrors, syncsPerDay > 0 ? Math.round((dayDuration / syncsPerDay) * 100) / 100 : 0);
      statsCount++;
    }
  }
});
insertLogsBatch();
console.log(`  ${logCount} sync log entries`);
console.log(`  ${statsCount} daily stat records`);

// Pipeline Health — deterministic for broken and paused connections
const insertHealth = db.prepare("INSERT INTO pipeline_health (connection_id, measured_at, status, last_success_at, failure_streak, avg_latency_sec) VALUES (?, ?, ?, ?, ?, ?)");
const now = dateOffset(0);
let healthCount = 0;
const brokenConnSet = new Set(brokenConnIndices);
const pausedConnSet = new Set(pausedConnIndices);
for (let i = 0; i < connIds.length; i++) {
  let healthStatus: string, failStreak: number;
  if (brokenConnSet.has(i)) {
    healthStatus = "DOWN";
    failStreak = Math.floor(randBetween(3, 8));
  } else if (pausedConnSet.has(i)) {
    healthStatus = "DEGRADED";
    failStreak = 0;
  } else {
    healthStatus = "HEALTHY";
    failStreak = 0;
  }
  const latency = healthStatus === "HEALTHY" ? randBetween(5, 60) : healthStatus === "DEGRADED" ? randBetween(60, 300) : randBetween(300, 900);
  const lastSuccess = healthStatus === "DOWN" ? dateOffset(Math.floor(randBetween(1, 3))) : pausedConnSet.has(i) ? dateOffset(Math.floor(randBetween(8, 12))) : dateOffset(0);
  insertHealth.run(connIds[i], now, healthStatus, lastSuccess, failStreak, Math.round(latency * 100) / 100);
  healthCount++;
}
console.log(`  ${healthCount} pipeline health records`);

// Schema Changes
const insertSC = db.prepare("INSERT INTO schema_change (id, connection_id, change_type, schema_name, table_name, column_name, detected_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
const changeTypes = ["TABLE_ADDED", "COLUMN_ADDED", "COLUMN_REMOVED", "TYPE_CHANGED"] as const;
for (let i = 0; i < 40; i++) {
  const idx = Math.floor(Math.random() * connIds.length);
  insertSC.run(`sc-${uid()}`, connIds[idx], pick([...changeTypes]),
    `raw_${APPS[idx].name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    pick(["users", "orders", "events", "accounts", "transactions", "sessions", "subscriptions", "invoices"]),
    pick(["email", "created_at", "status", "amount", "user_id", "metadata", "tier", "mrr", null]),
    dateOffset(Math.floor(randBetween(0, 60))));
}
console.log(`  40 schema changes`);

// Governance
const insertPolicy = db.prepare("INSERT INTO governance_policy (id, name, policy_type, description, scope, domain_id, enforced) VALUES (?, ?, ?, ?, ?, ?, ?)");
for (const p of POLICIES) insertPolicy.run(`pol-${uid()}`, p.name, p.policy_type, p.description, p.scope, p.domain_id, p.enforced ? 1 : 0);
console.log(`  ${POLICIES.length} governance policies`);

// ── ERROR sync_logs for broken connections ──
console.log("  Adding broken-connection error logs...");
for (const idx of brokenConnIndices) {
  const app = APPS[idx];
  const connId = connIds[idx];
  const errMsg = BROKEN_APPS[app.name];
  for (let h = 0; h < 6; h++) {
    const hoursAgo = h * 2 + Math.floor(Math.random() * 2);
    const ts = new Date(); ts.setHours(ts.getHours() - hoursAgo);
    const startTime = ts.toISOString().slice(0, 19).replace("T", " ");
    const endTs = new Date(ts); endTs.setSeconds(endTs.getSeconds() + Math.floor(randBetween(1, 8)));
    const endTime = endTs.toISOString().slice(0, 19).replace("T", " ");
    insertSyncLog.run(`log-err-${uid()}`, connId, `sync-fail-${uid()}`, "ERROR", errMsg, 0, 0, startTime, endTime, Math.round(randBetween(1, 8) * 100) / 100);
  }
}
// ── PAUSED sync_logs for paused connections ──
console.log("  Adding paused-connection info logs...");
for (const idx of pausedConnIndices) {
  const app = APPS[idx];
  const connId = connIds[idx];
  const reason = PAUSED_APPS[app.name];
  const ts = new Date(); ts.setDate(ts.getDate() - Math.floor(randBetween(8, 12)));
  const startTime = ts.toISOString().slice(0, 19).replace("T", " ");
  insertSyncLog.run(`log-pause-${uid()}`, connId, `sync-pause-${uid()}`, "WARNING", `[PAUSED] ${reason}`, 0, 0, startTime, startTime, 0);
}

// ── Product Pipeline Runs ──
// Model names are derived from actual LINEAGE_EDGES so they match everywhere:
//   SOURCE:   connector_{src}, stg_{src}, stg_{src}_cleaned, marts.{src}_summary, marts.{src}_latest
//   BUSINESS: stg_{biz}__{upstream_source_name} (per upstream), int_{biz}_joined, marts.{biz}_*
//   CONSUMER: stg_{con}__{upstream_biz_name} (per upstream), marts.{con}_*
console.log("  Generating product pipeline runs...");
const insertPPR = db.prepare("INSERT INTO product_pipeline_run (id, data_product_id, run_id, stage, model_name, orchestrator, status, started_at, completed_at, duration_sec, rows_processed, log_message, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
let pprCount = 0;

const BROKEN_DAG_BY_TARGET: Record<string, { source: string; errorFn: (m: string) => string }> = {};
for (const [src, val] of Object.entries(BROKEN_DAGS)) {
  BROKEN_DAG_BY_TARGET[val.target] = { source: src, errorFn: val.errorFn };
}

const srcProductConnError: Record<string, string> = {};
const srcProductPauseReason: Record<string, string> = {};
for (const dp of DATA_PRODUCTS) {
  if (dp.product_type !== "SOURCE_ALIGNED") continue;
  const appName = PRODUCT_TO_APP[dp.name] || dp.name;
  if (BROKEN_APPS[appName]) srcProductConnError[dp.id] = BROKEN_APPS[appName];
  if (PAUSED_APPS[appName]) srcProductPauseReason[dp.id] = PAUSED_APPS[appName];
}

const dpById = new Map(DATA_PRODUCTS.map(d => [d.id, d]));

// Build a set of source product IDs that have broken or paused upstream connections
const staleSourceIds = new Set([...Object.keys(srcProductConnError), ...Object.keys(srcProductPauseReason)]);

for (const dp of DATA_PRODUCTS) {
  const snake = toSnake(dp.name);
  const runId = `run-${uid()}`;
  const hasBrokenDag = dp.id in BROKEN_DAG_BY_TARGET;
  const isBrokenSource = dp.id in srcProductConnError;
  const isPausedSource = dp.id in srcProductPauseReason;
  const baseOrch = pick(["airflow", "prefect", "dbt"] as const);
  const baseTime = new Date(); baseTime.setMinutes(baseTime.getMinutes() - Math.floor(randBetween(10, 120)));

  type ModelDef = { name: string; stage: string; orch: string; srcId?: string };
  let models: ModelDef[];

  if (dp.product_type === "SOURCE_ALIGNED") {
    models = [
      { name: `connector_${snake}`, stage: "CONNECTOR", orch: "custom" },
      { name: `stg_${snake}`, stage: "STAGING", orch: "dbt" },
      { name: `stg_${snake}_cleaned`, stage: "STAGING", orch: "dbt" },
      { name: `marts.${snake}_summary`, stage: "MART", orch: baseOrch },
      { name: `marts.${snake}_latest`, stage: "MART", orch: baseOrch },
    ];
  } else if (dp.product_type === "BUSINESS") {
    // One staging model per SOURCE_ALIGNED upstream — no truncation
    const upEdges = LINEAGE_EDGES.filter(e => e.target === dp.id && dpById.get(e.source)?.product_type === "SOURCE_ALIGNED");
    const stgModels: ModelDef[] = upEdges.map(e => {
      const src = dpById.get(e.source)!;
      return { name: `stg_${snake}__${toSnake(src.name)}`, stage: "STAGING", orch: "dbt", srcId: e.source };
    });
    if (stgModels.length === 0) {
      stgModels.push({ name: `stg_${snake}__fallback`, stage: "STAGING", orch: "dbt" });
    }
    models = [
      ...stgModels,
      { name: `int_${snake}_joined`, stage: "STAGING", orch: "dbt" },
      { name: `marts.${snake}_summary`, stage: "MART", orch: baseOrch },
      { name: `marts.${snake}_wide`, stage: "MART", orch: baseOrch },
    ];
  } else {
    // One staging model per upstream (business or other) — no truncation
    const upEdges = LINEAGE_EDGES.filter(e => e.target === dp.id);
    const stgModels: ModelDef[] = upEdges.map(e => {
      const src = dpById.get(e.source)!;
      return { name: `stg_${snake}__${toSnake(src.name)}`, stage: "STAGING", orch: "dbt", srcId: e.source };
    });
    if (stgModels.length === 0) {
      stgModels.push({ name: `stg_${snake}__fallback`, stage: "STAGING", orch: "dbt" });
    }
    models = [
      ...stgModels,
      { name: `marts.${snake}_summary`, stage: "MART", orch: baseOrch },
      { name: `marts.${snake}_api_ready`, stage: "MART", orch: baseOrch },
    ];
  }

  // Determine which model index fails for BROKEN_DAG products
  let failIdx = -1;
  let dagError: string | null = null;
  if (hasBrokenDag) {
    const dag = BROKEN_DAG_BY_TARGET[dp.id];
    failIdx = models.findIndex(m => m.srcId === dag.source);
    if (failIdx < 0) failIdx = models.findIndex(m => m.stage === "STAGING");
    if (failIdx < 0) failIdx = 0;
    dagError = dag.errorFn(models[failIdx].name);
  }

  // For biz/consumer products, figure out which staging models read from stale sources
  // A staging model is stale if its srcId traces back to a broken or paused source product
  const staleStagingModels = new Set<number>();
  if (!isBrokenSource && !isPausedSource && !hasBrokenDag) {
    for (let mi = 0; mi < models.length; mi++) {
      const m = models[mi];
      if (!m.srcId) continue;
      // Direct stale: srcId is a broken/paused source product
      if (staleSourceIds.has(m.srcId)) { staleStagingModels.add(mi); continue; }
      // Indirect stale: srcId is a business product that itself has broken/paused upstream
      if (businessWithBrokenUpstream.has(m.srcId)) { staleStagingModels.add(mi); }
    }
  }
  const hasAnyStaleDep = staleStagingModels.size > 0;

  let cumulativeSec = 0;
  for (let mi = 0; mi < models.length; mi++) {
    const m = models[mi];
    let status: string;
    let logMsg: string;
    let errMsg: string | null = null;
    let durSec: number;
    let rows: number;

    if (isBrokenSource) {
      // SOURCE product with BROKEN connection: connector FAILED, rest SKIPPED
      if (mi === 0) {
        status = "FAILED";
        durSec = randBetween(2, 12);
        rows = 0;
        errMsg = srcProductConnError[dp.id];
        logMsg = `FAILED: ${errMsg}`;
      } else {
        status = "SKIPPED";
        durSec = 0;
        rows = 0;
        logMsg = mi === 1
          ? `Skipped — upstream connector ${models[0].name} FAILED. No fresh data landed in raw schema. dbt run deferred until connector recovers`
          : `Skipped — dependency chain broken at ${models[0].name}. Model ${m.name} cannot execute without upstream materialization`;
        if (m.stage === "MART") logMsg = `Skipped — mart build deferred. Upstream staging layer not refreshed due to connector failure in ${models[0].name}`;
      }
    } else if (isPausedSource) {
      // SOURCE product with PAUSED connection: connector WARNING, staging/mart WARNING (stale)
      if (mi === 0) {
        status = "WARNING";
        durSec = 0;
        rows = 0;
        logMsg = `WARNING — connector paused: ${srcProductPauseReason[dp.id]}`;
      } else {
        status = "WARNING";
        durSec = randBetween(8, 120);
        rows = Math.floor(randBetween(200, 80000));
        if (m.stage === "STAGING") {
          logMsg = `WARNING — built from cached raw data: ${rows.toLocaleString()} rows in ${durSec.toFixed(0)}s. Source connector paused, data may be stale`;
        } else {
          logMsg = `WARNING — mart built from stale staging data: ${rows.toLocaleString()} rows in ${durSec.toFixed(0)}s. Freshness SLA at risk`;
        }
      }
    } else if (hasBrokenDag && failIdx >= 0) {
      // BUSINESS product with independent DAG failure
      if (mi === failIdx) {
        status = "FAILED";
        durSec = randBetween(30, 180);
        rows = 0;
        errMsg = dagError;
        logMsg = `FAILED: ${dagError}`;
      } else if (mi > failIdx) {
        status = "SKIPPED";
        durSec = 0;
        rows = 0;
        const failedModel = models[failIdx].name;
        if (m.name.includes("_joined")) {
          logMsg = `Skipped — cannot execute join. Required input ${failedModel} did not materialize. dbt deps check: FAILED`;
        } else if (m.stage === "MART") {
          logMsg = `Skipped — mart ${m.name} build deferred. Upstream transformation layer incomplete due to failure in ${failedModel}`;
        } else {
          logMsg = `Skipped — upstream model ${failedModel} FAILED. Dependency graph halted`;
        }
      } else {
        status = "COMPLETED";
        durSec = randBetween(4, 300);
        rows = Math.floor(randBetween(500, 500000));
        logMsg = `dbt run OK — model ${m.name}: ${rows.toLocaleString()} rows in ${durSec.toFixed(0)}s`;
      }
    } else if (hasAnyStaleDep) {
      // Biz/consumer product with upstream stale sources but no direct DAG failure
      const isStaleStg = staleStagingModels.has(mi);
      if (isStaleStg) {
        // This staging model reads from a stale/broken source
        const srcDp = m.srcId ? dpById.get(m.srcId) : null;
        const srcLabel = srcDp?.name || "upstream";
        const isSrcBroken = m.srcId && srcProductConnError[m.srcId];
        status = "WARNING";
        durSec = randBetween(8, 120);
        rows = Math.floor(randBetween(200, 80000));
        logMsg = isSrcBroken
          ? `WARNING — upstream source "${srcLabel}" connector is broken. Model ${m.name} built from stale data: ${rows.toLocaleString()} rows in ${durSec.toFixed(0)}s`
          : `WARNING — upstream source "${srcLabel}" connector is paused. Model ${m.name} built from cached data: ${rows.toLocaleString()} rows in ${durSec.toFixed(0)}s`;
      } else if (m.name.includes("_joined") || m.stage === "MART") {
        // Join and mart models inherit WARNING because at least one input is stale
        status = "WARNING";
        durSec = randBetween(8, 180);
        rows = Math.floor(randBetween(500, 500000));
        logMsg = `WARNING — ${m.name}: ${rows.toLocaleString()} rows in ${durSec.toFixed(0)}s. At least one upstream staging model has stale data`;
      } else {
        // Other staging models with healthy upstream are COMPLETED
        status = "COMPLETED";
        durSec = randBetween(4, 300);
        rows = Math.floor(randBetween(500, 500000));
        const testsPassed = Math.floor(randBetween(4, 12));
        logMsg = `dbt run OK — model ${m.name}: ${rows.toLocaleString()} rows materialized in ${durSec.toFixed(0)}s. ${testsPassed} tests passed, 0 warnings`;
      }
    } else {
      // Fully healthy product: all COMPLETED
      status = "COMPLETED";
      durSec = randBetween(4, 300);
      rows = Math.floor(randBetween(500, 500000));
      if (m.stage === "CONNECTOR") {
        logMsg = `Sync completed — extracted ${rows.toLocaleString()} rows (${(rows * randBetween(200, 800) / 1024 / 1024).toFixed(1)}MB) in ${durSec.toFixed(0)}s. Schema: ${dp.name.toLowerCase().replace(/\s+/g, "_")}_raw`;
      } else if (m.stage === "STAGING") {
        const testsPassed = Math.floor(randBetween(4, 12));
        logMsg = `dbt run OK — model ${m.name}: ${rows.toLocaleString()} rows materialized in ${durSec.toFixed(0)}s. ${testsPassed} tests passed, 0 warnings`;
      } else {
        logMsg = `Mart refreshed — ${rows.toLocaleString()} rows in ${durSec.toFixed(0)}s. Freshness: OK (within SLA ${dp.sla_freshness})`;
      }
    }

    const startTs = new Date(baseTime);
    startTs.setSeconds(startTs.getSeconds() + cumulativeSec);
    const endTs = new Date(startTs);
    endTs.setSeconds(endTs.getSeconds() + durSec);
    cumulativeSec += durSec + 2;

    insertPPR.run(
      `ppr-${uid()}`, dp.id, runId, m.stage as string, m.name, m.orch,
      status,
      startTs.toISOString().slice(0, 19).replace("T", " "),
      status === "SKIPPED" ? null : endTs.toISOString().slice(0, 19).replace("T", " "),
      Math.round(durSec * 100) / 100,
      rows,
      logMsg,
      errMsg
    );
    pprCount++;
  }
}
console.log(`  ${pprCount} product pipeline runs`);

// SLA Breaches (realistic: ~15 in last 30 days)
const insertBreach = db.prepare("INSERT INTO sla_breach (id, data_product_id, breach_type, expected_value, actual_value, detected_at, resolved_at, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
const breachProducts = DATA_PRODUCTS.filter(dp => dp.quality_score < 0.9);
for (let i = 0; i < 15; i++) {
  const dp = pick(breachProducts);
  const breachType = pick(["FRESHNESS", "QUALITY", "AVAILABILITY"] as const);
  const daysAgo = Math.floor(randBetween(0, 30));
  const resolved = Math.random() < 0.7;
  const severity = dp.tier === "GOLD" ? pick(["HIGH", "CRITICAL"] as const) : pick(["LOW", "MEDIUM", "HIGH"] as const);
  insertBreach.run(`breach-${uid()}`, dp.id, breachType,
    breachType === "FRESHNESS" ? dp.sla_freshness : breachType === "QUALITY" ? `>= ${(dp.quality_score).toFixed(2)}` : ">= 99.5%",
    breachType === "FRESHNESS" ? `${Math.floor(randBetween(2, 12))}hr` : breachType === "QUALITY" ? `${(dp.quality_score - randBetween(0.05, 0.15)).toFixed(2)}` : `${(95 + Math.random() * 4).toFixed(1)}%`,
    dateOffset(daysAgo), resolved ? dateOffset(Math.max(0, daysAgo - 1)) : null, severity);
}
console.log(`  15 SLA breaches`);

db.pragma("wal_checkpoint(TRUNCATE)");
db.pragma("journal_mode = DELETE");
db.close();
console.log("\nSeed complete.");
