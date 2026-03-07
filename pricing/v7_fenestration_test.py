"""
Gleam Golden Set — Module 1: V7 Fenestration Regression Model
=============================================================
Source: D6_Geographic_Priors_Companion.md §2
Locked coefficients calibrated from 19 full-scope Castle Rock jobs.
Target MAPE: ~10.5% on full-scope validation corpus.

CRITICAL: This model predicts CLEANABLE panes only.
Garage panes are ALWAYS excluded (SDR-002).
Partial scope jobs validated against est_full_property_panes, NOT invoice.
"""
import json
import math
import sys
from typing import Optional

# ── V7 Locked Coefficients (D6 §2.1) ─────────────────────────────
V7 = {
    "intercept":              -17.1,
    "agsf_per_1000":           43.0,
    "agsf_sq_per_1000":        -3.3,   # Quadratic deceleration above ~3500sf
    "is_2story":               22.0,
    "bsmt_total_per_1000":      4.9,   # Walk-out fenestration capture
    "bedrooms":               -11.7,   # More bedrooms = more partition walls = fewer windows
    "is_good_plus":           -12.7,   # Good+ quality = fewer but LARGER panes
    "is_townhome":             -2.9,   # Shared walls eliminate ~3 panes
}

# ── Variance Framework (D6 §10, Master Architecture §8.7) ────────
VARIANCE = {
    "GREEN":  {"max_pct": 15.0},
    "YELLOW": {"min_pct": 15.0, "max_pct": 25.0},
    "RED":    {"min_pct": 25.0},
}


def v7_predict(agsf: float, is_2story: int, bsmt_total: float,
               bedrooms: int, is_good_plus: int, is_townhome: int) -> float:
    """
    V7 fenestration regression: predicts CLEANABLE panes (garage excluded).
    
    Args:
        agsf:          Above-Grade Square Footage (Col 8 of Property_Improvements.txt). 
                       NEVER total sqft. NEVER include basement.
        is_2story:     1 if stories >= 2 (including split-levels), else 0
        bsmt_total:    Finished + unfinished basement sqft combined (Col 14 + Col 15)
        bedrooms:      Bedroom count from assessor (Col 24)
        is_good_plus:  1 if quality IN ('Good', 'Very Good', 'Excellent'), else 0
        is_townhome:   1 if property_type = 'Townhouse', else 0
    
    Returns:
        Predicted cleanable pane count (float, floor 0).
    """
    c = V7
    pred = (c["intercept"]
            + (agsf / 1000) * c["agsf_per_1000"]
            + (agsf / 1000) ** 2 * c["agsf_sq_per_1000"]
            + is_2story * c["is_2story"]
            + (bsmt_total / 1000) * c["bsmt_total_per_1000"]
            + bedrooms * c["bedrooms"]
            + is_good_plus * c["is_good_plus"]
            + is_townhome * c["is_townhome"])
    return max(round(pred, 1), 0.0)


def classify_variance(predicted: float, actual: float) -> dict:
    """Classify prediction error into GREEN/YELLOW/RED framework."""
    if actual == 0:
        return {"error": predicted, "pct": float('inf'), "flag": "RED"}
    error = predicted - actual
    pct = abs(error / actual) * 100
    if pct <= VARIANCE["GREEN"]["max_pct"]:
        flag = "GREEN"
    elif pct <= VARIANCE["YELLOW"]["max_pct"]:
        flag = "YELLOW"
    else:
        flag = "RED"
    return {"error": round(error, 1), "pct": round(pct, 1), "flag": flag}


def pane_density_check(total_panes: int, agsf: float) -> dict:
    """
    Partial scope density filter: <7 panes/1000sf AGSF = likely partial scope.
    Catches extreme cases (J39 at 4.3, J41 at 5.3).
    Misses moderate partial (J49 at 12.4, J56 at 15.8).
    """
    if agsf <= 0:
        return {"density": 0, "likely_partial": True}
    density = total_panes / agsf * 1000
    return {"density": round(density, 1), "likely_partial": density < 7.0}


def validate_golden_set(golden_set_path: str) -> dict:
    """
    Run V7 validation against the Golden Set.
    Returns MAPE, MAE, and per-property results.
    Only validates properties with:
      - assessor.agsf != "LOOKUP_REQUIRED"
      - invoice.scope_type == "full" (for standard validation)
      - invoice.scope_type == "partial" (validated against est_full_property_panes)
    """
    with open(golden_set_path) as f:
        gs = json.load(f)

    results = {"full_scope": [], "partial_scope": [], "blocked": [], "not_applicable": []}

    for prop in gs["properties"]:
        a = prop["assessor"]

        # Check if assessor data is available
        if isinstance(a.get("agsf"), str):
            results["blocked"].append({
                "id": prop["id"],
                "address": prop["address"],
                "reason": a["agsf"]
            })
            continue

        # Check if V7 is applicable (residential only)
        if prop.get("property_type") == "Commercial":
            results["not_applicable"].append({
                "id": prop["id"],
                "address": prop["address"],
                "reason": "Commercial — V7 residential only"
            })
            continue

        # Compute V7 prediction
        bsmt_f = a.get("bsmt_finished") or 0
        bsmt_u = a.get("bsmt_unfinished") or 0
        bsmt_total = (bsmt_f if isinstance(bsmt_f, (int, float)) else 0) + \
                     (bsmt_u if isinstance(bsmt_u, (int, float)) else 0)

        pred = v7_predict(
            agsf=a["agsf"],
            is_2story=a.get("is_2story", 0) or 0,
            bsmt_total=bsmt_total,
            bedrooms=a.get("bedrooms", 3) or 3,
            is_good_plus=a.get("is_good_plus", 0) or 0,
            is_townhome=a.get("is_townhome", 0) or 0,
        )

        inv = prop.get("invoice")
        if not inv:
            results["blocked"].append({
                "id": prop["id"], "address": prop["address"],
                "prediction": pred, "reason": "No invoice"
            })
            continue

        scope = inv.get("scope_type", "full")
        if scope == "full":
            actual = inv["total_panes"]
            var = classify_variance(pred, actual)
            results["full_scope"].append({
                "id": prop["id"],
                "job_id": prop.get("job_id"),
                "address": prop["address"],
                "predicted": pred,
                "actual": actual,
                "error": var["error"],
                "pct_error": var["pct"],
                "flag": var["flag"],
            })
        elif scope == "partial":
            est_full = inv.get("est_full_property_panes", inv["total_panes"])
            var = classify_variance(pred, est_full)
            results["partial_scope"].append({
                "id": prop["id"],
                "job_id": prop.get("job_id"),
                "address": prop["address"],
                "predicted": pred,
                "est_full": est_full,
                "invoice_panes": inv["total_panes"],
                "error_vs_est_full": var["error"],
                "pct_error_vs_est_full": var["pct"],
                "flag": var["flag"],
                "scope_pattern": inv.get("scope_pattern"),
            })

    # Compute aggregate metrics on full-scope only
    fs = results["full_scope"]
    if fs:
        mape = sum(r["pct_error"] for r in fs) / len(fs)
        mae = sum(abs(r["error"]) for r in fs) / len(fs)
        green = sum(1 for r in fs if r["flag"] == "GREEN")
        yellow = sum(1 for r in fs if r["flag"] == "YELLOW")
        red = sum(1 for r in fs if r["flag"] == "RED")
        results["summary"] = {
            "n_full_scope": len(fs),
            "mape": round(mape, 1),
            "mae": round(mae, 1),
            "green_count": green,
            "yellow_count": yellow,
            "red_count": red,
            "green_pct": round(green / len(fs) * 100, 0),
            "target_mape": 10.5,
            "target_green_pct": 79,
            "pass": mape <= 15.0 and green / len(fs) >= 0.70,
        }
    else:
        results["summary"] = {
            "n_full_scope": 0,
            "status": "BLOCKED — no properties have assessor AGSF populated",
        }

    results["n_blocked"] = len(results["blocked"])
    results["n_partial"] = len(results["partial_scope"])
    results["n_not_applicable"] = len(results["not_applicable"])

    return results


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "golden_set.json"
    results = validate_golden_set(path)

    print("=" * 80)
    print("V7 FENESTRATION MODEL — GOLDEN SET VALIDATION")
    print("=" * 80)

    s = results.get("summary", {})
    if s.get("status"):
        print(f"\nSTATUS: {s['status']}")
    else:
        print(f"\nFull-scope jobs validated: {s['n_full_scope']}")
        print(f"MAPE:   {s['mape']}%  (target: ≤{s['target_mape']}%)")
        print(f"MAE:    {s['mae']} panes")
        print(f"GREEN:  {s['green_count']} ({s['green_pct']}%)  (target: ≥{s['target_green_pct']}%)")
        print(f"YELLOW: {s['yellow_count']}")
        print(f"RED:    {s['red_count']}")
        print(f"PASS:   {'YES' if s['pass'] else 'NO'}")

    print(f"\nBlocked (no assessor data): {results['n_blocked']}")
    print(f"Partial scope validated:    {results['n_partial']}")
    print(f"Not applicable:             {results['n_not_applicable']}")

    if results["full_scope"]:
        print(f"\n{'Job':>5} | {'Address':<40} | {'Pred':>5} {'Act':>4} | {'Err':>7} | Flag")
        print("-" * 80)
        for r in results["full_scope"]:
            print(f"{r['job_id'] or '---':>5} | {r['address'][:40]:<40} | {r['predicted']:>5.1f} {r['actual']:>4} | {r['pct_error']:>+6.1f}% | {r['flag']}")

    if results["partial_scope"]:
        print(f"\n{'Job':>5} | {'Address':<40} | {'Pred':>5} {'Est':>4} {'Inv':>4} | Pattern")
        print("-" * 80)
        for r in results["partial_scope"]:
            print(f"{r['job_id'] or '---':>5} | {r['address'][:40]:<40} | {r['predicted']:>5.1f} {r['est_full']:>4} {r['invoice_panes']:>4} | {r['scope_pattern']}")

    # Write results
    with open("v7_validation_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to v7_validation_results.json")
