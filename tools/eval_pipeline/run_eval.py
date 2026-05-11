#!/usr/bin/env python3
import argparse
import json
import os
import shlex
import subprocess
import time
from pathlib import Path


def load_cases(path: Path):
    cases = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            cases.append(json.loads(line))
    return cases


def render_cmd(template: str, payload: dict):
    cmd = template
    replacements = {
        "{image_path}": payload["image_path"],
        "{prompt}": payload.get("prompt", ""),
        "{negative_prompt}": payload.get("negative_prompt", ""),
        "{output_path}": payload["output_path"],
        "{case_id}": payload["case_id"],
    }
    for key, value in replacements.items():
        cmd = cmd.replace(key, shlex.quote(str(value)))
    return cmd


def run_case(command_template: str, payload: dict, timeout_s: int):
    cmd = render_cmd(command_template, payload)
    start = time.time()
    try:
        proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout_s)
        latency_ms = int((time.time() - start) * 1000)
        ok = proc.returncode == 0 and Path(payload["output_path"]).exists()
        return {
            "success": ok,
            "latency_ms": latency_ms,
            "return_code": proc.returncode,
            "stdout": proc.stdout[-2000:],
            "stderr": proc.stderr[-2000:],
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "latency_ms": int((time.time() - start) * 1000),
            "return_code": -1,
            "stdout": "",
            "stderr": f"timeout after {timeout_s}s",
        }


def main():
    parser = argparse.ArgumentParser(description="Batch generation runner for prompt evaluation")
    parser.add_argument("--cases", required=True, help="Path to jsonl cases")
    parser.add_argument("--run-id", required=True, help="Run identifier, e.g. prompt_v2")
    parser.add_argument("--command-template", required=True, help="Shell template for generation call")
    parser.add_argument("--output-root", default="tools/eval_pipeline/results", help="Root output directory")
    parser.add_argument("--timeout", type=int, default=120, help="Per-case timeout seconds")
    args = parser.parse_args()

    cases_path = Path(args.cases)
    cases = load_cases(cases_path)
    run_dir = Path(args.output_root) / args.run_id
    images_dir = run_dir / "images"
    logs_dir = run_dir / "logs"
    images_dir.mkdir(parents=True, exist_ok=True)
    logs_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = run_dir / "manifest.jsonl"

    with manifest_path.open("w", encoding="utf-8") as manifest:
        for case in cases:
            case_id = case["case_id"]
            ext = Path(case["image_path"]).suffix or ".png"
            out_path = images_dir / f"{case_id}{ext}"
            payload = {
                "case_id": case_id,
                "image_path": case["image_path"],
                "prompt": case.get("prompt", ""),
                "negative_prompt": case.get("negative_prompt", ""),
                "output_path": str(out_path),
            }
            result = run_case(args.command_template, payload, args.timeout)

            record = {
                "run_id": args.run_id,
                "case_id": case_id,
                "bucket": case.get("bucket", "unknown"),
                "input_image": case["image_path"],
                "output_image": str(out_path),
                "prompt": case.get("prompt", ""),
                "negative_prompt": case.get("negative_prompt", ""),
                "meta": case.get("meta", {}),
                "expected_text": case.get("expected_text", []),
                "expected_ocr": case.get("expected_ocr", []),
                **result,
            }
            manifest.write(json.dumps(record, ensure_ascii=False) + "\n")

            with (logs_dir / f"{case_id}.log.json").open("w", encoding="utf-8") as lf:
                lf.write(json.dumps(record, ensure_ascii=False, indent=2))

    print(f"done. manifest: {manifest_path}")


if __name__ == "__main__":
    main()
