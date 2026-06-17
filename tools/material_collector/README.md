# 电商测试物料采集脚本

这个目录提供一个可配置的 Playwright 采集模板，用来做“授权登录后的物料采集”，目标是给 `tools/eval_pipeline` 产出测试集，而不是做通用绕过式爬虫。

## 适用场景

- 你有平台账号，允许查看这些商品或素材
- 你需要批量抓标题、详情链接、主图、详情图
- 你要把采集结果接到现有评测流水线里

不建议直接抓取受平台协议限制的数据。优先顺序应当是：

1. 官方开放 API / 商家数据导出
2. 你自己账号下可见页面的浏览器自动化采集
3. 最后才是 DOM 级采集模板

## 文件

- `collect_materials.mjs`：采集脚本
- `example.config.json`：配置示例

## 配置说明

核心配置如下：

```json
{
  "platform": "demo-shop",
  "startUrls": ["https://example.com/products"],
  "outputDir": "tools/material_collector/output/demo-shop",
  "storageStatePath": "tools/material_collector/.auth/demo-shop.json",
  "loginSuccessSelector": ".product-list",
  "listPage": {
    "itemSelector": ".product-card",
    "maxPages": 2,
    "nextPageSelector": ".pagination-next",
    "fields": {
      "id": { "type": "attr", "selector": "[data-item-id]", "name": "data-item-id" },
      "title": { "type": "text", "selector": ".product-title" },
      "detailUrl": { "type": "attr", "selector": "a.product-link", "name": "href" },
      "imageUrl": { "type": "attr", "selector": "img.product-image", "name": "src" }
    }
  },
  "detailPage": {
    "enabled": true,
    "waitForSelector": ".gallery",
    "imageSelector": ".gallery img",
    "descriptionSelector": ".product-title"
  }
}
```

## 运行

第一次建议带界面运行，手工登录并保存登录态：

```bash
node tools/material_collector/collect_materials.mjs \
  --config tools/material_collector/example.config.json
```

后续复用登录态：

```bash
node tools/material_collector/collect_materials.mjs \
  --config tools/material_collector/example.config.json \
  --headless
```

## 输出

脚本会产出两个文件：

- `materials.jsonl`：完整采集结果
- `eval_cases.jsonl`：可直接接 `tools/eval_pipeline/run_eval.py` 的测试样本

如果只想下载图片，可以在配置里设置：

```json
{
  "outputs": {
    "manifest": true,
    "evalCases": false
  }
}
```

目录结构示例：

```text
tools/material_collector/output/demo-shop/
  images/
  materials.jsonl
  eval_cases.jsonl
```

## 接到现有评测流水线

如果你已经有生成脚本：

```bash
python3 tools/eval_pipeline/run_eval.py \
  --cases tools/material_collector/output/demo-shop/eval_cases.jsonl \
  --run-id demo_shop_v1 \
  --command-template "python3 your_generate.py --input {image_path} --prompt {prompt} --output {output_path}"
```

## 建议的实现方式

如果你要长期用，建议按下面三层拆分：

1. `source adapter`
   负责不同平台的选择器和翻页逻辑，不要写死在主流程里。
2. `normalizer`
   把标题、主图、详情图、类目统一成同一份 JSON 结构。
3. `evaluator input builder`
   把采集结果转成 `eval_cases.jsonl`，便于跑回归。

如果你告诉我具体平台，比如淘宝、1688、拼多多、Shopee 或 Amazon，我可以继续把这个模板改成对应页面结构的可运行版本。

## 淘宝示例

当前示例配置已经改成淘宝搜索 `手机壳` 前 3 页，下载搜索结果主图和详情页图片：

```bash
npm run collect:materials -- --config tools/material_collector/example.config.json
```

注意：

- 第一次需要你在打开的浏览器里手工完成淘宝登录。
- 淘宝搜索页和详情页 DOM 结构会变，示例选择器做了容错，但仍可能需要按你实际打开的页面微调。
- 如果页面出现滑块、风控、人机验证，这部分需要人工完成，脚本不会绕过。
- 配置里的 `pacing` 用于降低请求频率，按“串行 + 随机停顿”方式采集，更接近人工操作节奏。
