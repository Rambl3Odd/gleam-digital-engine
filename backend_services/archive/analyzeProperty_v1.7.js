require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * DETERMINISTIC CALCULATOR
 * Acts as the 'Actuarial Truth' baseline based on documented Matrix data.
 */
function calculateParametricBaseline(agsf, bgsf, basementBeds, yearBuilt) {
    // Above-Grade: (SqFt / 100) * Density * Style Modifier
    const rho = 1.15; 
    const phi = (yearBuilt >= 2015) ? 1.45 : 1.15; 
    const houseTotal = Math.round((agsf / 100) * rho * phi);

    // Garage: 80109 modern builds default to 12 panes (3-car or high-tier 2-car)
    const garageBaseline = 12;

    // Basement: Bed_Proxy (2 per bed) + Habitable Remainder (2 per 600sqft)
    const basementPanes = (basementBeds * 2) + Math.round(((bgsf - (basementBeds * 250)) / 600) * 2);

    // Guardrail: Large Picture/Sliders typically range 6-12 for this footprint
    const largeGlassBaseline = (agsf > 4000) ? 12 : 6;
	
// Calculate Screens/Tracks based on Units, not Panes
const stdUnits = Math.floor((data.house_panes.level_1_standard + data.house_panes.level_2_standard) / 2);
const sliderScreens = data.house_panes.slider_units; // 1 per door
const egressScreens = Math.floor(data.basement_panes / 2); // 1 per egress window

// The "29" Calculation
const totalScreens = (stdUnits - 2) + sliderScreens + egressScreens + 1; // +1 for the Storm Door
    return { houseTotal, garageBaseline, basementPanes, largeGlassBaseline };
}

async function analyzePropertyWithAI(address, agsf, bgsf, totalBeds, basementBeds, yearBuilt, stories) {
    const mapsApiKey = process.env.GOOGLE_MAPS_HTTP_KEY.trim();
    const encodedAddress = encodeURIComponent(address);
    
    // Calculate Math Baselines
    const baseline = calculateParametricBaseline(agsf, bgsf, basementBeds, yearBuilt);

    // TRIPLE-ANGLE VISION: Center, Left (-35), Right (+35)
    const urls = [
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=100&key=${mapsApiKey}`,
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=-35&key=${mapsApiKey}`,
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=35&key=${mapsApiKey}`
    ];

    console.log(`\n=================================================`);
    console.log(`🏠 GLEAM HYBRID ESTIMATOR: ${address}`);
    console.log(`📊 MATH BASELINES: House: ~${baseline.houseTotal} | Garage: ${baseline.garageBaseline} | Basement: ${baseline.basementPanes}`);
    console.log(`=================================================\n`);

    try {
        const responses = await Promise.all(urls.map(url => fetch(url)));
        const buffers = await Promise.all(responses.map(res => res.arrayBuffer()));
        const imageParts = buffers.map(buf => ({
            inlineData: { data: Buffer.from(buf).toString('base64'), mimeType: "image/jpeg" }
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert Window Cleaning Auditor. Analyze the 3 attached images.

        ACTUARIAL DATA BASELINES:
        - Total House Panes (Above Grade): ~${baseline.houseTotal}
        - Expected Garage Door Panes: ${baseline.garageBaseline}
        - Expected Large Picture/Slider Panes: ${baseline.largeGlassBaseline}
        - Expected Basement Panes: ${baseline.basementPanes}

        AUDIT STEPS:
        1. GARAGE RECONCILIATION: Use all 3 angles to count panes physically in the garage doors. 
           - If your visual count is within 25% of ${baseline.garageBaseline}, use your count.
           - If the garage is hidden or your count is a massive mismatch, default to ${baseline.garageBaseline}.
        2. STANDARD-FIRST DISTRIBUTION: Count visible windows in the front/entryway. 
           - Subtract visible count from the ${baseline.houseTotal} math baseline.
           - Distribute the 'remainder' (unseen rear/sides) to Level 1 and Level 2 STANDARD panes.
           - DO NOT attribute more than ${baseline.largeGlassBaseline} panes to the 'Picture/Slider' category unless you see clear evidence (balconies/rear decks).
        3. TOPOGRAPHY: Confirm if 'Walk-out' or 'Submerged' to validate basement counts.

        Return JSON ONLY:
        {
            "garage_reconciliation": { "visual_count": <int>, "final_used": <int>, "reason": "string" },
            "house_panes": {
                "level_1_standard": <int>,
                "level_2_standard": <int>,
                "large_picture_or_sliders": <int>
            },
            "basement_panes": <int>,
            "glass_character": "Mostly Standard OR Large Glass"
        }
        `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const data = JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

        // FINAL CALCULATIONS
        const houseTotal = data.house_panes.level_1_standard + data.house_panes.level_2_standard + data.house_panes.large_picture_or_sliders + data.basement_panes;
        const o_ratio = data.glass_character === "Mostly Standard" ? 0.50 : 0.33;
        
        // Screens/Tracks only apply to houseTotal, NOT garage door panes
        const screens = Math.round(houseTotal * o_ratio);

        console.log("\n--- FINAL AUDITED QUOTE ---");
        console.log(`- House Panes (Inc. Basement): ${houseTotal}`);
        console.log(`- Est. Screens & Tracks: ${screens}`);
        console.log(`- OPTIONAL Garage Door Panes: ${data.garage_reconciliation.final_used}`);
        console.log("\nReconciliation Report:", data.garage_reconciliation.reason);

    } catch (error) {
        console.error("❌ AUDIT FAILED:", error.message);
    }
}

// THE GROUND TRUTH TEST: 2154 Treetop Dr
analyzePropertyWithAI("2154 Treetop Dr, Castle Rock, CO 80109", 3400, 1700, 5, 2, 2017, 2);