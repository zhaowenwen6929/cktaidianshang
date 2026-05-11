# 图像效果自动评测流水线（Prompt Eval Pipeline）

用于批量验证“不同图类型在一套提示词下的效果”，实现自动跑图、自动打分、自动对比报告。

## 目录

- `cases/sample_cases.jsonl`：测试用例模板
- `run_eval.py`：批量调用生成接口/脚本并产出 manifest
- `score_eval.py`：自动多维打分（CLIP/SSIM/LPIPS/OCR/质量）
- `report.py`：基线与候选版本对比报告
- `requirements.txt`：Python 依赖

## 1) 准备测试集

用 `jsonl`，一行一个 case，例如：

```json
{"case_id":"goods_001","bucket":"goods","image_path":"./assets/inputs/goods_001.jpg","prompt":"生成电商白底商品图，主体居中，边缘清晰，光照均匀。","negative_prompt":"阴影过重, 杂乱背景","expected_ocr":[],"meta":{"need_structure_similarity":true}}
```

建议按 `bucket` 分桶：`portrait/goods/poster_text/...`。

## 2) 安装依赖

```bash
cd /Users/zhaowenwen/CODEX/CKTAI电商
python3 -m venv .venv-eval
source .venv-eval/bin/activate
pip install -r tools/eval_pipeline/requirements.txt
```

## 3) 批量跑图

`--command-template` 里使用占位符：
- `{image_path}`
- `{prompt}`
- `{negative_prompt}`
- `{output_path}`
- `{case_id}`

示例（调用你自己的生成脚本）：

```bash
python3 tools/eval_pipeline/run_eval.py \
  --cases tools/eval_pipeline/cases/sample_cases.jsonl \
  --run-id prompt_v1 \
  --command-template "python3 your_generate.py --input {image_path} --prompt {prompt} --neg {negative_prompt} --output {output_path}"
```

再跑一个候选版本：

```bash
python3 tools/eval_pipeline/run_eval.py \
  --cases tools/eval_pipeline/cases/sample_cases.jsonl \
  --run-id prompt_v2 \
  --command-template "python3 your_generate_v2.py --input {image_path} --prompt {prompt} --neg {negative_prompt} --output {output_path}"
```

## 4) 自动打分

```bash
python3 tools/eval_pipeline/score_eval.py \
  --manifest tools/eval_pipeline/results/prompt_v1/manifest.jsonl \
  --output tools/eval_pipeline/results/prompt_v1/score.csv

python3 tools/eval_pipeline/score_eval.py \
  --manifest tools/eval_pipeline/results/prompt_v2/manifest.jsonl \
  --output tools/eval_pipeline/results/prompt_v2/score.csv
```

## 5) 生成对比报告

```bash
python3 tools/eval_pipeline/report.py \
  --baseline tools/eval_pipeline/results/prompt_v1/score.csv \
  --candidate tools/eval_pipeline/results/prompt_v2/score.csv \
  --output tools/eval_pipeline/reports/prompt_v2_vs_v1.md
```

## 评分说明（默认）

- `clip_score`：图文语义匹配
- `ssim_score`：结构相似
- `lpips_score`：感知相似（已归一化，越高越好）
- `ocr_recall`：文案可读命中率（有文字任务）
- `quality_score`：清晰度+曝光质量
- `final_score`：加权总分（可按业务改权重）

## 接入建议

- 先用 50~100 张每桶做小集，调权重
- 再扩到 300~1000 张做回归门禁
- 在 CI 里设阈值：`avg_final_score` 不下降，关键桶不低于阈值
