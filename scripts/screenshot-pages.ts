/**
 * Captures screenshots of all MeshLens pages for review.
 * Run: npx tsx scripts/screenshot-pages.ts
 * Requires: npm run dev (must be running on localhost:3000)
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "screenshots");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1024 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  try {
    // 1. Landing page - initial view
    console.log("Capturing landing page...");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "01-landing-hero.png"), fullPage: false });

    // 2. Scrollytelling sections - scroll through landing page
    const scrollSteps = [
      { name: "02-landing-scroll-1", scrollY: 400 },
      { name: "03-landing-scroll-2", scrollY: 900 },
      { name: "04-landing-scroll-3", scrollY: 1400 },
      { name: "05-landing-scroll-4", scrollY: 1900 },
      { name: "06-landing-scroll-5", scrollY: 2400 },
      { name: "07-landing-scroll-6", scrollY: 2900 },
      { name: "08-landing-scroll-7", scrollY: 3400 },
      { name: "09-landing-scroll-8", scrollY: 3900 },
      { name: "10-landing-cta", scrollY: 99999 }, // bottom
    ];

    for (const step of scrollSteps) {
      await page.evaluate((y) => window.scrollTo(0, y), step.scrollY);
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUTPUT_DIR, `${step.name}.png`), fullPage: false });
    }

    // 3. Reset scroll and capture full page
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "01b-landing-full.png"), fullPage: true });

    // 4. Exec page
    console.log("Capturing /exec...");
    await page.goto(`${BASE_URL}/exec`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "11-exec.png"), fullPage: true });

    // 5. Business page
    console.log("Capturing /business...");
    await page.goto(`${BASE_URL}/business`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "12-business.png"), fullPage: true });

    // 6. Dev page
    console.log("Capturing /dev...");
    await page.goto(`${BASE_URL}/dev`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "13-dev.png"), fullPage: true });

    // 7. Dev page - other tabs
    await page.click('button:has-text("Pipelines")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "14-dev-pipelines.png"), fullPage: true });

    await page.click('button:has-text("Errors")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "15-dev-errors.png"), fullPage: true });

    await page.click('button:has-text("Schema")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "16-dev-schema.png"), fullPage: true });

    console.log(`\nScreenshots saved to ${OUTPUT_DIR}/`);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
