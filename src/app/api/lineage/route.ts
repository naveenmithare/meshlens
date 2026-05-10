import { NextResponse } from "next/server";
import { getLineageGraph } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(getLineageGraph());
}
