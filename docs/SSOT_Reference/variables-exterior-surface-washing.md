# Exterior Surface Washing: Variable Time/Risk Modifiers

This document outlines the risk multipliers, added time, and cost logic strictly for exterior surface washing services (House Wash, Roof Wash, Deck/Fence Wash, Driveway/Patios, Pavers). Optimized for LLM ingestion context.

## Execution Time

### Unit Contamination
- **Variable:** `Light`
  - **Applies To:** Roof Wash
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Light debris needs no extra time; baseline for soft washing (Light Roof Cleaning).
- **Variable:** `Moderate`
  - **Applies To:** Roof Wash
  - **Impact:** +1.0 mins | $0.10 cost
  - **Rationalization:** Light moss requires brief dwell; cost for solution (Moderate Roof Cleaning).
- **Variable:** `Heavy`
  - **Applies To:** Roof Wash
  - **Impact:** +4.0 mins | $0.25 cost
  - **Rationalization:** Thick algae needs extended dwell and scrubbing; cost for more solution (Heavy Roof Cleaning).
- **Variable:** `Light`
  - **Applies To:** Pavers, Driveway/Sidewalk/Patios Seal, Driveway/Sidewalk/Patios, Fence Wash
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Light dirt needs no extra effort; baseline for pressure washing (Light Pressure Washing).
- **Variable:** `Moderate`
  - **Applies To:** Pavers, Driveway/Sidewalk/Patios Seal, Driveway/Sidewalk/Patios, Fence Wash
  - **Impact:** +2.0 mins | $0.15 cost
  - **Rationalization:** Moderate stains need pre-treatment and passes; cost for detergent (Moderate Pressure Washing).
- **Variable:** `Heavy`
  - **Applies To:** Pavers, Driveway/Sidewalk/Patios Seal, Driveway/Sidewalk/Patios, Fence Wash
  - **Impact:** +5.0 mins | $0.30 cost
  - **Rationalization:** Oil/thick debris needs degreaser and multiple passes; cost for chemicals (Heavy Pressure Washing).

### Unit Material
- **Variable:** `Durable (Vinyl, Metal)`
  - **Applies To:** Roof Wash
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Durable materials need no extra care; baseline for soft washing (Durable Roof Cleaning).
- **Variable:** `Less Durable (Asphalt Shingles)`
  - **Applies To:** Roof Wash
  - **Impact:** +1.0 mins | $0.05 cost
  - **Rationalization:** Gentler soft washing adds slight time; cost for minimal solution (Shingle Cleaning).
- **Variable:** `Porous (Wood)`
  - **Applies To:** Roof Wash
  - **Impact:** +1.5 mins | $0.10 cost
  - **Rationalization:** Porous wood needs moderate dwell; cost for absorbed solution (rare case) (Porous Roof Cleaning).
- **Variable:** `Durable (Vinyl, Metal)`
  - **Applies To:** House Wash
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Durable siding needs no extra care; baseline for soft washing (Durable Siding Cleaning).
- **Variable:** `Less Durable (Older Siding)`
  - **Applies To:** House Wash
  - **Impact:** +1.0 mins | $0.05 cost
  - **Rationalization:** Gentler methods add slight time; cost for minimal solution (Older Siding Cleaning).
- **Variable:** `Porous (Stucco)`
  - **Applies To:** House Wash
  - **Impact:** +2.0 mins | $0.20 cost
  - **Rationalization:** Porous stucco needs longer dwell and more solution; cost for absorption (Stucco Cleaning).
- **Variable:** `Durable (Vinyl, Metal)`
  - **Applies To:** Fence Wash
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Durable fences need no extra care; baseline for pressure washing (Durable Fence Cleaning).
- **Variable:** `Wood`
  - **Applies To:** Fence Wash
  - **Impact:** +1.5 mins | $0.10 cost
  - **Rationalization:** Wood requires care and cleaner; cost for solution (Wood Fence Cleaning).
- **Variable:** `Durable (Concrete)`
  - **Applies To:** Driveway/Sidewalk/Patios, Driveway/Sidewalk/Patios Seal
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Durable concrete needs no extra care; baseline for pressure washing (Concrete Cleaning).
- **Variable:** `Wood`
  - **Applies To:** Driveway/Sidewalk/Patios, Driveway/Sidewalk/Patios Seal
  - **Impact:** +1.5 mins | $0.10 cost
  - **Rationalization:** Wood decks need care and cleaner; cost for solution (Wood Deck Cleaning).

## Optional: Execution Time

### Equipment Efficiency
- **Variable:** `Surface Cleaner`
  - **Applies To:** Pavers, Driveway/Sidewalk/Patios, Driveway/Sidewalk/Patios Seal
  - **Impact:** +-2.0 mins | -$0.10 cost
  - **Rationalization:** Surface cleaner speeds up large areas; savings from water/solution (Surface Cleaner Use).

## Safety/Set-up

### Unit Accessibility
- **Variable:** `Non-obstructed`
  - **Applies To:** Deck Wash, Roof Wash, House Wash, Fence Wash, Driveway/Sidewalk/Patios, Pavers, Driveway/Sidewalk/Patios Seal
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Direct access requires no additional effort; baseline for all exterior tasks (General Accessibility).
- **Variable:** `Obstructed`
  - **Applies To:** Pavers, Driveway/Sidewalk/Patios Seal, Driveway/Sidewalk/Patios, Fence Wash, House Wash
  - **Impact:** +2.0 mins | $0.05 cost
  - **Rationalization:** Hose drag over landscaping adds time; cost for extra water/solution (Pressure Washing Obstacles).
- **Variable:** `Obstructed`
  - **Applies To:** Roof Wash
  - **Impact:** +1.0 mins | $0.02 cost
  - **Rationalization:** Minor obstacles to roof access slow setup; cost for gear wear (Roof Washing Accessibility).
- **Variable:** `Inaccessible`
  - **Applies To:** Roof Wash
  - **Impact:** +5.0 mins | $0.15 cost
  - **Rationalization:** Harnesses or lifts for steep/inaccessible roofs add time; cost for safety gear (Roof Safety).

### Unit Height
- **Variable:** `1 Story`
  - **Applies To:** Roof Wash
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Flat or ground-level roof access requires no extra setup; baseline for soft washing (How to Soft Wash a Roof).
- **Variable:** `2 Stories`
  - **Applies To:** Roof Wash
  - **Impact:** +2.0 mins | $0.02 cost
  - **Rationalization:** Ladder climb to roof adds time; cost for minimal gear wear (Roof Access Safety).
- **Variable:** `3 Stories`
  - **Applies To:** Roof Wash
  - **Impact:** +3.0 mins | $0.05 cost
  - **Rationalization:** Higher ladder or initial harness setup increases time; cost for safety gear (High Roof Washing).
- **Variable:** `4+ Stories`
  - **Applies To:** Roof Wash
  - **Impact:** +6.0 mins | $0.15 cost
  - **Rationalization:** Harnesses or lifts for steep commercial roofs add significant time; cost for equipment and safety (Commercial Roof Cleaning).

### Unit Navigability
- **Variable:** `Flat (0/12–2/12)`
  - **Applies To:** Roof Wash
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Flat roofs require no extra setup; baseline for soft washing (Flat Roof Cleaning).
- **Variable:** `Low Slope (3/12–5/12)`
  - **Applies To:** Roof Wash
  - **Impact:** +0.5 mins | $0.02 cost
  - **Rationalization:** Slight slope adds minimal caution time; cost for gear wear (Low Slope Roof).
- **Variable:** `Moderate (6/12–8/12)`
  - **Applies To:** Roof Wash
  - **Impact:** +1.5 mins | $0.05 cost
  - **Rationalization:** Safety gear setup increases time; cost for harnesses (Moderate Roof).
- **Variable:** `Steep (9/12+)`
  - **Applies To:** Roof Wash
  - **Impact:** +3.0 mins | $0.10 cost
  - **Rationalization:** Harnesses and runoff management add time; cost for safety and solution (Steep Roof Cleaning).

