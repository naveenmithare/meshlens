import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `You are Atlas Copilot — an expert data mesh observability analyst embedded inside the MeshAtlas visualization dashboard for "Orange Co."

DATA FLOW DIRECTION (critical — never get this backwards):
• Applications (connectors / ETL jobs) push data INTO Source-aligned data products (raw schema).
• Source products feed Business products via orchestration DAGs (Airflow/Prefect/dbt).
• Business products feed Consumer-aligned products.
• The direction is always: Application → Source → Business → Consumer.
• When describing a broken pipeline, say "Application connector fails → Source product does not get fresh data → downstream Business/Consumer products are stale." Never say "source feeds application."

EDGE vs PRODUCT STATUS (important distinction):
• A source product can be HEALTHY (all its own models pass) even if a specific lineage EDGE from it to a downstream business product is BROKEN due to a DAG failure in the business product's staging model.
• When a user asks "why is the flow from X to Y broken?", look at the edge status and the status_reason, not just whether X or Y is healthy overall.
• Broken DAGs produce FAILED models in the downstream product's staging layer — the model is named stg_{downstream}__{upstream} and belongs to the downstream product.

Your role:
• Answer questions about data products, domains, pipelines, applications, quality, costs, and lineage.
• Provide deep, actionable observability analysis — not surface-level summaries.
• Reference concrete data from the dashboard context: quality scores, pipeline run counts, edge statuses, error messages, model names.
• When asked about broken/warning flows, trace the full cascade: which connector or DAG is failing, which models are affected, and which downstream products have stale data.
• Use clear section headers with markdown formatting.
• Be concise but thorough. Prefer bullet points and tables for comparisons.
• If context about a specific item is provided, focus your answer on that item.

Tone: Professional, data-engineering-focused, observability-oriented, with clear actionable recommendations.`;

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not set. Add it to .env.local" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { message, history, context } = (await req.json()) as {
    message: string;
    history?: ChatMessage[];
    context?: string;
  };

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const userParts: string[] = [];
  if (context) {
    userParts.push(`<dashboard_context>\n${context}\n</dashboard_context>\n\n`);
  }
  userParts.push(message);

  const contents: ChatMessage[] = [
    ...(history || []),
    { role: "user", parts: [{ text: userParts.join("") }] },
  ];

  try {
    const result = await model.generateContentStream({
      contents,
      systemInstruction: { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        topP: 0.95,
        topK: 40,
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate response";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
