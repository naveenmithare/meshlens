import { NextResponse } from "next/server";
import { getMeshOverview, getExecKpis } from "@/lib/queries";

export async function GET() {
  return NextResponse.json({
    overview: getMeshOverview(),
    kpis: getExecKpis(),
  });
}
