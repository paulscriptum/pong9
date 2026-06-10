import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 716, height: 452 } });
await page.goto("http://localhost:53897", { waitUntil: "networkidle" });
await page.evaluate(() => window.onUserTap());
await page.waitForTimeout(800);
const out = "/Users/pavelshchepochkin/pong v8/screenshot-check.png";
await page.screenshot({ path: out });
await browser.close();
console.log("screenshot-check.png");
