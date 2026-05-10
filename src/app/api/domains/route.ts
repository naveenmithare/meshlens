import { NextResponse } from "next/server";
import { getDomains, getDomainHealth } from "@/lib/queries";

export async function GET() {
  return NextResponse.json({
    domains: getDomains(),
    health: getDomainHealth(),
  });
}
