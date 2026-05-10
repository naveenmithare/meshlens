import { getMeshOverview, getDomainHealth } from "@/lib/queries";
import StoriesClient from "./StoriesClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function StoriesPage() {
  const overview = getMeshOverview() as any;
  const domains = getDomainHealth() as any[];

  return <StoriesClient overview={overview} domains={domains} />;
}
