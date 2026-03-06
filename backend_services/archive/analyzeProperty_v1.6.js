require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function calculateParametricBaseline(agsf, bgsf, basementBeds, yearBuilt) {
    // 1. Total House Pane Baseline
    const rho = 1.15; 
    const phi = (yearBuilt >= 2015) ? 1.45 : 1.15; 
    const houseTotal = Math.round((agsf / 100) * rho * phi);

    // 2. MATRIX GUARDRAILS: Hard limits for specific categories
    // Even in large homes, large picture glass and sliders follow a predictable architectural count.
    const guardrails = {
        large_glass_max: (agsf > 4000) ? 15 : 10,
        basement_base: (basementBeds * 2) + Math.round(((bgsf - (basementBeds * 250)) / 600) * 2)
    };

    return { houseTotal, guardrails };
}

async function analyzePropertyWithAI(address, agsf, bgsf, totalBeds, basementBeds, yearBuilt, stories) {
    const mapsApiKey = process.env.GOOGLE_MAPS_HTTP_KEY.trim();
    const encodedAddress = encodeURIComponent(address);
    const baseline = calculateParametricBaseline(agsf, bgsf, basementBeds, yearBuilt);

    const urls = [
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=100&key=${mapsApiKey}`,
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=-35&key=${mapsApiKey}`,
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=35&key=${mapsApiKey}`
    ];

    console.log(`\n=================================================`);
    console.log(`🏠 GLEAM ACTUARIAL AUDIT: ${address}`);
    console.log(`=================================================\n`);

    try {
        const responses = await Promise.all(urls.map(url => fetch(url)));
        const buffers = await Promise.all(responses.map(res => res.arrayBuffer()));
        const imageParts = buffers.map(buf => ({
            inlineData: { data: Buffer.from(buf).toString('base64'), mimeType: "image/jpeg" }
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert Window Cleaning Auditor. Audit the 3 attached images.
        
        ACTUARIAL GUARDRAILS:
        - Target House Total: ~${baseline.houseTotal} panes (above grade)
        - Expected Large/Slider Panes: 4 to ${baseline.guardrails.large_glass_max} panes (DO NOT EXCEED THIS WITHOUT VISUAL PROOF)
        - Expected Basement: ~${baseline.guardrails.basement_base} panes

        AUDIT STEPS:
        1. GARAGE DOORS: Use the angled images to count EXACTLY how many panes are in the garage doors.
        2. FRONT AUDIT: Count visible 1st floor, 2nd floor, and entryway panes.
        3. ATTRIBUTION: Distribute the remaining ${baseline.houseTotal} panes to the unseen rear/sides. 
           - DEFAULT to "Standard Panes" for unseen areas.
           - Only attribute panes to "Large/Sliders" if you see architectural evidence (like a massive rear deck). 
           - A 3-panel slider is 3 panes. 1 Picture window is 1 pane.

        JSON RESPONSE:
        {
            "garage_door_panes": <int>,
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

        // PRICE CALCULATION
        const houseTotal = data.house_panes.level_1_standard + data.house_panes.level_2_standard + data.house_panes.large_picture_or_sliders + data.basement_panes;
        const o_ratio = data.glass_character === "Mostly Standard" ? 0.50 : 0.33;
        const screens = Math.round(houseTotal * o_ratio);

        console.log("--- FINAL AUDITED QUOTE ---");
        console.log(`- House Panes: ${houseTotal} (Std: ${data.house_panes.level_1_standard + data.house_panes.level_2_standard}, Large: ${data.house_panes.large_picture_or_sliders})`);
        console.log(`- Basement: ${data.basement_panes}`);
        console.log(`- Est. Screens/Tracks: ${screens}`);
        console.log(`- OPTIONAL Garage Door Panes: ${data.garage_door_panes}`);

    } catch (error) {
        console.error("❌ AUDIT FAILED:", error.message);
    }
}

analyzePropertyWithAI("2154 Treetop Dr, Castle Rock, CO 80109", 3400, 1700, 5, 2, 2017, 2);