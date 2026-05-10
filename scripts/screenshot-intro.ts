/**
 * Captures screenshots of the /intro page for review.
 * Run: npx tsx scripts/screenshot-intro.ts
 * Requires: npm run dev (must be running on localhost:3000)
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "http://localhost:3000/intro";
const OUTPUT_DIR = path.join(process.cwd(), "screenshots-intro");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  try {
    console.log("Loading /intro...");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 1. Hero section (top of page)
    console.log("Screenshot 1: Hero section");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "01-hero-problem-solution.png"), fullPage: false });

    // 2. Section 01 "Meet Orange Co" with "How Orange Co Operates" grid (7 items including Support)
    console.log("Screenshot 2: Section 01 - Meet Orange Co");
    await page.evaluate(() => window.scrollTo(0, 1100));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "02-section01-meet-orange-co.png"), fullPage: false });

    // 3. Section 03 - Product breakdown banner + Product Flow diagram
    console.log("Screenshot 3: Section 03 - Product breakdown");
    await page.evaluate(() => window.scrollTo(0, 2800));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "03-section03-product-breakdown.png"), fullPage: false });

    // 4. Section 04 - Tech Stack Architecture
    console.log("Screenshot 4: Section 04 - Tech Stack");
    await page.evaluate(() => window.scrollTo(0, 4500));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "04-section04-tech-stack.png"), fullPage: false });

    console.log(`\nScreenshots saved to ${OUTPUT_DIR}/`);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
