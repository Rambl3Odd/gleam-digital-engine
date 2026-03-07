"""
Gleam Golden Set — Module 2: Tier A Non-Window Primitive Estimators
====================================================================
Source: D6_Geographic_Priors_Companion.md §6
These are FALLBACK formulas for when Solar API / satellite is unavailable.
Per SDR-001: D6 is sanity-check-only for non-window primitives.
Per SDR-008: Castle Rock Solar API returns 404 — Tier A is PRIMARY until coverage arrives.

Confidence levels (assessor-only):
  Gutter LF:    0.50
  Roof area:    0.40
  Siding area:  0.45
  Driveway:     0.35
  Fence:        0.00 (not inferable from assessor)
"""
import math
from typing import Optional

# ── Gutter LF (D6 §6.1) ──────────────────────────────────────────

ASPECT_CORRECTION = {
    "ranch_1story":  1.08,
    "2story_garage": 1.12,
    "townhome":      1.15,
    "split_level":   1.10,
    "default":       1.10,
}

COMPLEXITY_FACTOR = {
    "1story_simple":       1.20,
    "2story_standard":     1.35,
    "2story_complex":      1.50,
    "default":             1.35,
}


def est_gutter_lf(agsf: float, stories: int, is_townhome: bool = False,
                  complexity: str = "default") -> dict:
    """Estimate gutter linear footage from assessor data."""
    footprint = agsf / max(stories, 1)
    perimeter = math.sqrt(footprint) * 4

    if is_townhome:
        ac = ASPECT_CORRECTION["townhome"]
    elif stories == 1:
        ac = ASPECT_CORRECTION["ranch_1story"]
    else:
        ac = ASPECT_CORRECTION["2story_garage"]

    cf = COMPLEXITY_FACTOR.get(complexity, COMPLEXITY_FACTOR["default"])
    gutter_lf = perimeter * ac * cf
    downspouts = max(2, round(gutter_lf / 40))

    return {
        "gutter_linear_ft": round(gutter_lf, 0),
        "downspout_count": downspouts,
        "footprint_sqft": round(footprint, 0),
        "confidence": 0.50,
        "source": "Tier A assessor formula (D6 §6.1)",
    }


# ── Roof Area (D6 §6.2) ──────────────────────────────────────────

PITCH_FACTOR = {
    "low_3_4":      1.05,
    "standard_5":   1.15,   # Douglas County default
    "moderate_6_7": 1.20,
    "steep_8_10":   1.30,
    "very_steep":   1.42,
    "default":      1.15,
}

ROOF_COMPLEXITY = {
    "simple_1_2":    1.00,
    "standard_3_4":  1.10,
    "complex_5_7":   1.25,
    "very_complex":  1.40,
    "default":       1.10,  # RC not inferable from assessor — default when unknown
}


def est_roof_area(agsf: float, stories: int,
                  pitch: str = "default", complexity: str = "default") -> dict:
    """Estimate roof area from assessor data. RC defaults to 1.10 when unknown."""
    footprint = agsf / max(stories, 1)
    pf = PITCH_FACTOR.get(pitch, PITCH_FACTOR["default"])
    rc = ROOF_COMPLEXITY.get(complexity, ROOF_COMPLEXITY["default"])
    area = footprint * pf * rc

    confidence = 0.40 if complexity == "default" else 0.55
    return {
        "roof_area_sqft": round(area, 0),
        "pitch_factor": pf,
        "complexity_multiplier": rc,
        "footprint_sqft": round(footprint, 0),
        "confidence": confidence,
        "source": "Tier A assessor formula (D6 §6.2)",
        "note": "RC not inferable from assessor" if complexity == "default" else None,
    }


# ── Siding / House Wash Wall Area (D6 §6.3, SDR-004) ─────────────

ACCENT_STONE_TIERS = [
    {"tier": 1, "condition": "quality IN (VG, Excellent, Custom)",           "accent_pct": 0.20, "confidence": 0.75},
    {"tier": 2, "condition": "Good OR (year >= 2005 AND stories >= 2)",      "accent_pct": 0.15, "confidence": 0.60},
    {"tier": 3, "condition": "Average AND year >= 2000 AND Castle Rock",     "accent_pct": 0.08, "confidence": 0.45},
    {"tier": 4, "condition": "Average AND year < 2000",                      "accent_pct": 0.03, "confidence": 0.70},
]

GARAGE_DOOR_AREA = {
    "attached_1car": 63,   # ~7ft × 9ft
    "attached_2car": 112,  # ~16ft × 7ft
    "attached_3car": 168,  # ~24ft × 7ft
    "detached":      112,
    "split_1car_2car": 175,  # 1-car + 2-car
    "none": 0,
    "default": 112,
}

WALKOUT_PROBABILITY = {
    "castle_rock": 0.38,  # 20-55% depending on subdivision, 38% avg
    "flat_terrain": 0.10,
    "default": 0.25,
}


def est_siding_area(agsf: float, stories: int,
                    garage_type: str = "default",
                    bsmt_total: float = 0,
                    quality: str = "Average",
                    year_built: Optional[int] = None,
                    zcta: str = "80104",
                    is_castle_rock: bool = True) -> dict:
    """
    Estimate gross wall area with material decomposition.
    SDR-004: NOTHING washed for free. Gross wall = total billable area.
    Material decomposition drives rate routing, NOT area reduction.
    """
    footprint = agsf / max(stories, 1)
    perimeter = math.sqrt(footprint) * 4

    # Aspect correction for perimeter estimation
    ac = 1.12 if stories >= 2 else 1.08
    est_perimeter = perimeter * ac

    # Main wall area
    wall_height_per_story = 10  # feet
    gross_wall = est_perimeter * (stories * wall_height_per_story)

    # Walk-out addition
    walkout_addition = 0
    if bsmt_total > 0:
        wp = WALKOUT_PROBABILITY.get("castle_rock" if is_castle_rock else "default",
                                      WALKOUT_PROBABILITY["default"])
        walkout_addition = (est_perimeter * 0.35) * 9 * wp
        gross_wall += walkout_addition

    # Accent stone tier (SDR-006)
    accent_pct = 0.03
    accent_confidence = 0.70
    yb = year_built or 1990
    q = quality.lower() if quality else "average"
    if q in ("very good", "excellent", "custom"):
        accent_pct, accent_confidence = 0.20, 0.75
    elif q == "good" or (yb >= 2005 and stories >= 2):
        accent_pct, accent_confidence = 0.15, 0.60
    elif q == "average" and yb >= 2000 and is_castle_rock:
        accent_pct, accent_confidence = 0.08, 0.45

    # Material decomposition (D10 §2.2)
    garage_area = GARAGE_DOOR_AREA.get(garage_type, GARAGE_DOOR_AREA["default"])
    accent_area = round(gross_wall * accent_pct)
    primary_siding = round(gross_wall - garage_area - accent_area)

    # Validation: components must sum to gross_wall
    decomp_sum = primary_siding + accent_area + garage_area
    assert abs(decomp_sum - round(gross_wall)) <= 1, \
        f"Material decomposition error: {decomp_sum} != {round(gross_wall)}"

    return {
        "gross_wall_sqft": round(gross_wall),
        "material_decomposition": {
            "primary_siding_sqft": primary_siding,
            "accent_stone_sqft": accent_area,
            "garage_door_sqft": garage_area,
            "decomp_total": decomp_sum,
        },
        "accent_stone_tier": {
            "accent_pct": accent_pct,
            "confidence": accent_confidence,
        },
        "walkout_addition_sqft": round(walkout_addition),
        "confidence": 0.45,
        "source": "Tier A assessor formula (D6 §6.3, SDR-004)",
    }


# ── Driveway / Flatwork (D6 §6.4) ────────────────────────────────

DRIVEWAY_BASE = {
    "none":             0,
    "attached_1car":  300,
    "attached_2car":  500,
    "attached_3car":  700,
    "detached":       350,
    "split_1car_2car": 600,
    "default":        500,
}


def est_driveway_area(garage_type: str = "default",
                      lot_sqft: Optional[float] = None) -> dict:
    """Estimate driveway and flatwork area."""
    base = DRIVEWAY_BASE.get(garage_type, DRIVEWAY_BASE["default"])
    walkway = 80
    patio = min(500, round(lot_sqft * 0.03)) if lot_sqft else 0
    total = base + walkway + patio

    return {
        "driveway_area_sqft": total,
        "components": {
            "driveway_base": base,
            "walkway_allowance": walkway,
            "rear_patio_est": patio,
        },
        "confidence": 0.35,
        "source": "Tier A assessor formula (D6 §6.4)",
    }


# ── Comprehensive Property Estimate ──────────────────────────────

def estimate_all_primitives(agsf: float, stories: int,
                           is_townhome: bool = False,
                           garage_type: str = "default",
                           bsmt_total: float = 0,
                           quality: str = "Average",
                           year_built: Optional[int] = None,
                           lot_sqft: Optional[float] = None,
                           is_castle_rock: bool = True) -> dict:
    """Run all Tier A estimators for a property."""
    return {
        "gutter": est_gutter_lf(agsf, stories, is_townhome),
        "roof": est_roof_area(agsf, stories),
        "siding": est_siding_area(agsf, stories, garage_type, bsmt_total,
                                  quality, year_built, is_castle_rock=is_castle_rock),
        "driveway": est_driveway_area(garage_type, lot_sqft),
        "fence": {"linear_ft": None, "confidence": 0.00,
                  "note": "Not inferable from assessor. Requires parcel polygon + satellite."},
    }


if __name__ == "__main__":
    # Worked example: 2490 Trailblazer Way (J38) — photo-validated
    print("=" * 70)
    print("TIER A ESTIMATOR — Worked Example: 2490 Trailblazer Way")
    print("=" * 70)

    # Using approximate AGSF (job history total was 4616, basement present)
    est = estimate_all_primitives(
        agsf=3060,  # Approximate AGSF from D10 worked example
        stories=2,
        garage_type="attached_2car",
        bsmt_total=1000,
        quality="Average",
        year_built=2005,
        lot_sqft=7000,
    )

    for key, val in est.items():
        print(f"\n{key.upper()}:")
        if isinstance(val, dict):
            for k, v in val.items():
                print(f"  {k}: {v}")
    
    print("\n" + "=" * 70)
    print("Photo-validated siding (D10 §2.5): ~2700 sqft total")
    print(f"Tier A estimate: {est['siding']['gross_wall_sqft']} sqft")
    print(f"Delta: {est['siding']['gross_wall_sqft'] - 2700:+d} sqft "
          f"({(est['siding']['gross_wall_sqft'] - 2700)/2700*100:+.1f}%)")
