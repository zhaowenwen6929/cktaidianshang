import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "/Users/zhaowenwen/CODEX/CKTAI电商/docs/screenshots/ai-goods-tools";
fs.mkdirSync(outDir, { recursive: true });

const tools = [
  { key: "goods-marketing", label: "一键营销主图" },
  { key: "goods-white", label: "一键白底图" },
  { key: "goods-buyer", label: "一键买家秀" },
  { key: "goods-scene", label: "一键场景图" },
  { key: "goods-detail", label: "一键细节图" },
  { key: "goods-sell", label: "一键卖点图" },
  { key: "goods-spoke", label: "一键代言图" },
  { key: "goods-view", label: "一键三视角" },
  { key: "goods-retouch", label: "产品精修" },
  { key: "goods-bg", label: "AI换背景" },
  { key: "goods-translate", label: "图片翻译" }
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1720, height: 980 } });
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const workspaceEntry = page.getByText("工作台", { exact: false }).first();
if ((await workspaceEntry.count()) > 0) {
  await workspaceEntry.click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
}

const aiGoods = page.getByText("AI商品图", { exact: false }).first();
if ((await aiGoods.count()) > 0) {
  await aiGoods.click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
}

await page.screenshot({ path: path.join(outDir, "00-ai-goods-overview.png"), fullPage: true });

for (const [index, tool] of tools.entries()) {
  const entry = page.getByText(tool.label, { exact: false }).first();
  if ((await entry.count()) > 0) {
    await entry.click({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
  }

  const safe = `${String(index + 1).padStart(2, "0")}-${tool.key}`;
  await page.screenshot({ path: path.join(outDir, `${safe}-full.png`), fullPage: true });
  const config = page.locator(".ck-config-panel").first();
  if ((await config.count()) > 0) {
    await config.screenshot({ path: path.join(outDir, `${safe}-config.png`) });
  }
}

await browser.close();
console.log(JSON.stringify({ outDir, count: tools.length }));
