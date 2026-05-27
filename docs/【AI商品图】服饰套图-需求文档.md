# 【AI商品图】服饰套图-需求文档

## 使用流程
1. 上传服装图片（`upload-main`）
2. 配置基准模特（`baseline-model-setup`）
3. 生成推荐场景（step1）
4. 编辑推荐场景模块
5. 生成套图结果（step2）

## 端到端使用流程
1. 用户上传同一件服装的多视角图片，最多 `5` 张。
2. 用户在“基准模特设置”中选择模特来源：
   - 使用“AI 生成模特”
   - 使用“我的模特”
3. 若选择 AI 生成模特，用户需补齐 `性别 / 外貌 / 年龄 / 人设 / 体型`；若选择我的模特，需选中一个已有模特资产。
4. 用户点击“生成推荐场景”，系统基于服装图与模特设定生成 `fashionSceneSummary` 和 `fashionSceneModules`。
5. 系统默认返回 `6` 个服饰场景模块，覆盖首图上身、街拍通勤、面料细节、动态动作、半身近景、生活方式氛围等常见图位。
6. 用户可对场景模块执行删除、拖拽排序、文案编辑。
7. 用户点击“生成套图结果”，系统把当前场景模块转换为 `setPackSelectedTypes`，并按 `set-pack` 套图生成链路提交。
8. 系统按场景模块逐条生成结果图，进入结果区与任务中心统一管理。
9. 若 step1 之后左侧输入发生变化，系统阻断 step2，并提示用户重新生成推荐场景。

## 高级设置字段与可选值

说明：

- `set-fashion` 当前页面没有通用 `advanced-settings` 区块，但存在等价的 `baseline-model-setup` 配置区。
- 从需求文档口径，应将“基准模特设置”视为本功能的核心高级设置。
- 这些字段既参与 step1 推荐场景生成，也参与 step2 最终提示词拼接。
- `modelGenerateType` 当前不是界面显式选项，而是系统默认写入的内部字段。

```json
{
  "advancedFields": {
    "baselineModelSource": ["AI生成", "我的模特"],
    "gender": ["男", "女"],
    "appearance": ["欧美白人", "中国人", "亚洲人", "东南亚人", "非裔", "中东人", "拉丁裔"],
    "age": ["青少年", "青年", "中年", "老年"],
    "persona": ["上班族", "测评博主", "学生", "健身人群", "家庭主妇", "其他"],
    "bodyType": ["纤细", "标准", "微胖", "大码"],
    "baselineModelSupplement": ["用户自由补充，不预设枚举"],
    "productCategory": ["识别链路回填，建议含上装、下装、裙装、外套、套装、童装、运动服等细分"],
    "direction": ["正面", "侧面", "三分之二侧", "背面", "俯拍", "局部特写"]
  }
}
```

补充说明：

- 当 `baselineModelSource=我的模特` 时，实际必填字段为 `selectedModelId / selectedModelName`，不再强制用户填写 AI 模特参数。
- 当前前端默认 `modelGenerateType=真人模特图`，但页面不展示该选项；需求文档保留字段是为了研发理解内部默认值和后续扩展能力。
- `productCategory` 和 `direction` 当前不是前端显式表单，建议由识别链路、回填逻辑或服务端默认策略补齐。

## 需求模板补充说明

### 功能定位

- 功能名称：`服饰套图`
- 工具 Key：`set-fashion`
- 所属一级分组：`电商套图`
- 能力定位：围绕单件服饰商品，先生成推荐穿搭/展示场景，再一次性产出成套服饰营销图
- 主要服务对象：服饰商家、跨境运营、内容运营、服装设计与上新团队

### 设计目标

- 不直接让用户手填复杂套图类型，而是先给出可编辑的服饰场景推荐结果
- 不是单纯“模特试穿”，而是将模特、场景、版型表达、图位结构统一到套图工作流中
- 强调上身效果、版型、面料、穿搭氛围和场景一致性，适合用于封面图、详情图、社媒内容图

### 字段与默认值约定

```json
{
  "fieldSource": {
    "mainUploads": "用户上传",
    "baselineModelSource": "用户选择",
    "selectedModelId": "用户从我的模特中选择",
    "modelGenerateType": "系统默认真人模特图，不在界面显式展示",
    "gender": "用户选择（AI模特）",
    "appearance": "用户选择（AI模特）",
    "age": "用户选择（AI模特）",
    "persona": "用户选择（AI模特）",
    "bodyType": "用户选择（AI模特）",
    "baselineModelSupplement": "用户补充",
    "fashionSceneModules": "系统生成后由用户确认/编辑",
    "setPackSelectedTypes": "由fashionSceneModules转换"
  },
  "fallback": {
    "baselineModelSource": "ai",
    "modelGenerateTypeKey": "real-model",
    "modelGenerateType": "真人模特图",
    "ratio": "3:4",
    "resolution": "1K",
    "countPerScene": 1,
    "sceneCount": 6
  }
}
```

实现要求：

- `set-fashion` 自身左侧仅展示上传区和基准模特区，但 step2 提交时仍复用 `set-pack` 套图的生成模式与计费口径。
- 推荐场景生成成功后，前端必须保留 `fashionSceneSummary`、`fashionSceneModules` 和生成签名，用于 stale 校验和任务快照回放。
- 当前默认每个场景输出 `1` 张，默认比例 `3:4`，默认分辨率 `1K`。
- 若后续开放比例、分辨率、每场景张数编辑，应优先写入 scene module 转换结果，而不是改动 step1 推荐逻辑。

### 研发落地口径

- 前端需按“两步流”实现：step1 只生成规划结果，不直接扣整套图生成积分；step2 才提交正式生成任务。
- 后端任务模型可复用 `set-pack` 多结果项结构，但需保留服饰套图专属快照字段：
  - `fashionSceneSummary`
  - `fashionSceneModules`
  - `setPackSelectedTypes`
- Prompt 生成应按场景模块逐条构建，而不是整套服饰图共用一条大 Prompt。
- 推荐场景阶段与正式生成阶段都应可追溯：前者看“为什么推荐这些场景”，后者看“最终按什么模块生成了什么图”。

### 关联文档

- 开发对齐文档：[AI商品图-服饰套图-对齐一键场景图标准开发文档](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-对齐一键场景图标准开发文档.md)
- 模式规则：[AI商品图-服饰套图-mode_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-mode_rules.json)
- 品类与维度规则：[AI商品图-服饰套图-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-category_dimension_direction_rules.json)
- 选项扩展规则：[AI商品图-服饰套图-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-option_value_expansions.json)
- Prompt 模板：[AI商品图-服饰套图-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-prompt_builder_template.json)

## 1. 文档说明

- 文档对象：`服饰套图` 功能，主工具对应 `set-fashion`
- 关联能力：与 `电商套图（set-main）` 复用套图生成骨架，与 `模特试穿` 共享部分模特设定思路
- 依据来源：当前前端原型与交互实现，核心代码位于 [src/App.tsx](/Users/zhaowenwen/CODEX/CKTAI电商/src/App.tsx)
- 文档用途：用于产品评审、研发对齐、测试设计、Prompt 与任务快照字段约定

## 2. 功能概述

服饰套图用于围绕同一件服装商品，先生成一组适合服饰销售的场景规划，再输出成套上身图与氛围图。其核心目标不是“单张试穿图”，而是把服装的版型、面料、动态、穿搭感和生活方式表达，拆解成适合电商与内容分发的多图位素材包。

当前产品定义的能力重点：

- 上传同一件服装的多视角图片
- 选择 AI 模特或我的模特作为统一基准
- 自动生成推荐场景摘要与场景模块
- 支持用户对推荐场景进行删改、排序和编辑
- 将场景模块自动转换为套图类型，提交正式生成
- 生成后进入结果区统一管理与下载

## 3. 入口与定位

一级导航归属：`电商套图`

当前一级分组下工具：

1. 电商套图 `set-main`
2. A+详情图 `set-aplus`
3. 服饰套图 `set-fashion`
4. 爆款套图复刻 `set-replica`

其中本需求文档聚焦 `服饰套图 set-fashion`。

## 3.1 独立链接要求

为了满足“用户打开链接后可直接定位到对应功能”的需求，服饰套图需提供独立可访问 URL，不依赖用户先进入首页后再切换 Tab。

### 链接目标

- 每个功能一个独立链接
- 打开链接后默认高亮当前功能
- 页面首屏直接展示服饰套图配置面板和结果区
- 支持从运营页、帮助中心、营销活动页直接跳转

### 建议路由规则

建议统一采用：

`/tools/{tool-slug}`

服饰套图建议映射：

- `/tools/fashion-set`

若直接复用工具 key，也可采用：

- `/tools/set-fashion`

### 当前代码现状说明

仓库中已存在按工具 slug 直达的路由模式，格式为：

`/tools/:slug`

可参考：

- [src/pages/ToolRoutePage.tsx](/Users/zhaowenwen/CODEX/CKTAI电商/src/pages/ToolRoutePage.tsx:1)
- [src/components/Layout.tsx](/Users/zhaowenwen/CODEX/CKTAI电商/src/components/Layout.tsx:1)

因此从需求角度看，服饰套图独立链接具备实现基础，建议补齐正式映射。

## 4. 用户目标

- 快速生成可用于服饰上新的成套模特图
- 统一不同图位里的模特身份、穿搭风格和场景表达
- 用更低的配置成本拿到首图、细节图、街拍图、氛围图等组合素材
- 减少单张反复试穿或逐图写 Prompt 的操作成本

## 5. 页面结构与界面描述

`服饰套图` 主面板当前按以下顺序展示：

1. 上传服装图片
2. 基准模特设置
3. 底部主按钮：生成推荐场景
4. 右侧结果区 / 推荐场景编辑区
5. step2 按钮：生成套图结果

### 5.1 上传服装图片

- 字段名：`上传服装图片`
- 必填
- 最多上传 `5` 张
- 提示文案：`最多5张，请上传同一件衣服不同视角图`
- 适合上传正面、背面、侧面、细节等多视角图

### 5.2 基准模特设置

包含以下字段：

1. 模特来源：`baselineModelSource`
2. 我的模特：`selectedModelId / selectedModelName`
3. 性别：`gender`
4. 外貌：`appearance`
5. 年龄：`age`
6. 人设：`persona`
7. 体型：`bodyType`
8. 细节补充：`baselineModelSupplement`

说明：

- 当模特来源为 `mine` 时，必须选择一个已有模特
- 当模特来源为 `ai` 时，必须补齐 AI 模特参数
- 当前系统默认模特类型为 `真人模特图`，但页面不展示该选项
- 该区块的目标是统一后续所有场景图中的人物身份与气质

### 5.3 推荐场景生成区

点击主按钮后进入 step1：

- 按当前上传图和模特设定生成推荐场景
- 推荐结果包含两部分：
  - `fashionSceneSummary`：场景摘要
  - `fashionSceneModules`：场景模块列表
- 默认生成 `6` 个模块
- 生成中态文案：`AI 正在生成推荐场景...`

### 5.4 场景模块编辑区

系统生成模块后，用户可在结果区执行：

1. 删除某个模块
2. 拖拽调整模块顺序
3. 编辑模块标题与描述内容

说明：

- 模块编辑结果会直接影响 step2 实际出图类型
- 拖拽后的顺序应保留为最终 `sortOrder`
- 删除后的模块不再计入出图数和积分

### 5.5 套图结果生成区

点击 step2 后：

- 系统把 `fashionSceneModules` 转为 `setPackSelectedTypes`
- 每个模块默认生成 1 张结果图
- 默认比例 `3:4`
- 默认分辨率 `1K`
- 结果数量 = 当前模块数

## 6. 字段定义与默认值

### 6.1 上传字段

- `upload-main`
  - 必填
  - `maxCount=5`
  - 同一件服装多视角

### 6.2 模特字段

- `baselineModelSource`
  - 可选值：`ai | mine`
  - 默认：`ai`
- `modelGenerateTypeKey`
  - 系统字段，不在界面显式展示
  - 默认：`real-model`
- `modelGenerateType`
  - 系统字段，不在界面显式展示
  - 默认：`真人模特图`
- `gender`
  - 可选值：`男 | 女`
- `appearance`
  - 可选值：`欧美白人 | 中国人 | 亚洲人 | 东南亚人 | 非裔 | 中东人 | 拉丁裔`
- `age`
  - 可选值：`青少年 | 青年 | 中年 | 老年`
- `persona`
  - 可选值：`上班族 | 测评博主 | 学生 | 健身人群 | 家庭主妇 | 其他`
- `bodyType`
  - 可选值：`纤细 | 标准 | 微胖 | 大码`
- `baselineModelSupplement`
  - 可选
  - 用于补充人物气质、姿态、拍摄偏好等细节

### 6.3 规划与结果字段

- `fashionSceneSummary`
  - step1 生成
  - 用于展示推荐依据和任务回放
- `fashionSceneModules`
  - step1 生成并可编辑
  - step2 的直接输入
- `setPackSelectedTypes`
  - step2 提交前由 `fashionSceneModules` 转换
- `outputCount`
  - 等于当前模块数
- `generateCost`
  - 等于 `outputCount * unitCreditCost`

### 6.4 基准模特-AI生成分支的参数、提示词与拼装规则

说明：

- 本段对应页面中的 `基准模特 -> AI生成` 分支；`baselineModelSource=mine` 时不走本段规则。
- 页面上用户实际填写的是 `gender / appearance / age / persona / bodyType / baselineModelSupplement`，`modelGenerateType` 由系统默认补入。
- 本段的目标不是直接生成整套服饰图，而是先确定可复用于 step1 和 step2 的“基准模特图/基准模特设定”。
- 最终输出应保持 `单人主体`、`人物身份稳定`、`服装展示友好`，方便后续场景规划与正式出图复用同一人物设定。

生成模特参数：

- `modelGenerateType`：系统默认字段，当前固定为真人模特表达；后续如开放人台模特、假发模特，再升级为用户可选项
- `gender`：决定基础性别体态与站姿气质
- `appearance`：决定人种/地区外貌特征与面部观感
- `age`：决定年龄状态与面部成熟度
- `persona`：决定职业/生活方式语义与人物氛围
- `bodyType`：决定身材比例、量感和服装受力关系
- `baselineModelSupplement`：用于补充姿态、表情、妆发、镜头偏好、场景倾向等自由说明
- `referenceImage`：可选；如用户上传参考图，则仅用于参考脸型、气质、妆发或局部风格，不替代服装主体

参数对应提示词：

```json
{
  "aiModelGeneratePromptConfig": {
    "fixedPrompts": {
      "modelGenerateBasePrompt": "请基于当前选择的模特类型生成电商可用人物素材，保持单人主体、结构真实、光影自然和商业成片质感；不得出现多余人物、肢体畸形、五官崩坏、服饰穿帮和低清伪影。",
      "modelGenerateParameterBasePrompt": "请严格遵循已选的人物特征与场景参数生成人像，确保性别、年龄、外貌、人设、体型和场景表达一致；人物姿态自然、比例合理、边缘干净，适合电商服饰展示与后续二次编辑。",
      "referenceImagePrompt": "如上传参考图，请优先参考参考图中的人物风格、脸型、气质或局部特征。",
      "universalQualityPrompt": "【通用质量约束】保持单人主体，人物结构真实自然；五官比例协调，四肢与关节关系正确；体态、站姿与重心稳定；皮肤、头发、服装边缘和局部纹理清晰自然；光线方向、阴影和肤色过渡统一；画面干净、主体突出，满足电商可用的商业人像质量，便于后续服饰套图继续复用。",
      "universalNegativePrompt": "【通用负向约束】禁止生成多余人物、第二张脸、额外手脚或肢体穿插；禁止五官错位、面部崩坏、手部畸形、关节扭曲、脖颈异常；禁止低清晰度、重影、明显AI伪影、边缘融化、文字水印、乱码logo；禁止过度磨皮、过饱和、过曝、严重噪点或失真滤镜；禁止人物漂移、风格不稳定或不适合电商服饰展示的人像结果。"
    },
    "params": {
      "modelGenerateType": {
        "真人模特图": "生成为真实真人质感模特，保留自然皮肤纹理、真实五官比例和正常人体结构，适合服饰电商主流展示。",
        "人台模特图": "生成为人台展示风格，强调服装廓形、肩线和版型表现，弱化真人情绪表达，画面干净偏陈列。",
        "假发模特图": "生成为假发展示导向模特，重点确保头发区域细节、发际线过渡和发丝层次，头部轮廓与光影真实。"
      },
      "gender": {
        "男": "生成为男性体态特征，肩颈比例、骨骼线条与站姿重心符合男性常见结构，整体气质利落自然。",
        "女": "生成为女性体态特征，面部与身体线条自然协调，姿态舒展，兼顾服饰展示和人物亲和力。"
      },
      "appearance": {
        "欧美白人": "呈现欧美白人外貌特征，五官立体、轮廓清晰，肤色自然不过曝。",
        "中国人": "呈现中国人外貌特征，五官比例自然，气质贴合本土电商审美。",
        "亚洲人": "呈现亚洲人外貌特征，面部结构柔和自然，整体观感亲和。",
        "东南亚人": "呈现东南亚人外貌特征，肤色与五官关系真实，整体气质自然。",
        "非裔": "呈现非裔外貌特征，肤色层次与光泽真实，五官比例稳定。",
        "中东人": "呈现中东人外貌特征，轮廓与肤色表达准确自然，避免刻板化夸张。",
        "拉丁裔": "呈现拉丁裔外貌特征，五官和肤色关系自然，氛围感更具活力。"
      },
      "age": {
        "青少年": "呈现青少年年龄特征，面部状态年轻自然，避免过度成熟化。",
        "青年": "呈现青年年龄特征，状态精神利落，适配主流电商服饰展示。",
        "中年": "呈现中年年龄特征，神态稳重自然，保持皮肤与骨相真实。",
        "老年": "呈现老年年龄特征，面部纹理与气质自然，避免过度年轻化处理。"
      },
      "persona": {
        "上班族": "呈现通勤与职业感气质，姿态克制自然，适合职场穿搭展示。",
        "测评博主": "呈现镜头表达与分享感，更偏内容创作者气质，互动感自然。",
        "学生": "呈现年轻校园感气质，状态清爽自然，适配日常休闲穿搭。",
        "健身人群": "呈现健康有活力体态，站姿稳定，肢体线条自然不过度夸张。",
        "家庭主妇": "呈现生活化与亲和感气质，状态自然松弛，贴近日常场景。",
        "其他": "按补充说明执行，默认保持中性通用商业人像风格。"
      },
      "bodyType": {
        "纤细": "呈现纤细体型，四肢与躯干比例协调，避免极端瘦削失真。",
        "标准": "呈现标准体型，比例均衡自然，适合作为通用电商基准模特。",
        "微胖": "呈现微胖体型，身体曲线自然，服饰受力与褶皱关系真实。",
        "大码": "呈现大码体型，骨骼与肌肉体积关系合理，保持服装展示完整。"
      },
      "baselineModelSupplement": "用户自由输入，最终按“补充说明：{baselineModelSupplement}”直接拼入，用于约束姿态、妆发、镜头、表情、场景或审美偏好。"
    }
  }
}
```

step0 标准拼接顺序：

1. 生成任务目标
2. 模特类型基准固定文案 + `modelGenerateTypePrompt`
3. 人物参数基准固定文案 + `genderPrompt + appearancePrompt + agePrompt + personaPrompt + bodyTypePrompt`
4. 用户补充段：`baselineModelSupplement`
5. 参考图固定文案
6. 通用质量固定文案
7. 通用负向固定文案

step0 生成模特图模板：

```text
任务目标：请生成电商可用的单人基准模特图，用于后续服饰套图的统一人物设定与场景复用。

模特类型基准：请基于当前选择的模特类型生成电商可用人物素材，保持单人主体、结构真实、光影自然和商业成片质感；不得出现多余人物、肢体畸形、五官崩坏、服饰穿帮和低清伪影。 {modelGenerateTypePrompt}

人物参数：请严格遵循已选的人物特征与场景参数生成人像，确保性别、年龄、外貌、人设、体型和场景表达一致；人物姿态自然、比例合理、边缘干净，适合电商服饰展示与后续二次编辑。 性别={genderPrompt} 外貌={appearancePrompt} 年龄={agePrompt} 人设={personaPrompt} 体型={bodyTypePrompt}

用户补充：{baselineModelSupplementText}

参考图约束：如上传参考图，请优先参考参考图中的人物风格、脸型、气质或局部特征。

【通用质量约束】保持单人主体，人物结构真实自然；五官比例协调，四肢与关节关系正确；体态、站姿与重心稳定；皮肤、头发、服装边缘和局部纹理清晰自然；光线方向、阴影和肤色过渡统一；画面干净、主体突出，满足电商可用的商业人像质量，便于后续服饰套图继续复用。

【通用负向约束】禁止生成多余人物、第二张脸、额外手脚或肢体穿插；禁止五官错位、面部崩坏、手部畸形、关节扭曲、脖颈异常；禁止低清晰度、重影、明显AI伪影、边缘融化、文字水印、乱码logo；禁止过度磨皮、过饱和、过曝、严重噪点或失真滤镜；禁止人物漂移、风格不稳定或不适合电商服饰展示的人像结果。
```

拼装字段说明：

- `modelGenerateBasePrompt`：固定文案，直接作为“模特类型基准段”写入
- `modelGenerateTypePrompt`：命中系统默认 `modelGenerateType` 后的类型提示词；当前默认命中 `真人模特图`
- `modelGenerateParameterBasePrompt`：固定文案，直接作为“人物参数段”写入
- `genderPrompt / appearancePrompt / agePrompt / personaPrompt / bodyTypePrompt`：由对应字段值命中的参数提示词
- `baselineModelSupplementText`：为空时整段省略；有值时按 `补充说明：...` 拼入
- `referenceImagePrompt`：固定文案；仅在有参考图时拼入，无参考图时省略整段
- `universalQualityPrompt / universalNegativePrompt`：固定文案，直接写入模板尾部

step0 Demo（单独模板）：

`输出部分` 指的不是生成图片后的业务返回结构，而是 `最终提交给模型的模特生成 prompt`。

推荐把 demo 拆成下面三段：

输入示例：

```json
{
  "baselineModelSource": "ai",
  "modelGenerateType": "真人模特图",
  "gender": "女",
  "appearance": "中国人",
  "age": "青年",
  "persona": "上班族",
  "bodyType": "标准",
  "baselineModelSupplement": "偏通勤轻商务风，妆容干净，站姿自然，半身到全身均可复用。",
  "hasReferenceImage": false
}
```

拼装后的中间变量示例：

```json
{
  "modelGenerateTypePrompt": "生成为真实真人质感模特，保留自然皮肤纹理、真实五官比例和正常人体结构，适合服饰电商主流展示。",
  "genderPrompt": "生成为女性体态特征，面部与身体线条自然协调，姿态舒展，兼顾服饰展示和人物亲和力。",
  "appearancePrompt": "呈现中国人外貌特征，五官比例自然，气质贴合本土电商审美。",
  "agePrompt": "呈现青年年龄特征，状态精神利落，适配主流电商服饰展示。",
  "personaPrompt": "呈现通勤与职业感气质，姿态克制自然，适合职场穿搭展示。",
  "bodyTypePrompt": "呈现标准体型，比例均衡自然，适合作为通用电商基准模特。",
  "baselineModelSupplementText": "偏通勤轻商务风，妆容干净，站姿自然，半身到全身均可复用。",
  "referenceImagePrompt": "",
  "universalQualityPrompt": "【通用质量约束】保持单人主体，人物结构真实自然；五官比例协调，四肢与关节关系正确；体态、站姿与重心稳定；皮肤、头发、服装边缘和局部纹理清晰自然；光线方向、阴影和肤色过渡统一；画面干净、主体突出，满足电商可用的商业人像质量，便于后续服饰套图继续复用。",
  "universalNegativePrompt": "【通用负向约束】禁止生成多余人物、第二张脸、额外手脚或肢体穿插；禁止五官错位、面部崩坏、手部畸形、关节扭曲、脖颈异常；禁止低清晰度、重影、明显AI伪影、边缘融化、文字水印、乱码logo；禁止过度磨皮、过饱和、过曝、严重噪点或失真滤镜；禁止人物漂移、风格不稳定或不适合电商服饰展示的人像结果。"
}
```

最终提交给模型的 prompt 模板：

```text
任务目标：请生成电商可用的单人基准模特图，用于后续服饰套图的统一人物设定与场景复用。

模特类型基准：请基于当前选择的模特类型生成电商可用人物素材，保持单人主体、结构真实、光影自然和商业成片质感；不得出现多余人物、肢体畸形、五官崩坏、服饰穿帮和低清伪影。 {modelGenerateTypePrompt}

人物参数：请严格遵循已选的人物特征与场景参数生成人像，确保性别、年龄、外貌、人设、体型和场景表达一致；人物姿态自然、比例合理、边缘干净，适合电商服饰展示与后续二次编辑。 性别={genderPrompt} 外貌={appearancePrompt} 年龄={agePrompt} 人设={personaPrompt} 体型={bodyTypePrompt}

用户补充：{baselineModelSupplementText}

{referenceImagePrompt}

{universalQualityPrompt}

{universalNegativePrompt}
```

最终提交给模型的 prompt 示例：

```text
任务目标：请生成电商可用的单人基准模特图，用于后续服饰套图的统一人物设定与场景复用。

模特类型基准：请基于当前选择的模特类型生成电商可用人物素材，保持单人主体、结构真实、光影自然和商业成片质感；不得出现多余人物、肢体畸形、五官崩坏、服饰穿帮和低清伪影。 生成为真实真人质感模特，保留自然皮肤纹理、真实五官比例和正常人体结构，适合服饰电商主流展示。

人物参数：请严格遵循已选的人物特征与场景参数生成人像，确保性别、年龄、外貌、人设、体型和场景表达一致；人物姿态自然、比例合理、边缘干净，适合电商服饰展示与后续二次编辑。 性别=生成为女性体态特征，面部与身体线条自然协调，姿态舒展，兼顾服饰展示和人物亲和力。 外貌=呈现中国人外貌特征，五官比例自然，气质贴合本土电商审美。 年龄=呈现青年年龄特征，状态精神利落，适配主流电商服饰展示。 人设=呈现通勤与职业感气质，姿态克制自然，适合职场穿搭展示。 体型=呈现标准体型，比例均衡自然，适合作为通用电商基准模特。

用户补充：偏通勤轻商务风，妆容干净，站姿自然，半身到全身均可复用。

【通用质量约束】保持单人主体，人物结构真实自然；五官比例协调，四肢与关节关系正确；体态、站姿与重心稳定；皮肤、头发、服装边缘和局部纹理清晰自然；光线方向、阴影和肤色过渡统一；画面干净、主体突出，满足电商可用的商业人像质量，便于后续服饰套图继续复用。

【通用负向约束】禁止生成多余人物、第二张脸、额外手脚或肢体穿插；禁止五官错位、面部崩坏、手部畸形、关节扭曲、脖颈异常；禁止低清晰度、重影、明显AI伪影、边缘融化、文字水印、乱码logo；禁止过度磨皮、过饱和、过曝、严重噪点或失真滤镜；禁止人物漂移、风格不稳定或不适合电商服饰展示的人像结果。
```

## 7. 交互规则与阻断逻辑

### 7.1 step1 阻断规则

- 未上传服装图：阻断，提示 `请先上传服装图片`
- 选择我的模特但未选中模特：阻断，提示 `请先选择我的模特，或先上传本地模特`
- 选择 AI 模特但必填参数缺失：阻断，提示 `请先完善 AI 生成模特参数`

### 7.2 step2 阻断规则

- 未完成 step1：阻断，提示 `请先生成推荐场景`
- step1 后左侧输入发生变更导致签名不一致：阻断，提示 `第1步信息已变更，请重新生成推荐场景`

### 7.3 stale 判断口径

以下字段任一变化，都应判定 step1 结果失效：

- 上传图片列表
- `baselineModelSource`
- `selectedModelId`
- `modelGenerateType`
- `gender`
- `appearance`
- `age`
- `persona`
- `bodyType`
- `baselineModelSupplement`

## 7.4 规则分层与使用逻辑

服饰套图的提示词应明确区分为两层：

1. step1：生成推荐场景（规划层）
2. step2：生成套图结果（正式生成层）

### 7.4.1 step1 推荐场景规则分层

生成推荐场景建议按以下层级组装：

1. 规划任务：`planTask`
2. 模式规则：`modeRules[baselineModelSource]`
3. 品类规则：`categoryRules[productCategory]`
4. 维度/方向规则：`dimensionRules[ratio] + directionRules[direction]`
5. 字段值扩展：`optionValueExpansions[field].values[value].valuePrompt`
6. 规划约束：`required / forbidden`
7. 通用段：`universalNegativePrompt + universalQualityPrompt`
8. 规划输出结构：`summary + modules`

说明：

- step1 的目标不是直接生成图片，而是产出一组“为什么推荐这些场景、每个场景想表达什么”的规划结果。
- step1 重点回答：这件服装适合哪些图位、这些图位顺序如何、每个图位的标题和表达重点是什么。
- step1 的输出应服务用户编辑，因此更强调“模块可读、可删改、可排序”，而不是模型自由发挥。

### 7.4.2 step2 正式生成规则分层

服饰套图的最终提示词建议按以下层级组装：

1. 模式规则：`modeRules[baselineModelSource]`
2. 品类规则：`categoryRules[productCategory]`
3. 维度/方向规则：`dimensionRules[ratio] + directionRules[direction]`
4. 字段值扩展：`optionValueExpansions[field].values[value].valuePrompt`
5. 硬约束：`required / forbidden`
6. 通用段：`universalNegativePrompt + universalQualityPrompt`

说明：

- `baselineModelSource=ai` 和 `baselineModelSource=mine` 应命中不同模式规则。
- 若 `productCategory` 缺失，建议走 `通用品类`。
- 若 `direction` 缺失，建议走“正面/默认方向”。
- step1 生成推荐场景时可不依赖全部规则命中；step2 正式生成时应尽量补齐规则字段。

## 8. 拼接规则

`set-fashion` 的最终提示词必须由系统按固定顺序拼接，不允许把用户补充说明或场景模块标题直接当成完整 Prompt 提交。

### 8.0 step1 生成推荐场景拼接规则

step1 推荐场景必须使用独立的规划 Prompt，不得直接复用 step2 的正式出图 Prompt。

#### 8.0.1 step1 拼接目标

- 生成一组适合当前服装商品的场景摘要和场景模块
- 保证推荐结果能覆盖首图、细节、动态、氛围等核心图位
- 让用户在进入 step2 前，先拿到可编辑、可删改、可排序的场景规划结果

#### 8.0.2 step1 标准拼接顺序

1. 规划任务目标
   来源：固定文案 `planTask`
2. 模式规则正文
   来源：`modeRules[baselineModelSource].prompt`
3. 品类规则正文
   来源：`categoryRules[productCategory].prompt`
4. 品类重点段
   来源：`categoryRules[productCategory].focusPoints`
5. 参数段
   来源：`baselineModelSourceLabel / modelGenerateType / gender / appearance / age / persona / bodyType / ratio / resolution / sceneCount`
6. 维度与方向段
   来源：`dimensionRules[ratio].prompt + directionRules[direction].prompt`
7. 字段值扩展段
   来源：`optionValueExpansions[field].values[value].valuePrompt`
8. 模式 `required` 段
   来源：`modeRules[baselineModelSource].required`
9. 品类 `required` 段
   来源：`categoryRules[productCategory].required`
10. 模式 `forbidden` 段
    来源：`modeRules[baselineModelSource].forbidden`
11. 品类 `forbidden` 段
    来源：`categoryRules[productCategory].forbidden`
12. 通用负向段
    来源：固定文案 `universalNegativePrompt`
13. 通用质量段
    来源：固定文案 `universalQualityPrompt`

#### 8.0.3 step1 输出结构要求

step1 的规划输出字段必须固定为：

- `fashionSceneSummary`
- `fashionSceneModules`

其中 `fashionSceneModules` 的单模块结构至少包含：

- `sceneType`
- `title`
- `description`
- `sortOrder`

#### 8.0.4 step1 输出要求

step1 必须输出：

- `fashionSceneSummary`：2~4 条摘要，说明推荐逻辑
- `fashionSceneModules`：默认 6 个模块，可被前端编辑

每个 `fashionSceneModules` 元素至少应包含：

- `sceneType`
- `title`
- `description`
- `sortOrder`

#### 8.0.5 step1 推荐场景拼装模板

```text
任务目标：请基于上传服装图与基准模特设定，为当前商品规划一组适合服饰销售的推荐场景模块。重点覆盖版型展示、面料细节、上身效果、穿搭氛围和真实场景转化表达。

模式规则：{modePrompt}

品类规则：{categoryPrompt}

品类重点：{categoryFocusPointsJoined}

参数：模特来源={baselineModelSourceLabel}；模特类型={modelGenerateType}；性别={gender}；年龄={age}；外貌={appearance}；人设={persona}；体型={bodyType}；建议比例={ratio}；建议分辨率={resolution}；默认场景数={sceneCount}。

维度与方向：{dimensionPrompt} {directionPrompt}

字段扩展：{valueExpansionJoined}

模式必须满足：{modeRequiredJoined}

品类必须满足：{categoryRequiredJoined}

模式禁止：{modeForbiddenJoined}

品类禁止：{categoryForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

输出要求：
1. 输出 fashionSceneSummary 数组，总结这件服装适合的核心展示方向。
2. 输出 fashionSceneModules 数组，默认给出 6 个模块。
3. 每个模块至少包含 sceneType、title、description、sortOrder。
4. 模块之间要有明确分工，避免 6 张图都只是“同一个模特站姿换背景”。
5. 推荐顺序应符合服饰套图常见转化路径：首图感 -> 场景代入 -> 细节证明 -> 动态表达 -> 半身近景 -> 氛围收束。
```

#### 8.0.6 step1 推荐场景 Demo

```json
{
  "fashionSceneSummary": [
    "当前商品适合以通勤轻商务为主线，先突出整体上身效果，再强化版型与面料细节。",
    "推荐场景需统一模特身份与穿搭风格，避免背景喧宾夺主，保证服装始终是主角。",
    "整套建议覆盖首图展示、街拍通勤、半身近景、面料特写、动态动作与生活方式氛围。"
  ],
  "fashionSceneModules": [
    {
      "sceneType": "hero-look",
      "title": "首图上身展示",
      "description": "以正面或三分之二侧视角展示服装整体版型、颜色和搭配关系，形成首图感。",
      "sortOrder": 1
    },
    {
      "sceneType": "commute-street",
      "title": "通勤街拍场景",
      "description": "在都市通勤或办公入口场景中展示真实穿搭状态，突出轻商务与日常适配。",
      "sortOrder": 2
    },
    {
      "sceneType": "fabric-detail",
      "title": "面料细节特写",
      "description": "聚焦领口、肩线、袖口或面料纹理，强化材质与做工细节。",
      "sortOrder": 3
    },
    {
      "sceneType": "motion-shot",
      "title": "动态动作场景",
      "description": "通过自然走动、转身或整理动作，体现面料垂感与穿着动态效果。",
      "sortOrder": 4
    },
    {
      "sceneType": "half-body-closeup",
      "title": "半身近景场景",
      "description": "强化胸背线条、领口和上身轮廓，适合表达版型与人物气质结合。",
      "sortOrder": 5
    },
    {
      "sceneType": "lifestyle-mood",
      "title": "生活方式氛围图",
      "description": "以更松弛的生活场景收束整套图风格，补充品牌感和穿搭氛围。",
      "sortOrder": 6
    }
  ]
}
```

### 8.1 拼接目标

- 保证同一套图中的模特身份、服装版型、画面风格和图位功能统一
- 让模特设置、品类特征、构图方向和用户补充都进入同一条可执行 Prompt
- 确保“服饰主体真实一致”和“不同场景具备转化表达”同时成立

### 8.2 标准拼接顺序

最终 Prompt 建议按以下顺序组装：

1. 任务目标
2. 平台规则正文
3. 模式规则正文
4. 品类规则正文
5. 品类重点段
6. 参数段
7. 维度与方向段
8. 字段值扩展段
9. 平台 `required` 段
10. 平台 `forbidden` 段
11. 品类 `required` 段
12. 品类 `forbidden` 段
13. 模式 `required` 段
14. 模式 `forbidden` 段
15. 通用负向段
16. 通用质量段
17. 补充说明段

### 8.3 裁剪与优先级规则

1. 不可裁剪：`required`、`forbidden`、`universalNegativePrompt`、`universalQualityPrompt`
2. 可裁剪：`valueExpansionPrompt`、`categoryPrompt`、`modePrompt`、`platformPrompt`
3. 冲突优先级：`platformForbidden > categoryForbidden > modeForbidden > platformRequired > categoryRequired > modeRequired > valueExpansion > category > mode > platform`
4. 若用户补充与“服装真实结构、模特一致性”冲突，优先保证商品与人物的真实性

### 8.4 最终拼接建议

字段与来源对照：

- `platformPrompt` <- `platformRulesByTool[platformLabel].prompt`
- `platformRequiredJoined` <- `platformRulesByTool[platformLabel].required.join("；")`
- `platformForbiddenJoined` <- `platformRulesByTool[platformLabel].forbidden.join("；")`
- `modePrompt` <- `modeRules[baselineModelSource].prompt`
- `modeRequiredJoined` <- `modeRules[baselineModelSource].required.join("；")`
- `modeForbiddenJoined` <- `modeRules[baselineModelSource].forbidden.join("；")`
- `categoryPrompt` <- `categoryRules[productCategory].prompt`
- `categoryFocusPointsJoined` <- `(categoryRules[productCategory].focusPoints ?? []).join("、")`
- `categoryRequiredJoined` <- `(categoryRules[productCategory].required ?? []).join("；")`
- `categoryForbiddenJoined` <- `(categoryRules[productCategory].forbidden ?? []).join("；")`
- `dimensionPrompt` <- `dimensionRules[ratio].prompt`
- `directionPrompt` <- `directionRules[direction].prompt`
- `valueExpansionJoined` <- `optionValueExpansions[field].values[value].valuePrompt` 按字段顺序合并
- `paramsLine` <- 输入字段直出：`baselineModelSourceLabel / modelGenerateType / gender / appearance / age / persona / bodyType / ratio / resolution / count`
- `supplementText` <- `baselineModelSupplement` 或其他用户补充说明

```latex
任务目标：{taskTarget}
平台规则：{platformPrompt}
模式规则：{modePrompt}
品类规则：{categoryPrompt}
品类重点：{categoryFocusPointsJoined}
参数：{paramsLine}
维度与方向：{dimensionPrompt} {directionPrompt}
字段扩展：{valueExpansionJoined}
平台必须满足：{platformRequiredJoined}
平台禁止：{platformForbiddenJoined}
品类必须满足：{categoryRequiredJoined}
品类禁止：{categoryForbiddenJoined}
模式必须满足：{modeRequiredJoined}
模式禁止：{modeForbiddenJoined}
通用负向约束：{universalNegativePrompt}
通用质量要求：{universalQualityPrompt}
补充说明：{supplementText}
```

## 9. 最终提示词模板

模板来源：[AI商品图-服饰套图-prompt_builder_template.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-prompt_builder_template.json)

```text
任务目标：基于上传服装图生成服饰套图，突出版型、面料、上身效果与真实场景转化表达。

平台规则：{platformPrompt}

模式规则：{modePrompt}

品类规则：{categoryPrompt}

品类重点：{categoryFocusPointsJoined}

参数：模特来源={baselineModelSourceLabel}；模特类型={modelGenerateType}；性别={gender}；年龄={age}；外貌={appearance}；人设={persona}；体型={bodyType}；比例={ratio}；分辨率={resolution}；套图数量={count}。

维度与方向：{dimensionPrompt} {directionPrompt}

字段扩展：{valueExpansionJoined}

平台必须满足：{platformRequiredJoined}

平台禁止：{platformForbiddenJoined}

品类必须满足：{categoryRequiredJoined}

品类禁止：{categoryForbiddenJoined}

模式必须满足：{modeRequiredJoined}

模式禁止：{modeForbiddenJoined}

{universalNegativePrompt}

{universalQualityPrompt}

补充说明：{supplementText}
```

### 9.1 模板说明

- `platformPrompt`：根据 `platformLabel` 命中平台规则，缺失时走 `全平台通用（16平台）`
- `modePrompt`：根据 `baselineModelSource` 命中“AI生成模特”或“我的模特”规则
- `categoryPrompt`：根据 `productCategory` 命中品类规则，缺失时走通用品类
- `categoryFocusPointsJoined`：根据 `categoryRules[productCategory].focusPoints` 命中重点表达项；若配置存在则必须拼入，不能只定义不用
- `dimensionPrompt`：根据 `ratio` 命中画幅/维度规则
- `directionPrompt`：根据 `direction` 命中构图方向规则
- `valueExpansionJoined`：由性别、年龄、人设、体型、模特类型等字段扩展合并而成
- `platformRequiredJoined / platformForbiddenJoined`：平台规则中的 required / forbidden 去重后合并
- `categoryRequiredJoined / categoryForbiddenJoined`：品类规则中的 required / forbidden 去重后合并
- `modeRequiredJoined / modeForbiddenJoined`：模式规则中的 required / forbidden 去重后合并
- `supplementText`：用户未填写时可省略

### 9.2 开发伪代码

```ts
function buildSetFashionPrompt(input) {
  const platformRule = platformRulesByTool[input.platformLabel] ?? platformRulesByTool["全平台通用（16平台）"];
  const modeRule = modeRules[input.baselineModelSource];
  const categoryRule = categoryRules[input.productCategory] ?? categoryRules["通用品类"];
  const dimensionRule = dimensionRules[input.ratio] ?? "";
  const directionRule = directionRules[input.direction] ?? "";
  const categoryFocusPointsJoined = (categoryRule.focusPoints ?? []).join("、");
  const valueExpansionJoined = buildValuePromptExpansions(input, optionValueExpansions);

  return [
    "任务目标：基于上传服装图生成服饰套图，突出版型、面料、上身效果与真实场景转化表达。",
    `平台规则：${platformRule.prompt}`,
    `模式规则：${modeRule.prompt}`,
    `品类规则：${categoryRule.prompt}`,
    categoryFocusPointsJoined ? `品类重点：${categoryFocusPointsJoined}` : "",
    `参数：模特来源=${input.baselineModelSourceLabel}；模特类型=${input.modelGenerateType}；性别=${input.gender}；年龄=${input.age}；外貌=${input.appearance}；人设=${input.persona}；体型=${input.bodyType}；比例=${input.ratio}；分辨率=${input.resolution}；套图数量=${input.count}。`,
    `维度与方向：${[dimensionRule, directionRule].filter(Boolean).join(" ")}`,
    `字段扩展：${valueExpansionJoined}`,
    `平台必须满足：${platformRule.required.join("；")}`,
    `平台禁止：${platformRule.forbidden.join("；")}`,
    `品类必须满足：${(categoryRule.required ?? []).join("；")}`,
    `品类禁止：${(categoryRule.forbidden ?? []).join("；")}`,
    `模式必须满足：${modeRule.required.join("；")}`,
    `模式禁止：${modeRule.forbidden.join("；")}`,
    promptTemplate.universalNegativePrompt,
    promptTemplate.universalQualityPrompt,
    input.supplementText?.trim() ? `补充说明：${input.supplementText.trim()}` : ""
  ].filter(Boolean).join("\n\n");
}
```

### 9.3 Demo（输入 -> 输出）

```json
{
  "input": {
    "platformLabel": "小红书电商",
    "baselineModelSource": "ai",
    "baselineModelSourceLabel": "AI生成",
    "modelGenerateType": "真人模特图",
    "gender": "女",
    "appearance": "中国人",
    "age": "青年",
    "persona": "上班族",
    "bodyType": "标准",
    "productCategory": "上装",
    "ratio": "3:4",
    "resolution": "1K",
    "count": 6,
    "direction": "三分之二侧",
    "supplementText": "偏通勤轻商务风，突出衬衫挺括与垂感，不要过度修图。"
  },
  "outputPrompt": "任务目标：基于上传服装图生成服饰套图，突出版型、面料、上身效果与真实场景转化表达。\n\n平台规则：适配小红书种草语境，服饰套图可更强调审美统一、人物气质和生活方式氛围，但必须保留真实上身参考价值。\n\n模式规则：根据用户选择的性别、年龄、外貌、人设、体型生成基准模特，并围绕服装商品形成高可用的服饰场景套图。\n\n品类规则：重点展示领口、肩线、胸背版型与袖型细节，确保上身轮廓真实。\n\n参数：模特来源=AI生成；模特类型=真人模特图；性别=女；年龄=青年；外貌=中国人；人设=上班族；体型=标准；比例=3:4；分辨率=1K；套图数量=6。\n\n维度与方向：竖版偏人物与上身比例展示，适合服饰主体。 以三分之二侧视角兼顾轮廓、层次和立体感。\n\n字段扩展：真人模特表现需自然，皮肤质感与姿态可信，服装细节不被人像风格吞没。女装表达偏自然舒展，强调版型、腰线与面料垂感。人物状态成熟活力，场景语义贴近通勤与都市生活。场景偏通勤与办公，画面干净克制。体态比例中性平衡，强调通用穿搭参考价值。\n\n平台必须满足：审美统一；上身真实；种草感。\n\n平台禁止：假精致；过度修体；服装版型失真。\n\n品类必须满足：领口与肩线结构清晰；上装长度与版型不失真。\n\n品类禁止：领口变形；袖型错误。\n\n模式必须满足：模特参数必须严格命中用户选择；服装上身效果清晰，主次关系以服装为核心；不同场景保持同一商品与同一模特设定；画面具备真实穿搭代入感。\n\n模式禁止：模特参数与用户设置不一致；过度特效导致服装不可辨；背景喧宾夺主抢占服装主体；多人物误生或人物漂移。\n\n通用负向约束：1. 严禁改变商品真实结构、版型、颜色和关键设计元素。2. 严禁人体结构错误（手指、肢体、五官、关节异常）和多人物误生。3. 严禁出现水印、Logo、二维码、联系方式、侵权图案或违规文案贴片。4. 严禁背景喧宾夺主导致服装主体不可辨。5. 严禁低清晰度、边缘融化、纹理糊化、透视错位。\n\n通用质量要求：1. 服装主体清晰，版型与材质细节可辨。2. 人物姿态、光影、接触关系符合真实物理。3. 多张套图风格统一但场景有区分，避免重复构图。4. 输出可直接用于电商图位，缩略图下仍保持主体识别。5. 与上传商品SKU一致，不新增用户无法收到的商品元素。\n\n补充说明：偏通勤轻商务风，突出衬衫挺括与垂感，不要过度修图。"
  "outputPrompt": "任务目标：基于上传服装图生成服饰套图，突出版型、面料、上身效果与真实场景转化表达。\n\n平台规则：适配小红书种草语境，服饰套图可更强调审美统一、人物气质和生活方式氛围，但必须保留真实上身参考价值。\n\n模式规则：根据用户选择的性别、年龄、外貌、人设、体型生成基准模特，并围绕服装商品形成高可用的服饰场景套图。\n\n品类规则：重点展示领口、肩线、胸背版型与袖型细节，确保上身轮廓真实。\n\n品类重点：领口肩线、胸背版型、袖型细节、真实上身轮廓。\n\n参数：模特来源=AI生成；模特类型=真人模特图；性别=女；年龄=青年；外貌=中国人；人设=上班族；体型=标准；比例=3:4；分辨率=1K；套图数量=6。\n\n维度与方向：竖版偏人物与上身比例展示，适合服饰主体。 以三分之二侧视角兼顾轮廓、层次和立体感。\n\n字段扩展：真人模特表现需自然，皮肤质感与姿态可信，服装细节不被人像风格吞没。女装表达偏自然舒展，强调版型、腰线与面料垂感。人物状态成熟活力，场景语义贴近通勤与都市生活。场景偏通勤与办公，画面干净克制。体态比例中性平衡，强调通用穿搭参考价值。\n\n平台必须满足：审美统一；上身真实；种草感。\n\n平台禁止：假精致；过度修体；服装版型失真。\n\n品类必须满足：领口与肩线结构清晰；上装长度与版型不失真。\n\n品类禁止：领口变形；袖型错误。\n\n模式必须满足：模特参数必须严格命中用户选择；服装上身效果清晰，主次关系以服装为核心；不同场景保持同一商品与同一模特设定；画面具备真实穿搭代入感。\n\n模式禁止：模特参数与用户设置不一致；过度特效导致服装不可辨；背景喧宾夺主抢占服装主体；多人物误生或人物漂移。\n\n通用负向约束：1. 严禁改变商品真实结构、版型、颜色和关键设计元素。2. 严禁人体结构错误（手指、肢体、五官、关节异常）和多人物误生。3. 严禁出现水印、Logo、二维码、联系方式、侵权图案或违规文案贴片。4. 严禁背景喧宾夺主导致服装主体不可辨。5. 严禁低清晰度、边缘融化、纹理糊化、透视错位。\n\n通用质量要求：1. 服装主体清晰，版型与材质细节可辨。2. 人物姿态、光影、接触关系符合真实物理。3. 多张套图风格统一但场景有区分，避免重复构图。4. 输出可直接用于电商图位，缩略图下仍保持主体识别。5. 与上传商品SKU一致，不新增用户无法收到的商品元素。\n\n补充说明：偏通勤轻商务风，突出衬衫挺括与垂感，不要过度修图。"
}
```

## 10. 推荐场景默认结构

系统当前默认生成以下 6 类场景模块：

1. 首图上身展示
2. 通勤街拍场景
3. 面料细节特写
4. 动态动作场景
5. 半身近景场景
6. 生活方式氛围图

产品要求：

- 这 6 类是默认推荐结构，不代表最终固定不可变
- 用户删除某类后，系统不得自动补回
- 后续若补充更多服饰细分模板，应在 step1 推荐层扩展，而不是在 step2 硬编码

## 11. 结果数量、积分与容量

### 11.1 结果数量

- `outputCount = 当前模块数`
- 默认情况下为 `6`
- 用户删除模块后应相应减少

### 11.2 积分口径

服饰套图复用 `set-pack` 模式计费：

1. 普通：`5` 积分/张
2. 高级：`1K=10`，`2K=15`，`4K=20`
3. 中文增强：`15` 积分/张

总积分计算：

`generateCost = outputCount * unitCreditCost`

### 11.3 容量口径

- 每次提交正式生成任务扣减固定容量：`24MB`

## 12. 任务状态与快照要求

### 10.1 step1 状态

- `idle`
- `generating`
- `ready`

### 10.2 step2 结果状态

复用通用套图任务流转：

- 排队中
- 生成中
- 成功
- 失败

### 10.3 快照要求

正式提交 step2 时，任务快照中至少保留：

- 基准模特全部字段
- `fashionSceneSummary`
- `fashionSceneModules`
- `setPackSelectedTypes`
- `outputCount`
- `generateCost`
- 最终生成模式参数

## 13. 测试重点

- 上传 1~5 张服装图时，step1 是否均可正常生成
- AI 模特与我的模特两条链路的必填校验是否准确
- step1 后修改任一关键字段，step2 是否正确阻断
- 删除、拖拽、编辑模块后，step2 最终提交结果是否与页面一致
- 积分是否按“模块数 × 单价”计算
- 任务快照回放时，是否能还原推荐摘要与模块内容

## 14. 开发建议

1. step1 规划结果与 step2 正式任务建议拆开存储，但通过同一会话上下文关联。
2. `fashionSceneModules` 建议保留结构化字段，不要只存一段纯文本，方便后续编辑、排序和追溯。
3. 若后续开放平台、市场、语言、视觉风格等高级配置，建议沿用 `set-pack` 配置骨架接入，不重造一套服饰专属字段体系。
4. Prompt 拼接与规则优先级请以开发对齐文档和 4 份 JSON 规则文件为准，本文档不重复维护底层拼装细节。

## 15. 平台提示词配置
说明：

- 服饰套图不是白底主图工具，也不是单张模特试穿图工具，而是一组适合服饰销售的场景化套图。
- 平台规则的作用不是限制“能否出现人物”，而是约束这些图更适合作为主图、附图、详情图还是内容图，并决定表达强度。
- 服饰套图应统一遵循：服装主体真实、版型稳定、模特一致、场景可信，不制造虚假穿搭效果。

推荐平台规则结构：
```json
{
  "platformRulesByTool": {
    "全平台通用（16平台）": {
      "ruleLevel": "A",
      "prompt": "服饰套图默认定位为服装商品的附图、场景图、详情图或内容图组合，强调版型、面料、上身关系、穿搭氛围和场景代入感。整套图需保持同一件服装、同一模特身份和统一风格，不得把场景图误做成白底主图替代。",
      "required": ["服装真实一致", "模特身份稳定", "场景可信", "图位功能清楚"],
      "forbidden": ["商品替换", "版型失真", "多人物漂移", "强促销海报感"]
    },
    "淘宝": {
      "ruleLevel": "C",
      "prompt": "适配淘宝服饰详情与内容化表达，套图可强化穿搭氛围和转化感，但需保证服装主体和卖点清楚，不做无效大片。",
      "required": ["穿搭感明确", "商品可辨", "信息直观"],
      "forbidden": ["人物抢主", "构图过杂", "服装细节糊化"]
    },
    "天猫": {
      "ruleLevel": "C",
      "prompt": "适配天猫品牌化服饰详情表达，套图应更强调秩序感、质感和统一品牌气质，人物和场景表达需精致克制。",
      "required": ["品牌统一", "版型清晰", "质感稳定"],
      "forbidden": ["廉价促销风", "低质抠图感", "人物喧宾夺主"]
    },
    "京东": {
      "ruleLevel": "C",
      "prompt": "适配京东服饰导购语境，套图可补充上身效果、细节和版型说明，但仍需保持结构真实和信息清楚。",
      "required": ["结构可见", "版型真实", "上身关系明确"],
      "forbidden": ["过度情绪化", "服装结构失真", "细节被遮挡"]
    },
    "拼多多": {
      "ruleLevel": "C",
      "prompt": "适配拼多多高效率浏览语境，服饰套图要兼顾人物吸引力和服装一眼可辨，首图感模块应更直接。",
      "required": ["高识别", "服装主体大", "人物辅助转化"],
      "forbidden": ["背景过杂", "人物压服装", "信息抓取慢"]
    },
    "1688": {
      "ruleLevel": "C",
      "prompt": "适配1688批发与商采服饰语境，重点展示版型、工艺、面料和系列关系，弱化纯生活方式大片感。",
      "required": ["工艺可信", "面料可辨", "系列逻辑清楚"],
      "forbidden": ["过度时尚化", "规格信息缺失", "版型不稳定"]
    },
    "抖音电商": {
      "ruleLevel": "C",
      "prompt": "适配抖音电商内容浏览语境，套图可强化镜头感、停留感和穿搭氛围，但服装仍必须是视觉中心。",
      "required": ["停留感", "穿搭代入", "服装清晰"],
      "forbidden": ["背景抢主体", "人像滤镜过重", "服装细节丢失"]
    },
    "快手电商": {
      "ruleLevel": "C",
      "prompt": "适配快手电商真实直给的内容氛围，套图应更自然可信，避免用过强精装感掩盖服装本体。",
      "required": ["真实自然", "服装清楚", "场景可理解"],
      "forbidden": ["过度娱乐化", "多余特效", "人物和服装关系不自然"]
    },
    "小红书电商": {
      "ruleLevel": "B",
      "prompt": "适配小红书种草语境，服饰套图可更强调审美统一、人物气质和生活方式氛围，但必须保留真实上身参考价值。",
      "required": ["审美统一", "上身真实", "种草感"],
      "forbidden": ["假精致", "过度修体", "服装版型失真"]
    },
    "亚马逊": {
      "ruleLevel": "A",
      "prompt": "亚马逊主图有强白底规则，因此服饰套图默认定位为附图、品牌内容图或A+场景图，不作为主图替代。人物和场景表达允许存在，但服装结构、材质和用途必须真实准确。",
      "required": ["仅用于附图/内容图", "版型真实", "结构清楚", "商品可信"],
      "forbidden": ["替代白底主图", "虚假材质", "过度时尚大片化", "误导性上身效果"]
    },
    "Temu": {
      "ruleLevel": "C",
      "prompt": "适配Temu快节奏浏览，套图应突出服装主体、版型和价格感对应的直接卖点，不适合复杂抽象时尚大片。",
      "required": ["识别快", "版型清楚", "卖点直观"],
      "forbidden": ["画面过花", "人物过大", "商品信息弱"]
    },
    "TikTok Shop": {
      "ruleLevel": "A",
      "prompt": "TikTok Shop 首图有纯白背景要求，因此服饰套图默认用于附图、内容图和穿搭展示图。可保留人物互动和场景表达，但必须真实反映服装上身关系。",
      "required": ["仅用于附图/内容图", "上身关系真实", "主体清晰"],
      "forbidden": ["作为白底首图替代", "夸张修体", "虚假穿着效果"]
    },
    "阿里国际站": {
      "ruleLevel": "B",
      "prompt": "适配阿里国际站国际买家理解路径，服饰套图应强调面料、版型、工艺、系列和穿着参考，不宜只做氛围大片。",
      "required": ["工艺可信", "版型明确", "系列/尺码逻辑清楚"],
      "forbidden": ["只讲氛围不讲商品", "结构遮挡", "无依据工艺背书"]
    },
    "速卖通": {
      "ruleLevel": "C",
      "prompt": "适配速卖通跨境零售语境，套图应兼顾穿搭感、结构清晰度和跨市场易理解性，避免本地化过重的情境误导。",
      "required": ["跨市场易读", "商品完整", "上身自然"],
      "forbidden": ["本地化过强", "夸张剧情化", "商品弱存在感"]
    },
    "Shopee": {
      "ruleLevel": "C",
      "prompt": "适配Shopee东南亚高频浏览习惯，套图应简洁直观、服装先被看见，人物和场景服务商品转化。",
      "required": ["直观清晰", "服装主体优先", "场景简洁"],
      "forbidden": ["复杂拼贴", "商品比例过小", "花哨过头"]
    },
    "OZON": {
      "ruleLevel": "B",
      "prompt": "适配OZON理性清楚的商品展示语境，服饰套图更适合作为附图和使用图，突出服装结构、细节与真实穿着状态。",
      "required": ["真实穿着", "结构清晰", "背景克制"],
      "forbidden": ["大片感压过商品", "服装不完整", "背景过重"]
    },
    "SHEIN": {
      "ruleLevel": "C",
      "prompt": "适配SHEIN时尚零售语境，套图可强化时尚感、年轻化和系列搭配，但必须保持真实版型、面料和穿着关系。",
      "required": ["时尚感", "版型可信", "面料可辨", "搭配统一"],
      "forbidden": ["过度修身", "面料纹理丢失", "人物压过服装"]
    }
  }
}
```

## 16. 品类、画幅与构图方向规则
说明：

- 服饰套图这一层规则实际由三部分组成：
  - 品类层：商品是什么，决定重点展示什么
  - 画幅层：输出比例是什么，决定版式与主体占比
  - 构图方向层：镜头朝向与姿态是什么，决定视角与展示方式
- 这三层规则应并列存在，不应把 `directionRules` 误解为品类规则的一部分。
- 与模板一致，需求文档中也要显式写出这层规则，方便产品、研发和测试统一理解。

真实规则源：
- [AI商品图-服饰套图-category_dimension_direction_rules.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-category_dimension_direction_rules.json)

推荐规则结构：
```json
{
  "compositionRulesByTool": {
    "categoryRules": {
      "上装": {
        "label": "上装",
        "aliases": ["T恤", "衬衫", "卫衣", "毛衣", "针织衫", "外套", "夹克", "西装上衣"],
        "prompt": "重点展示领口、肩线、胸背版型与袖型细节，确保上身轮廓真实。",
        "focusPoints": ["领口肩线", "胸背版型", "袖型细节", "真实上身轮廓"],
        "required": ["领口与肩线结构清晰", "上装长度与版型不失真"],
        "forbidden": ["领口变形", "袖型错误"]
      },
      "下装": {
        "label": "下装",
        "aliases": ["裤子", "牛仔裤", "休闲裤", "短裤", "半身裙", "长裙"],
        "prompt": "重点展示腰胯、裤线/裙摆、垂坠与动态褶皱，突出下装剪裁。",
        "focusPoints": ["腰胯比例", "裤线或裙摆", "垂坠褶皱", "下装剪裁"],
        "required": ["腰胯比例自然", "裤线或裙摆连续"],
        "forbidden": ["下摆断裂", "比例拉伸"]
      },
      "连体/套装": {
        "label": "连体/套装",
        "aliases": ["连衣裙", "连体裤", "套装", "两件套", "西服套装"],
        "prompt": "重点展示整体搭配关系与上下装衔接，保持成套逻辑与风格一致。",
        "focusPoints": ["整体搭配", "上下装衔接", "成套逻辑", "风格统一"],
        "required": ["上下装关系准确", "整体风格统一"],
        "forbidden": ["错配单品", "成套关系丢失"]
      },
      "运动服饰": {
        "label": "运动服饰",
        "aliases": ["瑜伽服", "运动套装", "训练上衣", "运动短裤", "健身服"],
        "prompt": "重点展示弹性包裹、运动姿态下的贴合度与功能感，保持面料特性真实。",
        "focusPoints": ["弹性包裹", "运动姿态", "贴合度", "功能面料"],
        "required": ["运动姿态自然", "弹性面料质感可辨"],
        "forbidden": ["运动结构错位", "面料功能感丢失"]
      },
      "鞋靴类": {
        "label": "鞋靴类",
        "aliases": ["鞋子", "运动鞋", "靴子", "皮鞋", "凉鞋", "拖鞋"],
        "prompt": "重点展示鞋型轮廓、鞋面材质、鞋底结构和穿着关系，模特姿态需服务鞋类展示，避免脚部和鞋底结构失真。",
        "required": ["鞋型结构清晰", "左右脚关系正确", "穿着关系自然"],
        "forbidden": ["鞋楦变形", "鞋底结构错误", "脚部姿态不合理"]
      },
      "箱包类": {
        "label": "箱包类",
        "aliases": ["背包", "书包", "行李箱", "手提包", "斜挎包", "旅行箱"],
        "prompt": "重点展示手提、肩背、斜挎或出行状态下的真实关系，保持包体结构、五金细节、肩带受力和容量感可信。",
        "required": ["包体结构完整", "五金与肩带清晰", "人与包关系自然"],
        "forbidden": ["包型塌陷", "肩带受力错误", "五金细节丢失"]
      },
      "珠宝饰品类": {
        "label": "珠宝饰品类",
        "aliases": ["项链", "耳环", "戒指", "手链", "手镯", "吊坠"],
        "prompt": "重点展示佩戴部位和真实尺度关系，保留金属、宝石、珍珠等材质高光与边缘细节，不因磨皮或滤镜损失质感。",
        "required": ["佩戴位置准确", "尺度关系真实", "高光材质可辨"],
        "forbidden": ["佩戴错位", "比例失真", "宝石或金属质感丢失"]
      },
      "美妆个护类": {
        "label": "美妆个护类",
        "aliases": ["化妆品", "香水", "护肤品", "洗护", "面霜", "精华"],
        "prompt": "重点展示手持、推荐或使用场景中的真实包装和人物关系，避免夸张护肤、医美或即时功效暗示。",
        "required": ["包装清晰", "手持关系自然", "人物表达可信"],
        "forbidden": ["功效夸大", "包装变形", "医美化暗示"]
      },
      "食品饮料类": {
        "label": "食品饮料类",
        "aliases": ["水果", "饮料", "零食", "咖啡", "茶饮", "酒水"],
        "prompt": "重点展示真实食用、品尝、分享或手持场景，包装信息清晰，不制造不实食欲夸张和过度广告化演绎。",
        "required": ["包装清晰", "手持关系自然", "场景可信"],
        "forbidden": ["食欲效果夸大", "不实成分展示", "人物喧宾夺主"]
      },
      "家居百货类": {
        "label": "家居百货类",
        "aliases": ["文具", "收纳", "日用", "清洁用品", "厨房用品", "生活用品", "健身器材"],
        "prompt": "重点展示真实家居或日常使用状态和人与物的尺寸关系，避免人物抢戏而削弱商品用途表达。",
        "required": ["用途明确", "人与物比例合理", "结构完整"],
        "forbidden": ["用途模糊", "比例失真", "人物压过商品"]
      },
      "家电数码类": {
        "label": "家电数码类",
        "aliases": ["小家电", "电视", "蓝牙耳机", "手机", "笔记本电脑", "数码", "电子产品"],
        "prompt": "重点展示操作、佩戴、使用场景与功能关系，接口、屏幕、按键、耳机佩戴等结构必须准确，不做虚构高科技特效。",
        "required": ["操作关系真实", "接口屏幕准确", "商品主体清晰"],
        "forbidden": ["接口错误", "屏幕失真", "夸张科幻特效"]
      },
      "家具大件类": {
        "label": "家具大件类",
        "aliases": ["沙发", "吊灯", "桌子", "椅子", "床", "柜子", "家装"],
        "prompt": "重点展示空间比例和人与家具的使用关系，透视和尺度必须准确，避免为追求大片感破坏家具真实尺寸。",
        "focusPoints": ["体量比例", "空间关系", "材质细节", "真实尺寸"],
        "required": ["空间比例准确", "透视自然", "人与家具关系明确"],
        "forbidden": ["比例失真", "透视错误", "家具结构漂移"]
      },
      "母婴玩具类": {
        "label": "母婴玩具类",
        "aliases": ["玩具", "手办", "婴童", "母婴用品", "积木", "毛绒玩具"],
        "prompt": "重点展示安全、亲和、真实陪伴感，人物动作和表情要自然，不使用危险姿态或可能引发误导的成人化表达。",
        "required": ["安全亲和", "互动自然", "商品清晰完整"],
        "forbidden": ["危险姿态", "成人化表达", "组件缺失"]
      },
      "宠物用品类": {
        "label": "宠物用品类",
        "aliases": ["宠物", "猫用品", "狗用品", "宠物窝", "宠物食具", "宠物玩具"],
        "prompt": "重点展示宠物或主人与用品的真实互动关系，材质、耐用感、功能位和尺寸比例可信，不做过度拟人化。",
        "required": ["互动关系真实", "材质可信", "商品用途明确"],
        "forbidden": ["过度拟人化", "尺寸比例错误", "功能位失真"]
      },
      "汽配五金类": {
        "label": "汽配五金类",
        "aliases": ["汽车", "机械设备", "集装箱", "汽配", "五金", "工具", "配件耗材", "车载支架"],
        "prompt": "重点展示安装、持握、操作或专业使用语义，孔位、结构、连接关系和尺度必须准确，不做虚构功能演绎。",
        "required": ["结构准确", "连接关系清楚", "尺度合理"],
        "forbidden": ["孔位错误", "结构变形", "虚构功能场景"]
      },
      "通用品类": {
        "label": "通用品类",
        "aliases": ["服装", "智能识别"],
        "prompt": "保持服饰主体真实清晰，优先输出稳定可用的通勤与生活场景。",
        "required": ["服饰主体清晰", "商品真实一致"],
        "forbidden": ["风格跑偏", "商品替换"]
      }
    },
    "dimensionRules": {
      "3:4": { "prompt": "竖版偏人物与上身比例展示，适合服饰主体。" },
      "4:5": { "prompt": "竖版强化商品占比，适合详情与转化图位。" },
      "1:1": { "prompt": "方图适配平台列表流，保持主体居中与边距稳定。" },
      "9:16": { "prompt": "长竖构图强调人物全身延展与场景纵深。" },
      "16:9": { "prompt": "横版适合场景叙事，人物与环境关系更完整." }
    },
    "directionRules": {
      "正面": { "prompt": "以正面视角展示服装整体轮廓与正向细节。" },
      "侧面": { "prompt": "以侧面视角展示剪裁线条与立体体积。" },
      "背面": { "prompt": "以背面视角展示后片版型与背部细节。" },
      "三分之二侧": { "prompt": "以三分之二侧视角兼顾轮廓、层次和立体感。" },
      "动态": { "prompt": "以动态动作强化面料垂坠与穿着状态。" }
    }
  }
}
```

补充说明：

- `categoryRules` 是服饰套图最终直接执行的品类规则，识别链路应直接输出可命中这里的 `productCategory`。
- 服装类商品可细分到 `上装 / 下装 / 连体/套装 / 运动服饰`，以保留服饰套图对版型和上身关系的表达精度。
- 非服装类商品也必须直接命中对应可执行品类，例如：`鞋靴类 / 箱包类 / 家具大件类 / 通用品类`。
- `categoryRules` 回答“这是什么商品、重点展示什么”。
- `dimensionRules` 是画幅层规则，回答“用什么比例、更适合怎样的主体占比和版式”。
- `directionRules` 是构图方向层规则，回答“从哪个视角、以什么姿态和镜头方向展示商品”。

## 17. 高级选项值扩展提示词配置
说明：

- 服饰套图不能只把“模特类型/性别/年龄/人设/体型”字符串直接拼进 Prompt。
- 每个字段值都需要对应的 `valuePrompt`，把它对人物气质、场景、姿态和服装表达的影响说清楚。

真实配置参考：
- [AI商品图-服饰套图-option_value_expansions.json](/Users/zhaowenwen/CODEX/CKTAI电商/docs/服饰套图/AI商品图-服饰套图-option_value_expansions.json)

推荐扩展结构：
```json
{
  "optionValueExpansionsByTool": {
    "modelGenerateType": {
      "fieldKey": "modelGenerateType",
      "name": "模特类型",
      "values": {
        "真人模特图": { "valuePrompt": "真人模特表现需自然，皮肤质感与姿态可信，服装细节不被人像风格吞没。" },
        "人台模特图": { "valuePrompt": "人台展示需结构端正，重点突出服装版型、领口、肩线与垂感。" },
        "假发模特图": { "valuePrompt": "假发类需突出发丝层次、发际线自然度与佩戴贴合度，避免边缘穿帮。" }
      }
    },
    "gender": {
      "fieldKey": "gender",
      "name": "性别",
      "values": {
        "男": { "valuePrompt": "男装表达偏利落有力量感，肩背线条清晰，姿态简洁。" },
        "女": { "valuePrompt": "女装表达偏自然舒展，强调版型、腰线与面料垂感。" }
      }
    },
    "appearance": {
      "fieldKey": "appearance",
      "name": "外貌",
      "values": {
        "欧美白人": { "valuePrompt": "外貌更偏立体轮廓与清晰骨相，肤色和光影过渡自然。" },
        "中国人": { "valuePrompt": "外貌贴合中国电商主流审美，五官比例自然、亲和且稳定。" },
        "亚洲人": { "valuePrompt": "外貌整体柔和自然，面部观感亲和，适合通用服饰表达。" },
        "东南亚人": { "valuePrompt": "外貌与肤色层次真实，整体气质自然有辨识度。" },
        "非裔": { "valuePrompt": "外貌与肤色质感真实稳定，重点保证面部与高光细节自然。" },
        "中东人": { "valuePrompt": "外貌轮廓与肤色表达准确自然，避免夸张和刻板化表达。" },
        "拉丁裔": { "valuePrompt": "外貌更具活力感，五官和肤色关系自然，画面气质更鲜明。" }
      }
    },
    "age": {
      "fieldKey": "age",
      "name": "年龄段",
      "values": {
        "青少年": { "valuePrompt": "人物状态年轻清爽，场景语义贴近校园与日常。" },
        "青年": { "valuePrompt": "人物状态成熟活力，场景语义贴近通勤与都市生活。" },
        "中年": { "valuePrompt": "人物状态稳重可信，场景语义贴近日常与商务。" },
        "老年": { "valuePrompt": "人物状态从容自然，场景语义贴近舒适与生活化。" }
      }
    },
    "persona": {
      "fieldKey": "persona",
      "name": "人设",
      "values": {
        "上班族": { "valuePrompt": "场景偏通勤与办公，画面干净克制。" },
        "测评博主": { "valuePrompt": "场景偏内容创作与展示，强调上镜感。" },
        "学生": { "valuePrompt": "场景偏校园与日常，表达轻松自然。" },
        "健身人群": { "valuePrompt": "场景偏运动与功能表达，动作姿态有活力。" },
        "家庭主妇": { "valuePrompt": "场景偏居家与生活化，表达亲和真实。" },
        "其他": { "valuePrompt": "场景按补充说明执行，优先保证服装主体表达。" }
      }
    },
    "bodyType": {
      "fieldKey": "bodyType",
      "name": "体型",
      "values": {
        "纤细": { "valuePrompt": "体态线条轻盈，保持服装松量与版型真实。" },
        "标准": { "valuePrompt": "体态比例中性平衡，强调通用穿搭参考价值。" },
        "微胖": { "valuePrompt": "体态表达自然包容，强调服装包裹与舒适度。" },
        "大码": { "valuePrompt": "体态表达自信稳定，强调尺码友好与剪裁适配。" }
      }
    }
  }
}
```

补充说明：

- `appearance` 也属于 AI 生成模特的核心参数，正式拼装时不能漏掉。
- `baselineModelSupplement` 为自由输入字段，不走固定枚举，最终应按 `补充说明：{baselineModelSupplement}` 直接拼入。

## 18. 三个关键能力的提示词配置
### 18.1 图片识别获取信息
用途：

- 直接识别可用于服饰套图规则命中的 `productCategory`；
- 辅助回填 `productCategory` 和 `direction`；
- 为 step1 推荐场景和 step2 正式生成提供稳定的结构化输入。

提示词：
```json
你是一位服饰套图商品理解专家。请根据输入商品图片，提取“服饰套图生成”所需信息，并严格输出 JSON。

任务要求：
1) 直接识别服饰套图内部执行品类 `productCategory`，只能从：
  上装、下装、连体/套装、运动服饰、鞋靴类、箱包类、珠宝饰品类、美妆个护类、食品饮料类、家居百货类、家电数码类、家具大件类、母婴玩具类、宠物用品类、汽配五金类、通用品类。
2) 判断当前更适合的构图方向：正面、侧面、背面、三分之二侧、动态。
3) 输出品类关键词，帮助后续场景推荐、规则命中和品类理解。
4) 若品类置信度不足，输出“通用品类”，并将 `productCategory` 加入 needsUserConfirm。
5) 只输出 JSON，不输出解释。

输出 JSON Schema：
{
  "category": {
    "productCategory": "上装|下装|连体/套装|运动服饰|鞋靴类|箱包类|珠宝饰品类|美妆个护类|食品饮料类|家居百货类|家电数码类|家具大件类|母婴玩具类|宠物用品类|汽配五金类|通用品类",
    "confidence": "number(0-1)",
    "keywords": ["string"]
  },
  "recommendedFields": {
    "productCategory": "string",
    "direction": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

### 18.2 AI 帮写
用途：

- 在 step1 前辅助回填服饰套图的隐式字段；
- 输出适合服装表达的安全推荐值，而不是极端风格；
- 服务端可基于该结果生成更稳的推荐场景。

提示词：
```json
你是一位服饰套图策划师。请根据商品图识别结果与基准模特设定，回填 set-fashion 相关字段。

必须遵守：
1) 仅返回以下字段：productCategory, direction。
2) productCategory 只能从：上装、下装、连体/套装、运动服饰、鞋靴类、箱包类、珠宝饰品类、美妆个护类、食品饮料类、家居百货类、家电数码类、家具大件类、母婴玩具类、宠物用品类、汽配五金类、通用品类 中选择。
3) direction 只能从：正面、侧面、背面、三分之二侧、动态 中选择。
4) 无法确认的字段不要编造，直接留空字符串 \"\"，并把字段名加入 needsUserConfirm。
5) 只输出 JSON，不要输出解释。

输出格式：
{
  "fieldValues": {
    "productCategory": "string",
    "direction": "string"
  },
  "needsUserConfirm": ["fieldKey1", "fieldKey2"]
}
```

### 18.3 文本润色
用途：

- 优化 `baselineModelSupplement` 或用户补充说明；
- 把模糊的审美词转为可执行的服饰图像约束；
- 保证补充文本优先服务服装主体，而不是空泛人物氛围。

提示词：
```json
你是一位服饰套图文案润色专家。请将下方用户的补充说明优化为“可执行的图像生成约束”，并保持原意。

补充说明：
xxxxxxxxxxxx

润色目标：
1) 先强化服装主体，再强化人物姿态、场景语义和镜头语言。
2) 明确版型、面料、动作、构图、表情氛围和背景限制。
3) 避免空泛词，改成可执行描述。
4) 若用户写了可能造成版型失真、人物越界或违规表达的要求，自动转为合规表述。
5) 输出一段最终可直接拼进提示词的文本。

输出要求：
- 仅输出润色后的文本，不要解释。
- 80~220字为宜。
- 不得破坏服装真实结构、模特一致性和场景可信度。
```

## 19. 结论
服饰套图要按需求模板真正完善，不能只停留在“两步流 + 一条 Prompt 模板”层面，至少要同时补齐：

1. 真实字段与交互层：上传、模特来源、step1 推荐、step2 正式生成、stale 校验。
2. 平台规则层：说明不同平台下套图更适合作为哪类图位，并限制不合规表达。
3. 品类/维度/方向规则层：明确不同服饰品类要重点保护哪些结构与图位语义。
4. 选项值扩展层：把模特类型、性别、年龄、人设、体型等值转成可执行画面约束。
5. 关键能力提示词层：给识别、AI帮写、文本润色提供统一的结构化输入输出约束。

这样整理后，这份文档就更接近模板口径下“可评审、可开发、可测试、可追溯”的完整需求文档。
