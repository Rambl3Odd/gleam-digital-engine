require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Regional Routing Logic (The Architectural Cheat Sheet)
function getArchitecturalProfile(zipCode) {
    if (zipCode === "80108") {
        return "Luxury/Custom homes (Castle Pines). High likelihood of walkout basements, extensive rear picture windows, and complex glass architecture. Do not underestimate panes.";
    }
    const set1ZipCodes = ["80109", "80104", "80131", "80134", "80124", "80130", "80126"];
    if (set1ZipCodes.includes(zipCode)) {
        return "Colorado Front Range tract/custom. Often features finished basements (which add square footage but minimal windows) and standard egress layouts. Post-2015 builds feature large rear sliders/picture windows.";
    }
    return "Standard US residential architecture. Assume average glass-to-floor-space ratios.";
}

async function analyzePropertyWithAI(address, agsf, bgsf, totalBeds, basementBeds, yearBuilt, stories) {
    const mapsApiKey = process.env.GOOGLE_MAPS_HTTP_KEY.trim();
    
    if (!mapsApiKey || !process.env.GEMINI_API_KEY) {
        console.error("Missing API keys in .env file.");
        return;
    }

    // Extract ZIP for routing
    const zipMatch = address.match(/\b\d{5}\b/);
    const zipCode = zipMatch ? zipMatch[0] : "00000";
    const zipProfile = getArchitecturalProfile(zipCode);

    const encodedAddress = encodeURIComponent(address);
    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&source=outdoor&key=${mapsApiKey}`;

    console.log(`\n=================================================`);
    console.log(`🏠 ANALYZING: ${address}`);
    console.log(`📊 DATA: ${agsf} AGSF | ${bgsf} BGSF | ${totalBeds} Beds | Built ${yearBuilt}`);
    console.log(`=================================================\n`);
    console.log(`1. Fetching Street View image...`);

    try {
        const imageResp = await fetch(imageUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
            }
        });
        
        if (!imageResp.ok) throw new Error(`Google Maps Error: ${imageResp.status}`);

        const arrayBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        const imagePart = {
            inlineData: { data: base64Image, mimeType: "image/jpeg" },
        };

        console.log(`2. Image secured. Engaging Gemini 2.5 Flash with Actuarial Matrix...`);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert window cleaning estimator and architectural data scientist.
        Analyze the attached Google Street View image of this property.

        PROPERTY DATA (From Tax Records):
        - Above-Grade Square Footage (AGSF): ${agsf} sq ft
        - Below-Grade Square Footage (Basement): ${bgsf} sq ft
        - Total Bedrooms: ${totalBeds} (Assume ${basementBeds} are in the basement)
        - Year Built: ${yearBuilt}
        - Stories (Above Grade): ${stories}
        - ZIP Code Architectural Profile: ${zipProfile}

        INSTRUCTIONS & CHAIN OF THOUGHT:
        Step 1 (Verification): Is this a clear image of a residential house?
        Step 2 (Garage Isolation): Visually count the window panes located specifically on the garage doors or the immediate front garage wall. Keep these separate.
        Step 3 (Above-Grade Fenestration): Estimate the Above-Grade panes. Do NOT use the basement square footage for this. 
           - Base formula logic: (AGSF / 100) * 1.15. 
           - Adjust based on the Year Built (2017 builds have large rear glass/sliders).
        Step 4 (Below-Grade / Egress): Estimate basement panes. 
           - Assign 1 egress pane per basement bedroom.
           - Add roughly 1 standard/hopper pane for every 500 sq ft of remaining basement space.
        Step 5 (Distribution): Distribute the Above-Grade panes across the ${stories} stories (e.g., 55% Level 1, 45% Level 2).

        Return ONLY a valid JSON object matching this exact schema:
        {
            "image_quality": "<string describing visibility>",
            "architectural_notes": "<brief notes on style and layout based on data>",
            "garage_panes": <integer>,
            "level_1_panes": <integer>,
            "level_2_panes": <integer>,
            "large_picture_or_slider_panes": <integer>,
            "basement_egress_panes": <integer>,
            "estimated_total_panes": <integer>
        }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        
        console.log("\n--- AI Estimation Results ---");
        const cleanText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log(cleanText);

    } catch (error) {
        console.error("\n❌ ANALYSIS FAILED:", error.message);
    }
}

// THE TEST: Your House (2154 Treetop Dr)
// Passing: Address, AGSF, BGSF, Total Beds, Basement Beds, Year Built, Stories
analyzePropertyWithAI("2154 Treetop Dr, Castle Rock, CO 80109", 3400, 1700, 5, 2, 2017, 2);