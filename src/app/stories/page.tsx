import { getMeshOverview } from "@/lib/queries";
import StoriesClient from "./StoriesClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function StoriesPage() {
  const overview = getMeshOverview() as any;

  return <StoriesClient overview={overview} />;
}
