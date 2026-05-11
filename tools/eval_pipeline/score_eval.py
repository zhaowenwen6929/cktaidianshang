#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

import cv2
import lpips
import numpy as np
import open_clip
import pandas as pd
import torch
from PIL import Image
from skimage.metrics import structural_similarity as ssim

try:
    import easyocr
except ImportError:
    easyocr = None


DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def load_jsonl(path: Path):
    rows = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def image_quality_score(img_bgr: np.ndarray) -> float:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    lap = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = gray.mean() / 255.0
    sharp = min(lap / 500.0, 1.0)
    exposure = 1.0 - min(abs(brightness - 0.55) / 0.55, 1.0)
    return float(0.6 * sharp + 0.4 * exposure)


def clip_text_similarity(model, preprocess, tokenizer, image_path: Path, text: str) -> float:
    image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(DEVICE)
    text_token = tokenizer([text]).to(DEVICE)
    with torch.no_grad():
        image_features = model.encode_image(image)
        text_features = model.encode_text(text_token)
        image_features /= image_features.norm(dim=-1, keepdim=True)
        text_features /= text_features.norm(dim=-1, keepdim=True)
        sim = (image_features @ text_features.T).item()
    return float((sim + 1.0) / 2.0)


def calc_ssim_lpips(lpips_model, input_path: Path, output_path: Path):
    input_bgr = cv2.imread(str(input_path))
    output_bgr = cv2.imread(str(output_path))
    if input_bgr is None or output_bgr is None:
        return 0.0, 1.0

    h = min(input_bgr.shape[0], output_bgr.shape[0])
    w = min(input_bgr.shape[1], output_bgr.shape[1])
    input_bgr = cv2.resize(input_bgr, (w, h))
    output_bgr = cv2.resize(output_bgr, (w, h))

    ssim_score = float(
        ssim(
            cv2.cvtColor(input_bgr, cv2.COLOR_BGR2GRAY),
            cv2.cvtColor(output_bgr, cv2.COLOR_BGR2GRAY),
            data_range=255,
        )
    )

    t1 = torch.tensor(input_bgr[:, :, ::-1].copy()).permute(2, 0, 1).float() / 127.5 - 1
    t2 = torch.tensor(output_bgr[:, :, ::-1].copy()).permute(2, 0, 1).float() / 127.5 - 1
    with torch.no_grad():
        d = lpips_model(t1.unsqueeze(0).to(DEVICE), t2.unsqueeze(0).to(DEVICE)).item()
    return ssim_score, float(d)


def ocr_recall(reader, image_path: Path, expected_terms):
    if not expected_terms:
        return 1.0
    if reader is None:
        return 0.0

    result = reader.readtext(str(image_path), detail=0)
    joined = " ".join([str(x) for x in result])
    hit = sum(1 for t in expected_terms if str(t) in joined)
    return float(hit / max(len(expected_terms), 1))


def normalize_lpips(lpips_distance: float) -> float:
    return max(0.0, min(1.0, 1.0 - lpips_distance))


def main():
    parser = argparse.ArgumentParser(description="Score generated images and output score csv")
    parser.add_argument("--manifest", required=True, help="manifest jsonl path")
    parser.add_argument("--output", required=True, help="output csv path")
    args = parser.parse_args()

    manifest = load_jsonl(Path(args.manifest))

    clip_model, _, clip_preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k")
    clip_model = clip_model.to(DEVICE).eval()
    clip_tokenizer = open_clip.get_tokenizer("ViT-B-32")
    lpips_model = lpips.LPIPS(net="alex").to(DEVICE).eval()
    ocr_reader = easyocr.Reader(["ch_sim", "en"], gpu=torch.cuda.is_available()) if easyocr else None

    rows = []
    for row in manifest:
        output_path = Path(row["output_image"])
        input_path = Path(row["input_image"])

        if not row.get("success") or not output_path.exists():
            rows.append(
                {
                    "run_id": row["run_id"],
                    "case_id": row["case_id"],
                    "bucket": row.get("bucket", "unknown"),
                    "success": 0,
                    "clip_score": 0.0,
                    "ssim_score": 0.0,
                    "lpips_score": 0.0,
                    "ocr_recall": 0.0,
                    "quality_score": 0.0,
                    "latency_ms": row.get("latency_ms", 0),
                    "final_score": 0.0,
                }
            )
            continue

        clip_score = clip_text_similarity(clip_model, clip_preprocess, clip_tokenizer, output_path, row.get("prompt", ""))
        ssim_score, lpips_distance = calc_ssim_lpips(lpips_model, input_path, output_path)
        lpips_score = normalize_lpips(lpips_distance)

        img_bgr = cv2.imread(str(output_path))
        quality_score = image_quality_score(img_bgr) if img_bgr is not None else 0.0
        ocr_score = ocr_recall(ocr_reader, output_path, row.get("expected_ocr", []))

        need_structure = bool((row.get("meta") or {}).get("need_structure_similarity", False))
        structure_weight = 0.2 if need_structure else 0.05

        final_score = (
            0.35 * clip_score
            + structure_weight * ssim_score
            + 0.20 * lpips_score
            + 0.15 * ocr_score
            + (0.30 - structure_weight) * quality_score
        )

        rows.append(
            {
                "run_id": row["run_id"],
                "case_id": row["case_id"],
                "bucket": row.get("bucket", "unknown"),
                "success": int(row.get("success", False)),
                "clip_score": round(clip_score, 4),
                "ssim_score": round(ssim_score, 4),
                "lpips_score": round(lpips_score, 4),
                "ocr_recall": round(ocr_score, 4),
                "quality_score": round(quality_score, 4),
                "latency_ms": row.get("latency_ms", 0),
                "final_score": round(float(final_score), 4),
            }
        )

    df = pd.DataFrame(rows)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"done. score csv: {output_path}")


if __name__ == "__main__":
    main()
