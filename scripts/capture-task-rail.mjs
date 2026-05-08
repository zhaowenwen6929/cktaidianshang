import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = "/Users/zhaowenwen/CODEX/CKTAI电商/docs/screenshots/task-rail";
fs.mkdirSync(outDir, { recursive: true });

const pageUrl = "http://127.0.0.1:4173/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1720, height: 980 } });

await page.goto(pageUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.screenshot({ path: path.join(outDir, "00-full-initial.png"), fullPage: true });

const workspaceEntry = page.getByText("工作台", { exact: false }).first();
if ((await workspaceEntry.count()) > 0) {
  await workspaceEntry.click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
}

const rail = page.locator(".ck-task-rail").first();
await rail.waitFor({ state: "visible", timeout: 15000 });
await rail.screenshot({ path: path.join(outDir, "01-expanded-default.png") });

// Switch to a preset tool with task records.
const primaryAIGoods = page.getByText("AI商品图", { exact: false }).first();
if ((await primaryAIGoods.count()) > 0) {
  await primaryAIGoods.click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
}
const toolMarketing = page.getByText("一键营销主图", { exact: false }).first();
if ((await toolMarketing.count()) > 0) {
  await toolMarketing.click({ force: true }).catch(() => {});
  await page.waitForTimeout(700);
}
await rail.screenshot({ path: path.join(outDir, "02-expanded-with-records.png") });

const firstCard = page.locator(".ck-task-card").first();
if ((await firstCard.count()) > 0) {
  await firstCard.click();
  await page.waitForTimeout(400);
  await rail.screenshot({ path: path.join(outDir, "03-expanded-selected.png") });
}

const collapse = page.locator(".ck-task-rail .ck-task-rail-handle.expand").first();
if ((await collapse.count()) > 0) {
  await collapse.click();
  await page.waitForTimeout(300);
  const collapsedHandle = page.locator(".ck-task-rail .ck-task-rail-handle.collapse").first();
  await collapsedHandle.screenshot({ path: path.join(outDir, "04-collapsed.png") });
  const expand = collapsedHandle;
  if ((await expand.count()) > 0) {
    await expand.click();
    await page.waitForTimeout(300);
  }
}

const generatingBadge = page.locator(".ck-task-card-badge.is-generating").first();
if ((await generatingBadge.count()) > 0) {
  await rail.screenshot({ path: path.join(outDir, "05-generating-state.png") });
}

const candidateTools = ["素材智能抠图", "侵权检测", "图文翻译", "视频翻译", "商品场景图"];
let emptyCaptured = false;
for (const label of candidateTools) {
  const entry = page.getByText(label, { exact: false }).first();
  if ((await entry.count()) === 0) continue;
  await entry.click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  if ((await page.locator(".ck-task-rail-empty").count()) > 0) {
    await rail.screenshot({ path: path.join(outDir, "06-empty-state.png") });
    emptyCaptured = true;
    break;
  }
}

await browser.close();
console.log(JSON.stringify({ outDir, emptyCaptured }));
