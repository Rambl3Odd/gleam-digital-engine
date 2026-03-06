require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * 1. REGIONAL DNA LOOKUP
 * Density coefficient (rho) and Style modifier (phi)
 */
const regionalDNA = {
    "80108": { rho: 1.15, phi: 1.60, description: "Luxury Custom / High Glass Density" },
    "80109": { rho: 1.15, phi: 1.45, description: "Modern Tract/Custom / High Egress Probability" },
    "80206": { rho: 1.25, phi: 1.40, description: "Historic Core / French Grid Dominance" },
    "99352": { rho: 0.95, phi: 1.25, description: "PNW Contemporary / Rambler Styles" }
};

/**
 * 2. DETERMINISTIC ACTUARIAL CALCULATOR
 * Establishes ground-truth baseline before AI visual audit
 */
function calculateBaselines(agsf, bgsf, basementBeds, yearBuilt, zipCode) {
    const dna = regionalDNA[zipCode] || { rho: 1.10, phi: 1.15, description: "Standard Residential" };
    
    // Hyper-Scale Guardrail: Logarithmic Decay for homes > 4,500 sq ft
    let baseHousePanes;
    if (agsf > 4500) {
        baseHousePanes = 55 + (Math.log10(agsf - 4400) * 15);
    } else {
        baseHousePanes = (agsf / 100) * dna.rho * dna.phi;
    }

    // Grid/Non-Standard Logic: Pre-1980 Historic + 1.40x French Grid multiplier
    let isPre1980 = yearBuilt < 1980;
    if (isPre1980) {
        baseHousePanes = baseHousePanes * 1.40;
    }

    // IRC Basement Logic (Proxy rule)
    // 2 panes per bed + 1 window (2 panes) per 600 sq ft of remaining BGSF
    const basementPanes = (basementBeds * 2) + Math.round(((bgsf - (basementBeds * 250)) / 600) * 2);

    // Skylight Probability
    const estSkylights = (agsf > 3500 || dna.description.includes("PNW")) ? 2 : 0;

    return {
        houseTotal: Math.round(baseHousePanes),
        basementPanes,
        garageTarget: 12, // Expected standard glass panels on a modern double garage door
        estSkylights,
        isPre1980,
        dnaDescription: dna.description
    };
}

async function analyzePropertyWithAI(address, agsf, bgsf, totalBeds, basementBeds, yearBuilt, stories) {
    const mapsApiKey = process.env.GOOGLE_MAPS_HTTP_KEY.trim();
    const encodedAddress = encodeURIComponent(address);
    const zipCode = address.match(/\b\d{5}\b/)?.[0] || "80109"; // Defaulting to Castle Rock if parsing fails
    const baseline = calculateBaselines(agsf, bgsf, basementBeds, yearBuilt, zipCode);

    // 3. TRIPLE-ANGLE STREET VIEW FETCH
    const urls = [
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=100&key=${mapsApiKey}`,
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=-40&key=${mapsApiKey}`,
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=40&key=${mapsApiKey}`
    ];

    try {
        const responses = await Promise.all(urls.map(url => fetch(url)));
        const buffers = await Promise.all(responses.map(res => res.arrayBuffer()));
        const imageParts = buffers.map(buf => ({
            inlineData: { data: Buffer.from(buf).toString('base64'), mimeType: "image/jpeg" }
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 4. THE PROMPT: HYBRID RECONCILIATION
        const prompt = `
        You are the Gleam Services Lead Auditor. Audit the 3 images against our Actuarial Baselines to output a highly granular window count.
        
        PROPERTY CONTEXT:
        - DNA Profile: ${baseline.dnaDescription} | Year Built: ${yearBuilt}
        - Math Baseline: ~${baseline.houseTotal} House Panes | ~${baseline.basementPanes} Basement Panes
        - Target Skylights: ${baseline.estSkylights} | Target Garage Panes: ${baseline.garageTarget}
        - Era Modifiers: ${baseline.isPre1980 ? "Pre-1980 construction detected. Heavily bias toward 'non_standard' divided lights/French grids." : "Modern construction."}

        AUDIT INSTRUCTIONS:
        1. LEVEL BREAKDOWN: Distribute the ${baseline.houseTotal} house panes to Level 1, Level 2, and Level 3 (if applicable based on ${stories} stories).
        2. TYPE BREAKDOWN: Within each level, separate 'standard' panes, 'non_standard' (grids/divided lights), 'slider_units' (doors), and 'picture_units' (large fixed glass).
        3. ROOF: Look for Skylights, expecting ~${baseline.estSkylights}.
        4. GARAGE: Check for decorative fixed panes on the garage door itself. Reconcile against target (${baseline.garageTarget}). Garage wall windows belong in Level 1.
        5. SIDELIGHT GUARDRAIL: Identify thin entry sidelights or transoms. Do not count them as sliding or picture units.

        RETURN EXCLUSIVELY AS JSON (no markdown formatting):
        {
          "reconciled_garage": <int>,
          "skylights": <int>,
          "has_storm_door": <boolean>,
          "levels": {
            "L1": { "standard": <int>, "non_standard": <int>, "slider_units": <int>, "picture_units": <int> },
            "L2": { "standard": <int>, "non_standard": <int>, "slider_units": <int>, "picture_units": <int> },
            "L3": { "standard": <int>, "non_standard": <int>, "picture_units": <int> }
          },
          "basement": { "egress_units": <int>, "standard_units": <int> }
        }
        `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const cleanJsonString = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJsonString);

        // 5. COMPONENT-BASED SCREEN MATH
        // Rule: (Standard Units - 2) + (1 per Slider) + (1 per Egress) + (1 for Storm Door)
        const l1StdUnits = Math.floor((data.levels.L1.standard + data.levels.L1.non_standard) / 2);
        const l2StdUnits = Math.floor((data.levels.L2.standard + data.levels.L2.non_standard) / 2);
        const l3StdUnits = Math.floor((data.levels.L3.standard + data.levels.L3.non_standard) / 2);
        
        let totalStdUnits = l1StdUnits + l2StdUnits + l3StdUnits;
        totalStdUnits = Math.max(0, totalStdUnits - 2); // Subtract 2 for "Bathroom Exceptions"

        const totalSliderUnits = data.levels.L1.slider_units + data.levels.L2.slider_units;
        const totalEgressUnits = data.basement.egress_units;
        
        const finalScreens = totalStdUnits + totalSliderUnits + totalEgressUnits + (data.has_storm_door ? 1 : 0);

        // 6. MULTI-LEVEL LINE-ITEM BREAKDOWN (ServiceM8 Ready)
        console.log("\n=======================================================");
        console.log(` 🏠 GLEAM MASTER ESTIMATE REPORT`);
        console.log(`    Address: ${address}`);
        console.log(`    DNA Profile: ${baseline.dnaDescription}`);
        console.log("=======================================================");
        
        console.log(`\n--- LEVELS ---`);
        console.log(`[LEVEL 1]  Std Panes: ${data.levels.L1.standard} | Non-Std: ${data.levels.L1.non_standard} | Sliders: ${data.levels.L1.slider_units} | Picture: ${data.levels.L1.picture_units}`);
        console.log(`[LEVEL 2]  Std Panes: ${data.levels.L2.standard} | Non-Std: ${data.levels.L2.non_standard} | Sliders: ${data.levels.L2.slider_units} | Picture: ${data.levels.L2.picture_units}`);
        if (stories > 2) {
            console.log(`[LEVEL 3]  Std Panes: ${data.levels.L3.standard} | Non-Std: ${data.levels.L3.non_standard} | Picture: ${data.levels.L3.picture_units}`);
        }
        
        console.log(`\n--- BASEMENT & ROOF ---`);
        console.log(`[BASEMENT] Egress Units: ${data.basement.egress_units} | Std Panes: ${data.basement.standard_units}`);
        console.log(`[ROOF]     Skylights: ${data.skylights}`);
        
        console.log(`\n--- MATERIALS & ADD-ONS ---`);
        console.log(`[ADD-ON]   Garage Door Panes (Fixed): ${data.reconciled_garage}`);
        console.log(`[HARDWARE] Screens/Tracks Needed: ${finalScreens} (Calculated via unit attribution)`);
        console.log("=======================================================\n");

    } catch (error) {
        console.error("❌ AUDIT FAILED:", error.message);
    }
}

// EXECUTION TEST (Using your House Math target)
// Castle Rock 80109 | 3400 AGSF | 1700 BGSF | 5 Total Beds | 2 Bsmt Beds | Built 2017 | 2 Stories
analyzePropertyWithAI("2154 Treetop Dr, Castle Rock, CO 80109", 3400, 1700, 5, 2, 2017, 2);