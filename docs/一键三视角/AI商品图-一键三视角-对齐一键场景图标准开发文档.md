# AI商品图-一键三视角-对齐一键场景图标准开发文档

> 适用功能：`goods-view`（一键三视角）  
> 目标：基于真实代码参数与业务流程，按“一键场景图”标准完善规则配置、提示词拼装顺序、通用负向与质量要求，供开发直接接入。  
> 更新时间：2026-05-09  
> 配套规则文件：
> - [AI商品图-一键三视角-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键三视角/AI商品图-一键三视角-mode_rules.json)
> - [AI商品图-一键三视角-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键三视角/AI商品图-一键三视角-category_dimension_direction_rules.json)
> - [AI商品图-一键三视角-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键三视角/AI商品图-一键三视角-option_value_expansions.json)

## 1. 真实功能与参数（Source of Truth）

代码来源：[src/App.tsx](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `goods-view`
2. `creationModeConfigKey`: `three-view`
3. `sectionOrder`: `["upload-main", "camera-angle", "creation-mode", "advanced-settings"]`
4. 上传限制：`upload-main.maxCount = 24`
5. 高级设置：仅 `platformInfo`（`input-select`）+ 条件 `platformRuleDetail`
6. `showAiAssist = false`
7. `showSupplement = false`

真实字段：

- `cameraAngle`（必填）
- `platformInfo`（可选，支持预置和自定义）
- `platformRuleDetail`（当 `platformInfo` 为自定义值时出现）
- `modeId`: `normal | advanced`
- `ratio`: `自适应尺寸 | 1:1 | 4:3 | 3:2`
- `resolution`（仅 advanced）：`1K | 2K | 4K`
- `count`: `1 | 2`
- `mainUploads`: 最多24张

## 2. 业务流程、交互与积分消耗

### 2.1 端到端流程

1. 上传商品图。
2. 选择拍摄视角（单视角或品类推荐视角）。
3. 选择创作模式与出图参数（比例、分辨率、数量）。
4. 填写平台信息；若为自定义平台，补充 `platformRuleDetail`。
5. 系统按严格顺序拼装提示词并提交生成。
6. 扣减积分与存储，进入排队/生成状态。
7. 结果返回后可继续调参二次生成。

### 2.2 交互规则

1. `cameraAngle` 必填。
2. `platformInfo` 允许自由输入；命中非预置值时必须填写 `platformRuleDetail`。
3. 当前页面不展示补充说明输入，不走补充说明润色。
4. 当前页面不展示 AI Assist 按钮。

### 2.3 积分与存储

一键三视角按“常规图片类”计费：

- 总积分公式：`总积分 = 上传张数 * unitCreditCost * 出图数量`
- 普通模式：`unitCreditCost = 2`
- 高级模式：`1K=4, 2K=6, 4K=8`
- 每次提交固定扣减存储：`24MB`

示例：

- 上传2张，普通模式，出图2张：`2 * 2 * 2 = 8积分`
- 上传1张，高级模式2K，出图2张：`1 * 6 * 2 = 12积分`

## 3. 规则分层（按一键场景图标准）

1. 一级规则：`mode_rules`（normal/advanced）
2. 二级规则：`category_dimension_direction_rules`（品类、维度、方向）
3. 三级规则：`option_value_expansions`（字段值扩展）
4. 固定硬约束：`universalNegativePrompt`、`universalQualityPrompt`

说明：

- `productCategory` 非当前页面显式字段，建议由图片识别或商品结构化服务注入拼装层。
- 未注入时回退 `通用品类`。

## 4. 最终提示词拼装顺序（严格）

1. 任务目标段
2. 模式规则正文段（`modeRule.prompt`）
3. 参数段（`cameraAngle / mode / ratio / resolution / count`）
4. 二级增强段（`category + dimension + direction`）
5. 字段值扩展段（`cameraAngle.valuePrompt + platformInfo.valuePrompt`）
6. 模式 `required` 段
7. 模式 `forbidden` 段
8. 通用负向段
9. 通用质量段
10. 平台细节补充段（`platformRuleDetail`，有值才拼）

## 5. 字段与来源映射

| 字段 | 来源 | 是否必填 | 用途 |
| --- | --- | --- | --- |
| `cameraAngle` | 页面 `camera-angle` | 是 | 视角主约束 + 值扩展 |
| `platformInfo` | 页面 `advanced-settings` | 否 | 平台合规约束 |
| `platformRuleDetail` | 条件字段 | 条件必填 | 自定义平台细节 |
| `modeId` | `creation-mode` | 是 | 模型与积分档位 |
| `ratio` | `creation-mode` | 是 | 构图比例约束 |
| `resolution` | `creation-mode` | advanced必填 | 清晰度约束与计费 |
| `count` | `creation-mode` | 是 | 出图数量 |
| `productCategory` | 识别/上游注入 | 建议 | 品类结构约束 |

## 6. 拼接模板（开发可直接用）

```text
任务目标：生成电商商品三视角展示图，确保视角互补、结构真实和跨视图一致。

模式规则：{modePrompt}

生成参数：拍摄视角={cameraAngle}；创作模式={modeId}；出图比例={ratio}；出图分辨率={resolutionOrDefault}；出图数量={count}。

品类与维度增强：{categoryPrompt} {dimensionPrompt} {directionPrompt}

字段扩展：{cameraAngleValuePrompt} {platformInfoValuePrompt}

必须满足：{requiredJoined}

禁止：{forbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

平台细节补充：{platformRuleDetail}
```

## 7. 组装伪代码

```ts
function buildGoodsViewPrompt(input) {
  const mode = input.modeId ?? "normal";
  const ratio = input.ratio ?? "自适应尺寸";
  const resolution = mode === "advanced" ? input.resolution ?? "1K" : "默认";
  const category = input.productCategory ?? "通用品类";

  const modeRule = modeRules.modeRulesByTool[mode];
  const categoryPrompt = categoryRules.categoryRulesByTool[category]?.prompt ?? categoryRules.categoryRulesByTool["通用品类"].prompt;
  const dimensionPrompt = categoryRules.dimensionRulesByTool["结构完整性"]?.prompt ?? "";
  const directionPrompt = categoryRules.directionRulesByTool["品类推荐三视角"]?.prompt ?? "";

  const cameraAngleValuePrompt =
    valueExpansions.optionValueExpansionsByTool.cameraAngle.values[input.cameraAngle]?.valuePrompt ?? "";
  const platformInfoValuePrompt =
    valueExpansions.optionValueExpansionsByTool.platformInfo.values[input.platformInfo]?.valuePrompt ??
    valueExpansions.optionValueExpansionsByTool.platformInfo.values["无平台信息"].valuePrompt;

  if (!cameraAngleValuePrompt) throw new Error("cameraAngle 未命中扩展规则");
  if (isCustomPlatform(input.platformInfo) && !input.platformRuleDetail?.trim()) {
    throw new Error("自定义平台必须填写 platformRuleDetail");
  }

  return [
    "任务目标：生成电商商品三视角展示图，确保视角互补、结构真实和跨视图一致。",
    `模式规则：${modeRule.prompt}`,
    `生成参数：拍摄视角=${input.cameraAngle}；创作模式=${mode}；出图比例=${ratio}；出图分辨率=${resolution}；出图数量=${input.count ?? "1"}。`,
    `品类与维度增强：${categoryPrompt} ${dimensionPrompt} ${directionPrompt}`.trim(),
    `字段扩展：${cameraAngleValuePrompt} ${platformInfoValuePrompt}`.trim(),
    `必须满足：${Array.from(new Set(modeRule.required ?? [])).join("、")}。`,
    `禁止：${Array.from(new Set(modeRule.forbidden ?? [])).join("、")}。`,
    modeRules.universalNegativePrompt,
    modeRules.universalQualityPrompt,
    input.platformRuleDetail?.trim() ? `平台细节补充：${input.platformRuleDetail.trim()}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}
```

## 8. Demo

### 8.1 输入

```json
{
  "toolKey": "goods-view",
  "cameraAngle": "鞋靴类",
  "platformInfo": "亚马逊",
  "modeId": "advanced",
  "ratio": "1:1",
  "resolution": "1K",
  "count": "1",
  "productCategory": "鞋靴类"
}
```

### 8.2 输出（示例）

```text
任务目标：生成电商商品三视角展示图，确保视角互补、结构真实和跨视图一致。

模式规则：使用高级模式生成高分辨率商品三视角图，在普通模式基础上进一步强化细节保真、纹理稳定和结构精度。

生成参数：拍摄视角=鞋靴类；创作模式=advanced；出图比例=1:1；出图分辨率=1K；出图数量=1。

品类与维度增强：优先展示鞋面识别、侧轮廓、后跟与鞋底结构，保持鞋型、鞋带、底纹一致。重点确保结构线条闭合、零部件关系正确，不省略关键结构面。按品类推荐视角输出三张图，默认遵循“主识别面 -> 侧向结构面 -> 背/底/顶补充面”的顺序。

字段扩展：按鞋靴推荐三视角输出：鞋面识别 -> 侧轮廓/厚度 -> 后跟或鞋底纹路，保持鞋型和底纹一致。首图按纯白主图标准执行，仅展示售卖商品；后续图补侧面、背面、底部或细节。

必须满足：细节区域可辨识（纹理、走线、接口、开孔、铭文区域）、三视图尺度关系稳定，透视合理、高分辨率下无锯齿、重影、脏边。

禁止：高分辨率下细节涂抹、局部结构错位、视角切换导致比例跳变。
```

## 9. 落地注意事项

1. 若后续开启补充说明：需把 `three-view.showSupplement` 改为 `true`，并将 `supplement` 加入 `sectionOrder`。
2. 若后续开启 AI Assist：需把 `goods-view.advancedSettings.showAiAssist` 改为 `true`，并扩展回填字段（至少含 `cameraAngle` 推荐与 `productCategory`）。
3. 提示词超长裁剪时，仅允许裁剪顺序：`valuePrompt -> category/dimension/direction -> modeRule.prompt`；不得裁剪 `required/forbidden/通用负向/通用质量`。
4. 建议持久化任务快照字段：`cameraAngle/platformInfo/platformRuleDetail/modeId/ratio/resolution/count/finalPrompt`。
