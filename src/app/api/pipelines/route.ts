import { NextResponse } from "next/server";
import { getPipelineStatus, getDailyVolume, getRecentErrors, getSchemaChanges } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "volume") {
    return NextResponse.json(getDailyVolume());
  }
  if (view === "errors") {
    return NextResponse.json(getRecentErrors());
  }
  if (view === "schema-changes") {
    return NextResponse.json(getSchemaChanges());
  }

  return NextResponse.json(getPipelineStatus());
}
