require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getArchitecturalProfile(zipCode) {
    if (zipCode === "80108") return "Luxury/Custom homes. High likelihood of walkout basements, extensive rear picture windows.";
    const set1ZipCodes = ["80109", "80104", "80131", "80134", "80124", "80130", "80126"];
    if (set1ZipCodes.includes(zipCode)) return "Colorado Front Range tract/custom. Post-2015 builds feature large rear sliders/picture windows.";
    return "Standard US residential architecture.";
}

async function analyzePropertyWithAI(address, agsf, bgsf, totalBeds, basementBeds, yearBuilt, stories) {
    const mapsApiKey = process.env.GOOGLE_MAPS_HTTP_KEY.trim();
    if (!mapsApiKey || !process.env.GEMINI_API_KEY) return console.error("Missing API keys.");

    const zipMatch = address.match(/\b\d{5}\b/);
    const zipCode = zipMatch ? zipMatch[0] : "00000";
    const zipProfile = getArchitecturalProfile(zipCode);
    const encodedAddress = encodeURIComponent(address);

    // 1. Fetching Multiple Perspectives (Standard + Ultra-Wide FOV)
    const imageUrlStandard = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&source=outdoor&key=${mapsApiKey}`;
    const imageUrlWide = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=120&source=outdoor&key=${mapsApiKey}`;

    console.log(`\n=================================================`);
    console.log(`🏠 ANALYZING: ${address}`);
    console.log(`=================================================\n`);
    console.log(`1. Fetching Standard and Wide-Angle Street View perspectives...`);

    try {
        const [respStandard, respWide] = await Promise.all([
            fetch(imageUrlStandard), fetch(imageUrlWide)
        ]);

        const [bufferStandard, bufferWide] = await Promise.all([
            respStandard.arrayBuffer(), respWide.arrayBuffer()
        ]);

        const imagePartStandard = { inlineData: { data: Buffer.from(bufferStandard).toString('base64'), mimeType: "image/jpeg" } };
        const imagePartWide = { inlineData: { data: Buffer.from(bufferWide).toString('base64'), mimeType: "image/jpeg" } };

        console.log(`2. Images secured. Engaging Gemini with IRC Topography Matrix...`);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert window cleaning estimator and actuarial data scientist.
        Analyze the TWO attached Google Street View images (Standard and Wide-Angle) of this property.

        PROPERTY DATA (From Tax Records):
        - Above-Grade Square Footage (AGSF): ${agsf} sq ft
        - Below-Grade Square Footage (Basement): ${bgsf} sq ft
        - Total Bedrooms: ${totalBeds} (Assume ${basementBeds} are in the basement)
        - Year Built: ${yearBuilt}
        - Stories (Above Grade): ${stories}
        - ZIP Profile: ${zipProfile}

        INSTRUCTIONS & CHAIN OF THOUGHT:
        Step 1 (Garage Isolation): Using the Wide-Angle image, locate the garage doors. Count every single window pane on the garage doors and the front-facing garage walls. Do not miss these.
        Step 2 (Above-Grade Fenestration): Estimate the Above-Grade panes using (AGSF / 100) * 1.15. Adjust for ${yearBuilt} architectural trends (large rear glass/sliders).
        Step 3 (Below-Grade IRC Rule): Estimate basement panes using the International Residential Code (IRC) natural light rules.
           - Assign 1 egress window (2 panes) per basement bedroom.
           - Deduct mechanical/storage space from the remaining ${bgsf} sq ft.
           - Look at the topography in the photo: If the lot looks completely flat, the basement is submerged (fewer windows). If it sits on a hill, it is a walkout (more windows). 
           - Add 1 standard window (2 panes) for every 600 sq ft of remaining habitable basement space.

        Return ONLY a valid JSON object matching this schema:
        {
            "topography_assessment": "<Flat lot (submerged) OR Sloped lot (walk-out)>",
            "garage_panes": <integer>,
            "level_1_panes": <integer>,
            "level_2_panes": <integer>,
            "large_picture_or_slider_panes": <integer>,
            "basement_egress_panes": <integer>,
            "estimated_total_panes": <integer>
        }
        `;

        const result = await model.generateContent([prompt, imagePartStandard, imagePartWide]);
        
        console.log("\n--- AI Estimation Results ---");
        const cleanText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log(cleanText);

    } catch (error) {
        console.error("\n❌ ANALYSIS FAILED:", error.message);
    }
}

// THE TEST: Your House
analyzePropertyWithAI("2154 Treetop Dr, Castle Rock, CO 80109", 3400, 1700, 5, 2, 2017, 2);