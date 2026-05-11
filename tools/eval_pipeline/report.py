#!/usr/bin/env python3
import argparse
from pathlib import Path

import pandas as pd


def summarize(df: pd.DataFrame, score_col: str = "final_score"):
    summary = {
        "count": len(df),
        "success_rate": float(df["success"].mean()) if len(df) else 0.0,
        "avg_final_score": float(df[score_col].mean()) if len(df) else 0.0,
        "p50_latency_ms": float(df["latency_ms"].median()) if len(df) else 0.0,
        "p95_latency_ms": float(df["latency_ms"].quantile(0.95)) if len(df) else 0.0,
    }
    return summary


def main():
    parser = argparse.ArgumentParser(description="Compare two score csv files and export markdown report")
    parser.add_argument("--baseline", required=True, help="baseline score csv")
    parser.add_argument("--candidate", required=True, help="candidate score csv")
    parser.add_argument("--output", required=True, help="output markdown report path")
    parser.add_argument("--degrade-threshold", type=float, default=-0.05, help="significant degrade threshold")
    args = parser.parse_args()

    base = pd.read_csv(args.baseline)
    cand = pd.read_csv(args.candidate)

    merged = base.merge(cand, on="case_id", suffixes=("_base", "_cand"))
    merged["delta_score"] = merged["final_score_cand"] - merged["final_score_base"]

    base_summary = summarize(base)
    cand_summary = summarize(cand)

    bucket_cmp = (
        merged.groupby("bucket_base", as_index=False)
        .agg(base_score=("final_score_base", "mean"), cand_score=("final_score_cand", "mean"))
        .rename(columns={"bucket_base": "bucket"})
    )
    bucket_cmp["delta"] = bucket_cmp["cand_score"] - bucket_cmp["base_score"]
    bucket_cmp = bucket_cmp.sort_values("delta")

    degraded = merged[merged["delta_score"] <= args.degrade_threshold].copy()
    degraded = degraded.sort_values("delta_score").head(50)

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)

    lines = []
    lines.append("# Prompt Evaluation Report")
    lines.append("")
    lines.append("## Overall")
    lines.append("")
    lines.append(f"- Baseline avg score: {base_summary['avg_final_score']:.4f}")
    lines.append(f"- Candidate avg score: {cand_summary['avg_final_score']:.4f}")
    lines.append(f"- Delta avg score: {cand_summary['avg_final_score'] - base_summary['avg_final_score']:+.4f}")
    lines.append(f"- Baseline success rate: {base_summary['success_rate']:.2%}")
    lines.append(f"- Candidate success rate: {cand_summary['success_rate']:.2%}")
    lines.append(f"- Baseline p95 latency: {base_summary['p95_latency_ms']:.0f} ms")
    lines.append(f"- Candidate p95 latency: {cand_summary['p95_latency_ms']:.0f} ms")
    lines.append("")

    lines.append("## Bucket Comparison")
    lines.append("")
    lines.append("| bucket | base_score | cand_score | delta |")
    lines.append("|---|---:|---:|---:|")
    for _, r in bucket_cmp.iterrows():
        lines.append(f"| {r['bucket']} | {r['base_score']:.4f} | {r['cand_score']:.4f} | {r['delta']:+.4f} |")
    lines.append("")

    lines.append("## Worst Cases")
    lines.append("")
    if degraded.empty:
        lines.append("No significant degraded cases under threshold.")
    else:
        lines.append("| case_id | bucket | base | cand | delta |")
        lines.append("|---|---|---:|---:|---:|")
        for _, r in degraded.iterrows():
            lines.append(
                f"| {r['case_id']} | {r['bucket_base']} | {r['final_score_base']:.4f} | {r['final_score_cand']:.4f} | {r['delta_score']:+.4f} |"
            )

    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"done. report: {out}")


if __name__ == "__main__":
    main()
