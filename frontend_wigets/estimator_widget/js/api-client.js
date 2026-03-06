/**
 * api-client.js
 * Layer 1 (Presentation Edge) Network Controller
 * * Handles all network communication between the Estimator UI and Make.com (Layer 2).
 * Enforces DevSecOps constraints: POST only, custom headers, reCAPTCHA validation, and timeout fallbacks.
 */

const CONFIG = {
    // TODO: Replace with your actual Make.com Custom Webhook URL for the Estimator Intake (M1.1)
    MAKE_WEBHOOK_URL: 'https://hook.us1.make.com/YOUR_WEBHOOK_ID_HERE',
    
    // TODO: Replace with your Google reCAPTCHA v3 Public Site Key
    RECAPTCHA_SITE_KEY: 'YOUR_RECAPTCHA_PUBLIC_KEY_HERE',
    
    // Custom header mandated by Section 8 DevSecOps to reject unauthorized direct POST requests
    CLIENT_AUTH_TOKEN: 'gleam-front-end-v3-token',
    
    // 15-second timeout (Make.com scenarios can occasionally suffer from "cold start" latency)
    TIMEOUT_MS: 15000 
};

/**
 * Generates a Google reCAPTCHA v3 token silently in the background.
 * @returns {Promise<string>} The generated token or a fallback for local dev.
 */
async function getRecaptchaToken() {
    return new Promise((resolve, reject) => {
        // Graceful degradation if reCAPTCHA fails to load (e.g., ad blockers)
        if (typeof grecaptcha === 'undefined') {
            console.warn('reCAPTCHA not loaded. Proceeding without token (Make.com may reject).');
            return resolve('bypass-token-for-dev'); 
        }

        grecaptcha.ready(() => {
            grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, { action: 'submit_estimate' })
                .then(token => resolve(token))
                .catch(err => reject(err));
        });
    });
}

/**
 * Packages the user's state and securely transmits it to the Make.com routing engine.
 * @param {Object} appState - The unpriced, raw data captured from the UI.
 * @returns {Promise<Object>} The response from Make.com (contains UUID Magic Link).
 */
export async function submitEstimatePayload(appState) {
    // 1. Generate security token
    const recaptchaToken = await getRecaptchaToken();

    // 2. Hydrate payload with Omnichannel Marketing parameters (UTMs/DNI) saved in the browser
    const utmData = JSON.parse(sessionStorage.getItem('gleam_utm_data')) || {};

    // 3. Assemble the final JSON Data Contract (Strictly adhering to Section 3 schemas)
    const finalPayload = {
        security: {
            recaptcha_token: recaptchaToken
        },
        customer: appState.customer,
        property_core: appState.property,
        requested_services: appState.services,
        user_observations: appState.observations,
        meta: {
            ...utmData,
            submitted_at: new Date().toISOString(),
            source: 'estimator_widget_v3'
        }
    };

    // 4. Set up an AbortController to prevent the UI from hanging forever if Make.com stalls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    try {
        // 5. Execute the secure POST Request to Layer 2 API Gateway
        const response = await fetch(CONFIG.MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-gleam-auth': CONFIG.CLIENT_AUTH_TOKEN // The Bouncer: Rejects unauthorized requests
            },
            body: JSON.stringify(finalPayload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // 6. Handle HTTP Errors (e.g., 400 Bad Request, 429 Rate Limit)
        if (!response.ok) {
            throw new Error(`Make.com API rejected the payload. HTTP Status: ${response.status}`);
        }

        // 7. Parse and return the Genius Backend's response (Pricing, Route, UUID)
        const data = await response.json();
        return data;

    } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle specific timeout errors for better UX
        if (error.name === 'AbortError') {
            console.error('[DevSecOps] API Request timed out. Make.com took longer than 15s.');
            throw new Error('Our servers are taking a little longer than usual. Please try again.');
        }
        
        console.error('[DevSecOps] API Handshake Failed:', error);
        throw error;
    }
}