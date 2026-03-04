# Gleam 3.0: Pricing Engine Math & Logic Architecture

**Document Type:** Architecture & Actuarial Reference  
**Core Philosophy:** All pricing is derived from real-world time and physical costs. We utilize a strict "Cost-Plus" model targeting a 30% gross margin. There is zero arbitrary "flat-rate" pricing (except for specific override SKUs like Skylights).

---

## 🛑 Rule 1: The "Dumb UI" Mandate
The frontend (HTML/JS) **never** calculates prices. The frontend only collects quantities (e.g., 20 panes) and states (e.g., 2-story, heavy soil). All formulas below are executed exclusively in the Layer 3 (Make.com) backend to prevent margin leakage and UI spoofing.

---

## ⏱️ Phase 1: Unit Base Time & Base Cost (The Foundation)
To effectively schedule and allocate labor cost, we isolate the baseline metrics for a single service unit (e.g., a standard window pane or 1 sq. ft. of patio) *before* any modifiers are applied.

### 1. Unit Base Time ($t_{base}$)
Derived through observed "stopwatch" time plus a transition buffer to account for moving between units and setting up.
* **Discrete Units (Panes, Screens):** Base Time + 40% Transition Buffer.
* **Area Units (Sq. Ft.):** Base Time + 10% Transition Buffer.
* **Formula:** $t_{base} = t_{service} + t_{transition}$

### 2. Unit Base Cost ($C_{base\_burdened}$)
The financial burden of the baseline unit, capturing direct costs and quarantine-applying the 15% indirect overhead.
* **Base Labor ($C_{labor}$):** $t_{base} \times \$0.60/\text{min}$ (Max Burden Level 3).
* **Base Consumables/Materials ($C_{mat}$):** Baseline physical cost per unit.
* **Base WCI ($C_{wci}$):** Baseline workers comp allocation (e.g., Class 9014).
* **Base Liability ($C_{liab}$):** Baseline property damage risk.
* **Overhead Multiplier:** A strict 1.15 factor applied *only* to the baseline to cover non-billable time, software, and CAC.
* **Formula:** $$C_{base\_burdened} = (C_{labor} + C_{mat} + C_{wci} + C_{liab}) \times 1.15$$

---

## 🧮 Phase 2: Unit Sets & VTM Compounding (Time & Cost)
"Environmental conditions and architectural geometry are rarely uniform across a single asset. To maintain absolute mathematical integrity, Variable Time/Risk Modifiers (VTMs) are executed strictly against discrete Unit Sets and their nested Sub-Sets—isolated groups of units sharing identical physical exposures (e.g., 'Set A: 1st-story standard panes' vs. 'Set B: basement-level egress panes').While global VTMs (such as Unit Soiling) apply universally across an entire exterior set, the underlying execution time is dictated by the nested sub-sets, such as Standard Panes (36"x60") versus Large Format/Slider Panes (37"x82"). Because a large pane occupies a single contiguous space, it requires roughly double the raw physical cleaning time ($t_{service}$) but incurs zero additional logistical transition time ($t_{transition}$). Therefore, large panes on elevated stories incur purely additive time penalties rather than compounding multipliers.To prevent algorithmic overbidding, the engine deploys spatial heuristics for structural outliers:The Deck-Access Heuristic: Second-story slider doors inherently open onto elevated decks or balconies. The algorithm overrides their elevation multiplier, evaluating them strictly as ground-level (HL1) access.Roof & Ground Anchors: Skylights are rigidly mapped to specialized roof-access parameters (FA5), whereas garage fenestration is permanently anchored to ground-level deployment.Garage Quarantine: Garage windows are programmatically quarantined from the primary above-grade pane count. They artificially inflate the unit density matrix without yielding proportional aesthetic value to the homeowner, and their distinct manufacturing makes pristine restoration highly inefficient.Restoration Reclassification: Hard water mineralization is categorically stripped from standard soiling VTMs and reclassified as discrete 'Glass Restoration' (e.g., SKU: GLS-HWR). This acknowledges the chemical reality that silicate deposits physically bind to the glass substrate over time, requiring specialized mitigation rather than standard cleaning.By isolating these heuristics, the mathematical engine flawlessly calculates the precise, experienced impact of VTMs on both temporal flow and financial cost for every unique structural sub-set."

### 1. Unit Adjusted Time ($t_{adj}$)
Time compounds through both multiplicative factors (which scale total effort, like ladder positioning) and additive factors (which require discrete additional tasks, like scraping paint).

$$t_{adj} = (t_{base} \times \prod M_i) + \sum A_j$$

**Variables:**
* $t_{adj}$: Final execution minutes per unit in this specific set.
* $M_i$: Multiplicative VTMs (e.g., Height Level 2 = 1.25x).
* $A_j$: Additive VTMs (e.g., Heavy Soil = +2.5 mins).

### 2. Unit Adjusted Cost ($C_{adj}$)
Because VTMs alter the physical scope of work, they inherently alter the cost. The engine captures the cost of the *expanded labor time* while injecting the *discrete risk/material premiums* triggered by the VTMs (e.g., liability jump for indoor ladder use, or chemical costs for heavy soil). 
*CRITICAL:* Overhead (1.15) is **never** applied to these VTM additions.

$$C_{adj} = C_{base\_burdened} + \Delta Labor + \sum C_{vtm\_premiums}$$

**Variables:**
* $\Delta Labor$: The exact cost of the expanded time. $\Delta Labor = (t_{adj} - t_{base}) \times \$0.60$
* $C_{vtm\_premiums}$: The sum of all discrete financial premiums triggered by the set's VTMs (e.g., $\Delta WCI$, $\Delta Liability$, $\Delta Consumables$).

---

## 📊 Phase 3: Aggregation & Retail Price Calculation
Once the hyper-accurate Adjusted Time and Adjusted Cost are known for each Unit Set, the engine aggregates them across the entire property and applies the target margin.

### 1. Total Employment Time ($T_{emp}$)
Aggregated to determine the exact physical labor time required for scheduling.
$$T_{emp} = \sum_{k=1}^{N} (q_k \times t_{adj, k})$$
*(Where $N$ is the total number of distinct Unit Sets, and $q_k$ is the quantity of units in Set $k$.)*

### 2. Total Job Cost & Target Margin
Gleam targets a strict **30% Margin Minimum** on the employment phase of the job. To achieve a 30% margin, the aggregated cost is divided by its reciprocal (0.70).
* **Total Employment Cost:** $C_{total} = \sum_{k=1}^{N} (q_k \times C_{adj, k})$
* **Service Subtotal (Retail Price):** $Price_{subtotal} = C_{total} / 0.70$

*(Note: Make.com rounds the final retail price to 2 decimal places).*

---

## 🧾 Phase 4: Job Totals & Fixed Fees
With the exact physical scope priced, the final fixed logistics are appended.

### 1. The Setup Fee (Logistics & Mobilization)
A fixed **$60.00 Setup Fee** is applied to the quote. 
* This covers the "Fixed Phases" of a job: Drive time, van loading, and demobilization. 
* **Waiver Rule:** This fee is ONLY waived if a "Bright Block" triggers (e.g., a neighbor books for the exact same day/time, completely nullifying the drive-time cost). It is never waived for simply crossing a dollar threshold.

### 2. Final Quote Calculation
$$Price_{final} = (Price_{subtotal} \times (1 - \text{Discount} \%)) + \text{Setup Fee}$$

---

## 📅 Phase 5: Scheduling & The Crew Efficiency Factor (CEF)

A critical mandate of the Gleam Pricing Engine is the absolute separation of **Pricing (Money)** from **Scheduling (Calendar Time)**. 

All Base Times, Adjusted Times ($t_{adj}$), and Employment Times ($T_{emp}$) calculated in Phases 1 through 3 are strictly **single-technician baseline numbers**. However, operational realities often dictate dispatching a multi-person crew. To map the single-tech time to the ServiceM8 calendar, the backend utilizes the **Crew Efficiency Factor (CEF)**.



### 1. The Core Rule of CEF
**CEF is for scheduling only. It NEVER alters the price.** The customer pays for the *value of the work* based on the single-tech actuarial math. Whether a single technician completes the job in 4 hours, or a two-technician crew completes it in 2 hours and 24 minutes, the quote remains identical. This ensures transparent, predictable pricing for the customer and protects your margin against field dispatch variables.

### 2. The CEF Math & Calendar Block
When multiple technicians are deployed, the total calendar time is reduced, but it does not scale perfectly linearly (e.g., 2 techs do not complete the job in exactly 50% of the time due to overlap in setup, communication, and logistical bottlenecks). 

To calculate the actual calendar block required in ServiceM8, the engine applies the CEF multiplier to the Total Employment Time ($T_{emp}$).

$$T_{calendar} = T_{emp} \times CEF$$

**Standard CEF Multipliers:**
* **1-Tech Crew:** $CEF = 1.00$ (No reduction; 100% of single-tech time).
* **2-Tech Crew:** $CEF = 0.60$ (A ~40% time reduction on-site).

### 3. Practical Application Example
Assume the pricing engine calculates a Total Employment Time ($T_{emp}$) of **120 minutes** for an exterior window cleaning job. 
* The customer's quote is generated based on the cost of 120 minutes of labor.
* The dispatcher assigns a **2-Tech Crew** to the job.

**Calendar Block Calculation:**
$$120 \text{ minutes} \times 0.60 \text{ (CEF)} = 72 \text{ minutes}$$

**The Result:** Make.com will send a payload to ServiceM8 reserving a **72-minute block** on the calendar. The customer is billed for the exact same 120-minute actuarial output, preserving your 30% target margin while optimizing the day's routing.

---

## ⚠️ The "Golden Rules" of the Pricing Engine

1. **VTMs Do NOT Re-Apply Overhead:** The 15% overhead is applied strictly at the base cost level. VTM cost additions (whether labor scaling or risk premiums) are incremental marginal costs. Applying overhead to VTMs double-counts admin allocation and artificially inflates complex quotes.
2. **CEF Is Scheduling Only — Never Pricing:** The Crew Efficiency Factor (e.g., dispatching 2 techs instead of 1) reduces calendar block time by ~40%. It **never** alters the price. The customer pays the exact same amount whether 1 tech does it in 4 hours or 2 techs do it in 2 hours.
3. **The "Escape Hatch" Protocol:** If a VTM triggers an `ESCAPE` value (e.g., 4+ Stories, Hazmat Soiling, 9/12 Roof Pitch), the math engine halts for that line item and returns `null`. The UI will replace the price with a "Custom Quote Required" state, preventing the system from automatically binding un-insurable or high-risk work.