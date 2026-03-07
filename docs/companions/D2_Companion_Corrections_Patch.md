# D2 Component Catalog Companion — Corrections Patch
## Apply these changes to D2_Component_Catalog_Companion.md before uploading to project knowledge

---

## PATCH 1: Add GAR_WIN to SYS-04 Fenestration class table

In Section SYS-04, ADD this row to the class table after the WIN row:

| GAR_WIN | Garage Window (decorative insert) | count | WIN-EXT (optional add-on) | default_included: false. SDR-002 v1.8 rule. Excluded from default quotes. Customer can add at booking. |

---

## PATCH 2: Add Service-Specific Garage Treatment Table to SYS-04

INSERT after the SYS-04 class table, before the Assessment Checklist:

**Service-Specific Garage Component Behavior (SDR-002):**

Garage components behave differently depending on which service is being quoted. This table is the component-to-service eligibility mapping that D10 reads at quote time.

| Component | Window Cleaning | House Wash | Gutter Cleaning | Holiday/Perm Lighting |
|-----------|----------------|------------|-----------------|----------------------|
| GAR_WIN (decorative glass) | EXCLUDED from default. Optional add-on. D11: default_included=false | N/A (not a wash surface) | N/A | N/A |
| GAR door surface (GAR.MTL/GAR.WDS) | N/A (not glass) | ALWAYS INCLUDED. Separate material routing. Low-PSI rinse only for metal (oxidation risk). | N/A | N/A |
| Garage roofline section | N/A | N/A | ALWAYS INCLUDED. Lower height tier (HL.1) over garage. | ALWAYS INCLUDED in roofline LF. HL.1 fascia. |
| Garage fascia | N/A | Included in wash area | N/A | ALWAYS INCLUDED. Primary mounting surface for Trimlight over garage bays. |

**Rule:** When the pricing RPC receives a service request, it reads this matrix to determine which garage components are in-scope. The booking hub renders the GAR_WIN add-on toggle only for window cleaning quotes — it never appears for house wash or gutter quotes because those services include the garage components by default.

---

## PATCH 3: Add Partial Scope Fields to Section 6 JSON Template

In Section 6 (Property Intelligence Dossier Template v2), ADD these fields to the root level of the JSON template, after "invoice":

```json
  "scope": {
    "scope_type": "full | partial",
    "scope_exclusions": ["BG0", "GAR_WIN", "Z-1F"],
    "scope_int_ext": "ext_only | int_ext_full | int_ext_selective",
    "customer_scope_ext": {
      "included_zones": ["Z-2F","Z-2L","Z-2R","Z-2B","Z-1F","Z-1L","Z-1R","Z-1B"],
      "excluded_zones": ["BG0","GAR_WIN"],
      "scope_pattern": "full | diy_easy_ones | cherry_pick | level_select | full_ext_selective_int"
    },
    "customer_scope_int": {
      "included_zones": [],
      "selection_mode": "none | all | selective",
      "selective_panes": []
    }
  },
```

Also add `scope_type` and `scope_exclusions` to the L4_operational_context.sequencer_constraints section as required fields:

```json
  "L4_operational_context": {
    "scope_context": {
      "scope_type": "full | partial",
      "scope_exclusions": [],
      "scope_pattern": "",
      "note": "Partial scope jobs excluded from V7 calibration (SDR-003). Sequencer only builds graph for included zones."
    },
    ...
  }
```

---

## PATCH 4: Correct WCI Cost Loading Table — Delta Above Base Rate

In Section 4 (Cross-System Compliance & Risk Register), REPLACE the WCI Cost Loading table with:

**WCI Cost Loading by Activity (DELTA above base rate):**

The $36/hr loaded labor rate already includes the base WCI rate. The values below are the ADDITIONAL WCI premium per $100 of payroll above that base, applied when the activity tier exceeds standard ground-level work. These deltas are added to the job cost, not the customer price — they flow through the margin divisor like all other costs.

| Activity Tier | WCI Delta (per $100 payroll) | Trigger | Applied To |
|--------------|-------|---------|-----------|
| Standard (ground, HL.1) | +$0.00 | Default — all ground-level work | Window ext HL.1, pressure wash, dryer vent (wall) |
| Elevated (ladder, HL.2) | +$0.33 | Any ladder work or 2nd-story access | Window ext HL.2, gutter HL.2, house wash HL.2 |
| High (roof/HL.3+) | +$0.81 | Roof access, 3rd+ story, steep pitch | Roof wash, lighting install, gutter HL.3, window HL.3 |
| Chemical handling (SH) | +$0.31 | Sodium hypochlorite >1% concentration | All soft wash, house wash — stacks with height tier |
| Electrical (NEC work) | +$0.63 | Permanent lighting electrical connection | Trimlight install, hardwired landscape lighting |

**Stacking rule:** A house wash job at HL.2 with SH chemical = Standard base (in $36/hr) + $0.33 elevated + $0.31 chemical = $0.64 total delta per $100 payroll. The pricing RPC reads the height tier and chemical flag from the job components and applies the appropriate delta stack.

**Reconciliation with D10:** D10 §6.1 uses $36/hr loaded labor rate (which includes base WCI) for window cleaning and $55/hr blended crew rate for washing services. The blended crew rate already accounts for the typical WCI delta for wash work. The WCI delta table in D2 is the reference the blended rate was built from — it doesn't add ON TOP of the $55/hr rate. It is used when computing costs for non-standard combinations (e.g., HL.3 wash, which exceeds the typical HL.1-HL.2 blend assumption in the $55/hr figure).

---

## PATCH 5: Add Fence/Deck Staining as Gleam Services

In SYS-07 (Perimeter Elements), CHANGE the partner trigger for fence staining:

**OLD:**
- Weathered/leaning fence → fence company referral
- Wood fence needs staining → painter/stainer referral

**NEW:**
- Fence structural failure (leaning/broken) → fence company referral (Tier A partner)
- Wood fence staining/sealing → **FNC-STN (Gleam service)** — accompanies exterior surface washing
- Vinyl/composite fence washing → **FNC-WSH (Gleam service)** — included in house wash scope when fence is accessible

ADD to SYS-07 class table:
| FNC | Fence | linear_ft | FNC-STN (stain/seal), FNC-WSH (wash), FNC-RPR (repair referral) |

In SYS-08 (Outdoor Living), CHANGE the partner trigger for deck staining:

**OLD:**
- Deck needing stain/seal → deck maintenance contractor

**NEW:**
- Deck staining/sealing → **DK-STN (Gleam service)** — full service accompanying exterior surface washing
- Deck structural repair → deck builder/carpenter referral (Tier A partner)
- Deck wash without stain → **PW-DK (Gleam service)** — pressure wash only

ADD to SYS-08 class table:
| DKP | Deck Surface | area_sqft | PW-DK (deck wash), DK-STN (deck stain/seal) |
| DKR | Deck Railing | linear_ft | PW-DK, DK-STN |

ADD to Section 5 Service-to-Component Matrix:
| FNC-STN | Fence Stain/Seal | FNC | GTG | Production rate × LF × height × material |
| FNC-WSH | Fence Wash | FNC | — | Production rate × LF × material |
| DK-STN | Deck Stain/Seal | DKP | DKR | Production rate × area + railing LF |

---

## PATCH 6: Update Change Log

ADD to Change Log:

| 2026-03-07 | Patch: Added GAR_WIN class to SYS-04 per SDR-002 v1.8 garage separation rule. | All downstream systems depend on this class existing in D2. |
| 2026-03-07 | Patch: Added service-specific garage treatment matrix (SDR-002). | D10 reads this matrix to determine garage component inclusion per service type. |
| 2026-03-07 | Patch: Added partial scope fields (scope_type, scope_exclusions, customer_scope_ext/int) to dossier template. | Booking hub writes these; V7 calibration and sequencer read them. |
| 2026-03-07 | Patch: Corrected WCI cost loading to DELTA above base rate. $36/hr loaded already includes base WCI. $55/hr blended already includes typical wash WCI delta. | Prevents double-counting WCI in pricing math. |
| 2026-03-07 | Patch: Fence staining (FNC-STN) and deck staining (DK-STN) reclassified as Gleam services, not partner referrals. | Revenue recaptured from partner channel to Gleam service line. |
