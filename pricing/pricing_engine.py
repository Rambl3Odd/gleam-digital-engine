"""
Gleam Golden Set — Module 3: Pricing Engine (Supabase RPC Replica)
===================================================================
Source: D10_Service_Definitions_Companion.md §3, §6, §7, §8
SDR-009: All VTM pricing math runs in Supabase RPCs, not Make.com.
This module replicates the RPC logic for test validation.

CRITICAL RULES:
  - Customer price anchored to 1-tech baseline (CEF NEVER in pricing)
  - Margin floor: total_cost / 0.70 (enforces 30%+ gross margin)
  - Job minimum: $125 general, $450 film
  - Max discount cap: 20% across all discount types combined
  - Markup divisor: 0.70 (SDR: 0.60 vs 0.70 conflict flagged for resolution)
"""
import math
from typing import Optional

# ── Pricing Constants (D10 §6, Master Architecture) ───────────────

LOADED_LABOR_RATE    = 36.00   # $/hr — window cleaning path
BLENDED_CREW_RATE    = 55.00   # $/hr — washing services path
OVERHEAD_MULTIPLIER  = 1.15    # 15% overhead on base cost
SETUP_FEE            = 60.00   # Per job — mobilization, JHA, demob
JOB_MINIMUM          = 125.00  # Hard floor
FILM_MINIMUM         = 450.00  # Film/tint hard floor
MARGIN_DIVISOR       = 0.70    # Enforces 30%+ gross margin
MAX_DISCOUNT_CAP     = 0.20    # 20% max combined discount

# ── Window Cleaning Base Times (D10 §3.1) ─────────────────────────

BASE_TIME = {
    "ext_pane_min":     3.3,
    "int_pane_min":     3.3,
    "screen_min":       1.0,
    "track_min":        1.5,
}

# ── FA Multipliers (D10 §3.2) ─────────────────────────────────────

FA_MULTIPLIER = {
    "FA.1": 1.0,    # Standard (<21 sqft)
    "FA.2": 1.5,    # Large format / picture (≥21 sqft)
    "FA.3": 2.0,    # French grid / true divided light
    "FA.4": 1.0,    # Egress (+ AD.2 access modifier)
    "FA.5": 1.5,    # Skylight (+ HL.3 height modifier)
}

# ── Height Multipliers (D10 §3.3) ─────────────────────────────────

HL_MULTIPLIER = {
    "HL.1": 1.00,   # Ground / 1st story
    "HL.2": 1.25,   # 2nd story
    "HL.3": 1.50,   # 3rd story (40ft+ WFP)
    "HL.4": None,    # 4+ stories → ONSITE escape hatch
}

# ── Gleam-On Discount Tiers ──────────────────────────────────────

GLEAM_ON_DISCOUNT = {
    "GO_BASIC":  0.10,  # 10% — annual subscription
    "GO_PLUS":   0.15,  # 15% — semi-annual
    "GO_PREM":   0.20,  # 20% — quarterly with partner credits
    "NONE":      0.00,
}


def calculate_window_pane_time(pane_count: int, fa_class: str = "FA.1",
                                hl_tier: str = "HL.1",
                                service_type: str = "ext_only") -> dict:
    """Calculate time for a single pane class at a given height tier."""
    if hl_tier == "HL.4":
        return {"escape_hatch": True, "reason": "HL.4 — ONSITE required"}

    fa_mult = FA_MULTIPLIER.get(fa_class, 1.0)
    hl_mult = HL_MULTIPLIER.get(hl_tier, 1.0)

    if service_type == "ext_only":
        base_min = BASE_TIME["ext_pane_min"]
    elif service_type in ("int_ext", "int_ext_full"):
        base_min = BASE_TIME["ext_pane_min"] + BASE_TIME["int_pane_min"]
    elif service_type == "int_ext_selective":
        base_min = BASE_TIME["ext_pane_min"]  # Interior added per-pane
    else:
        base_min = BASE_TIME["ext_pane_min"]

    adjusted_min = base_min * fa_mult * hl_mult
    total_min = adjusted_min * pane_count

    return {
        "pane_count": pane_count,
        "fa_class": fa_class,
        "hl_tier": hl_tier,
        "base_min_per_pane": base_min,
        "adjusted_min_per_pane": round(adjusted_min, 2),
        "total_min": round(total_min, 1),
        "escape_hatch": False,
    }


def calculate_window_quote(total_panes: int, screens: int = 0, tracks: int = 0,
                           hl_distribution: Optional[dict] = None,
                           fa_distribution: Optional[dict] = None,
                           service_type: str = "ext_only",
                           gleam_on_tier: str = "NONE",
                           bundle_discount_pct: float = 0.0) -> dict:
    """
    Full window cleaning quote — replicates Supabase RPC logic.
    
    Args:
        total_panes:        Total cleanable panes (garage excluded)
        screens:            Screen count
        tracks:             Track count
        hl_distribution:    {"HL.1": 0.60, "HL.2": 0.40} — fraction at each tier
        fa_distribution:    {"FA.1": 0.85, "FA.2": 0.15} — fraction at each FA class
        service_type:       ext_only | int_ext | int_ext_full | int_ext_selective
        gleam_on_tier:      NONE | GO_BASIC | GO_PLUS | GO_PREM
        bundle_discount_pct: Additional bundle discount (0-0.10)
    
    Returns:
        Quote JSON with tiered pricing, timing, and margin analysis.
    """
    # Default distributions if not specified
    if hl_distribution is None:
        hl_distribution = {"HL.1": 0.55, "HL.2": 0.45}
    if fa_distribution is None:
        fa_distribution = {"FA.1": 0.90, "FA.2": 0.10}

    # ── Step 1: Calculate pane time by zone ──
    total_pane_min = 0
    zone_breakdown = []

    for hl_tier, hl_frac in hl_distribution.items():
        for fa_class, fa_frac in fa_distribution.items():
            count = round(total_panes * hl_frac * fa_frac)
            if count <= 0:
                continue
            result = calculate_window_pane_time(count, fa_class, hl_tier, service_type)
            if result.get("escape_hatch"):
                return {
                    "quote_mode": "ONSITE",
                    "reason": result["reason"],
                    "assessment_fee": SETUP_FEE,
                }
            total_pane_min += result["total_min"]
            zone_breakdown.append(result)

    # ── Step 2: Screen and track time ──
    screen_min = screens * BASE_TIME["screen_min"]
    track_min = tracks * BASE_TIME["track_min"]

    # ── Step 3: Setup/demob ──
    setup_min = 24  # Minutes for setup + demob (per CPM baseline)

    # ── Step 4: Total time ──
    total_min = total_pane_min + screen_min + track_min + setup_min
    total_hr = total_min / 60

    # ── Step 5: Labor cost ──
    labor_cost = total_hr * LOADED_LABOR_RATE

    # ── Step 6: Overhead ──
    total_cost = labor_cost * OVERHEAD_MULTIPLIER

    # ── Step 7: Setup fee ──
    subtotal = total_cost + SETUP_FEE

    # ── Step 8: Margin protection ──
    minimum_price = subtotal / MARGIN_DIVISOR

    # ── Step 9: Apply job minimum floor ──
    final_price = max(minimum_price, JOB_MINIMUM)

    # ── Step 10: Discount (capped at 20%) ──
    go_discount = GLEAM_ON_DISCOUNT.get(gleam_on_tier, 0)
    total_discount = min(go_discount + bundle_discount_pct, MAX_DISCOUNT_CAP)
    discounted_price = final_price * (1 - total_discount)

    # Re-check margin floor after discount
    achieved_margin = 1 - (subtotal / discounted_price) if discounted_price > 0 else 0
    margin_flag = "GREEN" if achieved_margin >= 0.28 else ("YELLOW" if achieved_margin >= 0.25 else "RED")

    return {
        "quote_mode": "BIND",
        "service_type": service_type,
        "quantities": {
            "total_panes": total_panes,
            "screens": screens,
            "tracks": tracks,
        },
        "timing": {
            "pane_minutes": round(total_pane_min, 1),
            "screen_minutes": round(screen_min, 1),
            "track_minutes": round(track_min, 1),
            "setup_minutes": setup_min,
            "total_minutes": round(total_min, 1),
            "total_hours": round(total_hr, 2),
        },
        "pricing": {
            "labor_cost": round(labor_cost, 2),
            "overhead_cost": round(total_cost - labor_cost, 2),
            "total_cost": round(total_cost, 2),
            "setup_fee": SETUP_FEE,
            "subtotal": round(subtotal, 2),
            "pre_discount_price": round(final_price, 2),
            "discount_applied_pct": round(total_discount * 100, 1),
            "final_price": round(discounted_price, 2),
            "job_minimum_applied": final_price == JOB_MINIMUM,
        },
        "margin": {
            "achieved_margin_pct": round(achieved_margin * 100, 1),
            "margin_flag": margin_flag,
            "target_margin_pct": 30.0,
        },
        "zone_breakdown": zone_breakdown,
    }


def generate_tiered_packages(total_panes: int, screens: int = 0, tracks: int = 0,
                             hl_distribution: Optional[dict] = None,
                             fa_distribution: Optional[dict] = None,
                             garage_panes: int = 0,
                             basement_panes: int = 0,
                             gleam_on_tier: str = "NONE") -> dict:
    """
    Generate the tiered package output per D10 §7.3.
    Returns Complete Care, Pick 3, Exterior Only, and add-ons.
    """
    # Complete Care: int+ext, screens, tracks
    complete = calculate_window_quote(
        total_panes, screens, tracks,
        hl_distribution, fa_distribution,
        service_type="int_ext",
        gleam_on_tier=gleam_on_tier,
    )

    # Pick 3 Bundle: ext + screens + tracks with 10% bundle discount
    pick3 = calculate_window_quote(
        total_panes, screens, tracks,
        hl_distribution, fa_distribution,
        service_type="ext_only",
        gleam_on_tier=gleam_on_tier,
        bundle_discount_pct=0.10,
    )

    # Exterior Only: ext only, no discount
    ext_only = calculate_window_quote(
        total_panes, 0, 0,
        hl_distribution, fa_distribution,
        service_type="ext_only",
        gleam_on_tier=gleam_on_tier,
    )

    # Garage add-on
    garage_addon = None
    if garage_panes > 0:
        garage_addon = calculate_window_quote(
            garage_panes, 0, 0,
            {"HL.1": 1.0}, fa_distribution,
            service_type="ext_only",
        )

    # Basement add-on
    basement_addon = None
    if basement_panes > 0:
        basement_addon = calculate_window_quote(
            basement_panes, 0, 0,
            {"HL.1": 1.0}, fa_distribution,
            service_type="ext_only",
        )

    return {
        "complete_care": {
            "panes": total_panes,
            "price": complete["pricing"]["final_price"],
            "includes": "int+ext, screens, tracks",
            "margin": complete["margin"],
        },
        "pick_3_bundle": {
            "panes": total_panes,
            "price": pick3["pricing"]["final_price"],
            "discount_pct": 10,
            "includes": "ext + screens + tracks",
            "margin": pick3["margin"],
        },
        "exterior_only": {
            "panes": total_panes,
            "price": ext_only["pricing"]["final_price"],
            "includes": "exterior only",
            "margin": ext_only["margin"],
        },
        "garage_addon": {
            "panes": garage_panes,
            "price": garage_addon["pricing"]["final_price"] if garage_addon else 0,
            "default_included": False,
        } if garage_panes > 0 else None,
        "basement_addon": {
            "panes": basement_panes,
            "price": basement_addon["pricing"]["final_price"] if basement_addon else 0,
            "default_included": False,
        } if basement_panes > 0 else None,
    }


if __name__ == "__main__":
    print("=" * 70)
    print("PRICING ENGINE — Test Scenarios")
    print("=" * 70)

    # Scenario 1: Baseline 30w/20s Moderate (from Window Glass Care Bundle)
    print("\nScenario 1: 30 panes, 20 screens, ext-only, SL.1, HL mixed")
    q1 = calculate_window_quote(30, 20, 0, service_type="ext_only")
    print(f"  Total time: {q1['timing']['total_minutes']:.0f} min ({q1['timing']['total_hours']:.2f} hr)")
    print(f"  Labor cost: ${q1['pricing']['labor_cost']:.2f}")
    print(f"  Final price: ${q1['pricing']['final_price']:.2f}")
    print(f"  Margin: {q1['margin']['achieved_margin_pct']:.1f}% [{q1['margin']['margin_flag']}]")

    # Scenario 2: Large 2-story int+ext (J55 proxy: 68 panes, 60 screens)
    print("\nScenario 2: 68 panes, 60 screens, int+ext (J55 proxy)")
    q2 = calculate_window_quote(68, 60, 0, service_type="int_ext")
    print(f"  Total time: {q2['timing']['total_minutes']:.0f} min ({q2['timing']['total_hours']:.2f} hr)")
    print(f"  Labor cost: ${q2['pricing']['labor_cost']:.2f}")
    print(f"  Final price: ${q2['pricing']['final_price']:.2f}")
    print(f"  Margin: {q2['margin']['achieved_margin_pct']:.1f}% [{q2['margin']['margin_flag']}]")

    # Scenario 3: HL.3 tower windows (J28 Mayotte proxy)
    print("\nScenario 3: 47 panes with HL.3 (J28 Mayotte proxy)")
    q3 = calculate_window_quote(
        47, 10, 0,
        hl_distribution={"HL.1": 0.30, "HL.2": 0.57, "HL.3": 0.13},
        service_type="int_ext",
    )
    print(f"  Total time: {q3['timing']['total_minutes']:.0f} min ({q3['timing']['total_hours']:.2f} hr)")
    print(f"  Final price: ${q3['pricing']['final_price']:.2f}")
    print(f"  Margin: {q3['margin']['achieved_margin_pct']:.1f}% [{q3['margin']['margin_flag']}]")

    # Scenario 4: Tiered package output
    print("\nScenario 4: Tiered packages for 58-pane property")
    pkgs = generate_tiered_packages(58, 30, 0, garage_panes=8, basement_panes=6)
    for tier, data in pkgs.items():
        if data:
            print(f"  {tier}: ${data['price']:.2f}" + 
                  (f" ({data.get('includes', '')})" if 'includes' in data else ""))

    # Scenario 5: Gleam-On discount
    print("\nScenario 5: Same 58-pane with GO_PLUS (15% discount)")
    q5 = calculate_window_quote(58, 30, 0, service_type="ext_only", gleam_on_tier="GO_PLUS")
    print(f"  Pre-discount: ${q5['pricing']['pre_discount_price']:.2f}")
    print(f"  After 15% GO_PLUS: ${q5['pricing']['final_price']:.2f}")
    print(f"  Margin: {q5['margin']['achieved_margin_pct']:.1f}% [{q5['margin']['margin_flag']}]")
