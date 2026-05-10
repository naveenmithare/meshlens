import { NextResponse } from "next/server";
import { getDomainHealth, getGovernancePolicies } from "@/lib/queries";

export async function GET() {
  return NextResponse.json({
    domains: getDomainHealth(),
    policies: getGovernancePolicies(),
  });
}
