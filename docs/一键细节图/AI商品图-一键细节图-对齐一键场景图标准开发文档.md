# AI商品图-一键细节图-对齐一键场景图标准开发文档

> 适用功能：`goods-detail`（一键细节图）  
> 标准来源：对齐 `goods-scene`（一键场景图）规则配置与提示词组装标准  
> 更新时间：2026-05-09

配套文件：

- [AI商品图-一键细节图-platform_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键细节图/AI商品图-一键细节图-platform_rules.json)
- [AI商品图-一键细节图-category_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键细节图/AI商品图-一键细节图-category_rules.json)
- [AI商品图-一键细节图-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键细节图/AI商品图-一键细节图-category_dimension_direction_rules.json)
- [AI商品图-一键细节图-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键细节图/AI商品图-一键细节图-option_value_expansions.json)
- [AI商品图-一键细节图-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键细节图/AI商品图-一键细节图-prompt_builder_template.json)
- [AI商品图-一键细节图-prompt_builder_demo.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/一键细节图/AI商品图-一键细节图-prompt_builder_demo.json)

## 1. Source of Truth（真实功能与参数）

来源：[src/App.tsx](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)

1. `toolKey`: `goods-detail`
2. `creationModeConfigKey`: `spoke`
3. `sectionOrder`: `upload-main -> creation-mode -> advanced-settings -> supplement -> upload-reference`
4. 上传限制：
- `upload-main.maxCount = 24`
- `upload-reference.maxCount = 1`
5. 高级设置字段（真实）：
- `productType`（产品类型）
- `displayType`（展示形式）
6. `advancedSettings.showAiAssist = false`（当前页不展示 AI 帮写入口）

## 2. 对齐场景图标准后的规则分层

为满足“不同品类、维度、方向”规则配置，按以下层级执行：

1. 平台规则：`platform_rules.json`（`platformInfo -> prompt/required/forbidden`）
2. 品类规则：`category_rules.json`（`productCategory -> prompt/required/forbidden`）
3. 品类-维度-方向规则：`category_dimension_direction_rules.json`
- 品类：`detailCategory`
- 维度：`detailDimension`（结构/材质/工艺/功能/对比）
- 方向：`detailDirection`（正面/侧面/背面/俯拍/微距）
4. 字段值扩展：`option_value_expansions.json`
- `productType`
- `displayType`
- `platformInfo`
- `detailDimension`
- `detailDirection`

## 3. 业务流程、交互与积分消耗

## 3.1 用户交互流程

1. 上传商品图（最多24张）。
2. 选择创作模式（普通/高级/中文增强，含比例、分辨率、数量）。
3. 配置高级设置（产品类型、展示形式）。
4. 填写细节补充（可选）。
5. 上传参考图（可选，最多1张）。
6. 生成并查看结果；支持继续调参二次生成。

## 3.2 服务端编排流程（建议落地）

1. 图片识别：提取 `productCategory/productType/detailDimension/detailDirection` 候选。
2. 规则命中：按平台、品类、维度、方向命中配置。
3. Prompt 拼装：按第 4 节严格顺序拼接 `finalPrompt` 和 `finalNegativePrompt`。
4. 计费校验：计算总积分并扣减；存储容量同步扣减。
5. 生成执行：提交模型生成。
6. 结果回写：持久化快照、命中规则、prompt hash、积分消耗。

## 3.3 积分消耗（按当前项目口径）

依据 [AI功能积分计算规则（按白底图口径补齐）](/Users/zhaowenwen/CODEX/CKTAI电商/docs/AI功能积分计算规则（按白底图口径补齐）.md)：

1. 一键细节图默认档：
- 普通：`1`
- 高级：`1K=2 / 2K=3 / 4K=5`
2. 计费公式：`总积分 = sourceCount * unitCreditCost * count`
3. 每次提交并行扣减存储容量：`24MB`

## 4. 最终提示词拼装顺序（严格）

固定顺序：

1. 任务目标段（细节图任务定义）
2. 品类规则段（`productCategory`）
3. 平台规则段（`platformInfo`）
4. 品类-维度-方向规则段（`detailCategory/detailDimension/detailDirection`）
5. 参数段（显式列字段）
6. 字段值扩展段（`valuePrompt`）
7. `required` 段（先品类后平台再维度方向）
8. `forbidden` 段（先品类后平台再维度方向）
9. 通用负向段（固定）
10. 通用质量段（固定）
11. 用户补充段（可选）
12. 参考图约束段（可选）

硬约束：

- `required/forbidden/通用负向/通用质量` 禁止裁剪。
- 超长仅允许裁剪 `valuePrompt` 与平台正文的低优先级描述。

## 5. 通用负向与质量要求（固定）

## 5.1 通用负向

1. 严禁改变商品SKU本体结构、关键部件位置、材质属性和颜色关系。
2. 严禁虚构原图不存在的接口、纹理、工艺层、配件或功能构造。
3. 严禁局部放大区域与整体商品不一致，或出现错误拼接。
4. 严禁过度锐化、过度磨皮、噪点涂抹导致材质失真。
5. 严禁违规水印、联系方式、二维码、侵权Logo、误导性功效表达。

## 5.2 通用质量

1. 局部焦点明确，用户能一眼看懂“放大的是哪里”。
2. 局部与整体强一致，结构、比例、透视、光线逻辑一致。
3. 材质/纹理/工艺可辨，边缘干净，无脏边和融边。
4. 商业可用，适合电商详情页和附图场景稳定使用。
5. 多图生成时风格统一，细节表达口径一致。

## 6. 识别与回填（建议）

建议识别输出：

```json
{
  "productCategory": "家电数码类",
  "productType": "蓝牙耳机",
  "displayType": "细节 + 功能关联",
  "detailDimension": "功能细节",
  "detailDirection": "微距",
  "confidence": 0.92,
  "needsUserConfirm": false,
  "evidence": ["检测到触控区", "检测到充电触点与铰链"]
}
```

回填策略：

1. 仅可回填命中 options 的值；未命中置空并标记 `needsUserConfirm=true`。
2. 品类未命中时回退 `通用品类`。
3. 维度/方向未命中时回退 `自动`。
4. 自动回填结果始终允许用户手动覆盖。

## 7. 开发落地清单

1. 前端：若需要“维度/方向”可视化控制，新增 `detailDimension/detailDirection` 字段。
2. 后端：接入 4 份规则 JSON + 模板 JSON，严格按顺序拼接。
3. 任务快照：新增持久化 `appliedRules/finalPromptHash/creditCost`。
4. 监控：记录规则命中率、识别回填命中率、失败回退率。
5. 回归：覆盖 16 平台 x 12 品类 x 5 维度 x 6 方向采样。
