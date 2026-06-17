import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chromium } from "playwright";

function parseArgs(argv) {
  const args = {
    headless: false,
    saveStorage: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--config") {
      args.config = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--headless") {
      args.headless = true;
      continue;
    }
    if (token === "--no-save-storage") {
      args.saveStorage = false;
      continue;
    }
  }

  if (!args.config) {
    throw new Error("Missing required argument: --config <path>");
  }

  return args;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function resolveMaybeUrl(value, baseUrl) {
  if (!value) {
    return "";
  }

  const normalizedValue = String(value).includes(",")
    ? String(value).split(",")[0].trim().split(/\s+/)[0]
    : String(value).trim();

  try {
    return new URL(normalizedValue, baseUrl).toString();
  } catch {
    return normalizedValue;
  }
}

function replaceTemplate(inputValue, params) {
  return String(inputValue).replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value == null ? "" : String(value);
  });
}

function randomBetween(minMs, maxMs) {
  const min = Math.max(0, Number(minMs) || 0);
  const max = Math.max(min, Number(maxMs) || min);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sleep(ms) {
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function humanPause(config, stage) {
  const pacing = config.pacing || {};
  const defaultDelay = pacing.defaultDelayMs || [800, 1800];
  const perStageDelay = pacing[`${stage}DelayMs`] || defaultDelay;
  const [minMs, maxMs] = Array.isArray(perStageDelay) ? perStageDelay : [perStageDelay, perStageDelay];
  await sleep(randomBetween(minMs, maxMs));
}

function slugify(inputValue) {
  return String(inputValue || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `item-${Date.now()}`;
}

async function readConfig(configPath) {
  const configText = await fs.readFile(configPath, "utf8");
  return JSON.parse(configText);
}

async function waitForManualLogin(page, config, shouldSaveStorage, storageStatePath) {
  if (config.loginSuccessSelector) {
    console.log(`等待登录完成，检测选择器: ${config.loginSuccessSelector}`);
    await page.waitForSelector(config.loginSuccessSelector, { timeout: 0 });
  } else {
    const rl = readline.createInterface({ input, output });
    await rl.question("请在浏览器里完成登录，然后按回车继续...");
    rl.close();
  }

  if (shouldSaveStorage && storageStatePath) {
    await ensureDir(path.dirname(storageStatePath));
    await page.context().storageState({ path: storageStatePath });
    console.log(`已保存登录态: ${storageStatePath}`);
  }
}

async function extractItems(page, config) {
  const itemSelector = config.listPage?.itemSelector;
  const fields = config.listPage?.fields;
  if (!itemSelector || !fields) {
    throw new Error("config.listPage.itemSelector and config.listPage.fields are required");
  }

  const readySelector = config.listPage?.readySelector || itemSelector;
  await page.waitForSelector(readySelector, {
    timeout: config.listPage.waitMs ?? 30_000,
    state: config.listPage.waitState || "visible",
  });

  return page.$$eval(
    itemSelector,
    (nodes, fieldMap) =>
      nodes.map((node, rowIndex) => {
        const row = { rowIndex };

        for (const [key, rule] of Object.entries(fieldMap)) {
          const selectorList = Array.isArray(rule.selector) ? rule.selector : [rule.selector];
          const target = selectorList.filter(Boolean).map((selector) => node.querySelector(selector)).find(Boolean) || (!rule.selector ? node : null);
          if (!target) {
            row[key] = "";
            continue;
          }

          if (rule.type === "text") {
            row[key] = (target.textContent || "").trim();
            continue;
          }

          if (rule.type === "html") {
            row[key] = target.innerHTML || "";
            continue;
          }

          const attrNames = Array.isArray(rule.name) ? rule.name : [rule.name || "href"];
          row[key] = attrNames.map((attrName) => target.getAttribute(attrName) || "").find(Boolean) || "";
        }

        return row;
      }).filter((row) => Object.values(row).some((value) => typeof value === "string" && value.trim() !== "")),
    fields,
  );
}

async function extractDetail(page, detailPageConfig) {
  if (!detailPageConfig?.enabled) {
    return {};
  }

  if (detailPageConfig.waitForSelector) {
    await page.waitForSelector(detailPageConfig.waitForSelector, { timeout: detailPageConfig.waitMs ?? 30_000 });
  }

  return page.evaluate((cfg) => {
    const selectors = Array.isArray(cfg.imageSelector) ? cfg.imageSelector : [cfg.imageSelector || "img"];
    const imageNodes = selectors
      .filter(Boolean)
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    const detailImages = imageNodes
      .map((node) => {
        const attrNames = Array.isArray(cfg.imageAttribute) ? cfg.imageAttribute : [cfg.imageAttribute || "src"];
        return attrNames.map((attrName) => node.getAttribute(attrName) || "").find(Boolean) || "";
      })
      .filter(Boolean)
      .slice(0, cfg.maxImagesPerItem || 20);

    const descriptionText = cfg.descriptionSelector
      ? (document.querySelector(cfg.descriptionSelector)?.textContent || "").trim()
      : "";

    return {
      detailImages,
      descriptionText,
    };
  }, detailPageConfig);
}

async function downloadFile(request, url, outputPath) {
  const response = await request.get(url);
  if (!response.ok()) {
    throw new Error(`Download failed: ${response.status()} ${url}`);
  }

  const buffer = await response.body();
  await fs.writeFile(outputPath, buffer);
}

async function collectFromStartUrl(page, request, config, startUrl, imagesDir) {
  const maxPages = config.listPage?.maxPages ?? 1;
  const records = [];
  const keyword = config.currentKeyword || "";

  await page.goto(startUrl, { waitUntil: "domcontentloaded" });
  await humanPause(config, "pageLoad");

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    console.log(`采集列表页: ${page.url()} [${pageNumber}/${maxPages}]`);
    const listRows = await extractItems(page, config);

    for (const row of listRows) {
      await humanPause(config, "item");
      const detailUrl = resolveMaybeUrl(row.detailUrl, page.url());
      const imageUrl = resolveMaybeUrl(row.imageUrl, page.url());
      const itemId = row.id || slugify(`${row.title || "item"}-${pageNumber}-${row.rowIndex}`);
      const record = {
        platform: config.platform || "unknown",
        keyword,
        sourceUrl: page.url(),
        itemId,
        title: row.title || "",
        detailUrl,
        imageUrl,
      };

      if (config.detailPage?.enabled && detailUrl) {
        const detailPage = await page.context().newPage();
        try {
          await humanPause(config, "beforeDetail");
          await detailPage.goto(detailUrl, { waitUntil: "domcontentloaded" });
          await humanPause(config, "detailLoad");
          const detail = await extractDetail(detailPage, config.detailPage);
          record.description = detail.descriptionText || "";
          record.detailImages = (detail.detailImages || []).map((value) => resolveMaybeUrl(value, detailPage.url()));
        } finally {
          await detailPage.close();
        }
      }

      const candidateImages = [record.imageUrl, ...(record.detailImages || [])].filter(Boolean);
      if (config.download?.enabled !== false) {
        const storedFiles = [];
        for (let index = 0; index < candidateImages.length; index += 1) {
          const candidateUrl = candidateImages[index];
          const ext = path.extname(new URL(candidateUrl).pathname) || ".jpg";
          const outputName = `${slugify(itemId)}-${index + 1}${ext}`;
          const outputPath = path.join(imagesDir, outputName);
          try {
            await humanPause(config, "download");
            await downloadFile(request, candidateUrl, outputPath);
            storedFiles.push(outputPath);
          } catch (error) {
            console.warn(`跳过下载失败的图片: ${candidateUrl}`);
            console.warn(String(error));
          }
        }
        record.localImages = storedFiles;
      }

      records.push(record);
    }

    const nextSelector = config.listPage?.nextPageSelector;
    if (!nextSelector || pageNumber >= maxPages) {
      break;
    }

    const nextButton = await page.$(nextSelector);
    if (!nextButton) {
      break;
    }

    await Promise.all([
      page.waitForLoadState("domcontentloaded"),
      nextButton.click(),
    ]);
    await humanPause(config, "pagination");
  }

  return records;
}

async function writeOutputs(outputDir, records, config) {
  const manifestPath = path.join(outputDir, "materials.jsonl");
  const evalCasesPath = path.join(outputDir, "eval_cases.jsonl");
  const shouldWriteManifest = config.outputs?.manifest !== false;
  const shouldWriteEvalCases = config.outputs?.evalCases !== false;

  if (shouldWriteManifest) {
    const manifest = records.map((record) => JSON.stringify(record)).join("\n");
    await fs.writeFile(manifestPath, `${manifest}\n`, "utf8");
  }

  if (shouldWriteEvalCases) {
    const evalCases = records
      .filter((record) => Array.isArray(record.localImages) && record.localImages.length > 0)
      .map((record) =>
        JSON.stringify({
          case_id: record.itemId,
          bucket: record.platform,
          image_path: record.localImages[0],
          prompt: record.title || record.description || "请生成电商商品图",
          negative_prompt: "",
          expected_ocr: [],
          meta: {
            source_url: record.detailUrl || record.sourceUrl,
            extra_images: record.localImages.slice(1),
            keyword: record.keyword || "",
          },
        }),
      )
      .join("\n");

    await fs.writeFile(evalCasesPath, evalCases ? `${evalCases}\n` : "", "utf8");
  }
  return { manifestPath, evalCasesPath };
}

function buildStartJobs(config) {
  if (Array.isArray(config.startUrls) && config.startUrls.length > 0) {
    return config.startUrls.map((startUrl) => ({ startUrl, keyword: "" }));
  }

  const keywords = config.keywords || [];
  const searchUrlTemplate = config.searchUrlTemplate;
  if (!searchUrlTemplate || keywords.length === 0) {
    throw new Error("config.startUrls or config.searchUrlTemplate + config.keywords is required");
  }

  return keywords.map((keyword) => ({
    keyword,
    startUrl: replaceTemplate(searchUrlTemplate, {
      keyword,
      keywordEncoded: encodeURIComponent(keyword),
    }),
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configPath = path.resolve(args.config);
  const config = await readConfig(configPath);
  const outputDir = path.resolve(config.outputDir || "tools/material_collector/output");
  const imagesDir = path.join(outputDir, "images");
  const storageStatePath = config.storageStatePath ? path.resolve(config.storageStatePath) : "";

  await ensureDir(outputDir);
  await ensureDir(imagesDir);

  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext(
    storageStatePath && (await pathExists(storageStatePath)) ? { storageState: storageStatePath } : {},
  );
  const page = await context.newPage();

  try {
    const jobs = buildStartJobs(config);

    await page.goto(jobs[0].startUrl, { waitUntil: "domcontentloaded" });

    if (!(storageStatePath && (await pathExists(storageStatePath)))) {
      await waitForManualLogin(page, config, args.saveStorage, storageStatePath);
    }

    const records = [];
    for (const job of jobs) {
      const scopedConfig = { ...config, currentKeyword: job.keyword };
      const rows = await collectFromStartUrl(page, page.request, scopedConfig, job.startUrl, imagesDir);
      records.push(...rows);
    }

    const { manifestPath, evalCasesPath } = await writeOutputs(outputDir, records, config);
    console.log(`采集完成，共 ${records.length} 条`);
    if (config.outputs?.manifest !== false) {
      console.log(`物料清单: ${manifestPath}`);
    }
    if (config.outputs?.evalCases !== false) {
      console.log(`评测样本: ${evalCasesPath}`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
