/**
 * Gleam Central Booking Hub - API Client
 * Manages secure communications with Make.com Webhooks for availability and final booking.
 * Completely decoupled from the UI and pricing math. Vanilla JS Only.
 */

const BookingApiClient = {
    config: {
        // Make.com Webhook Endpoints
        bookingWebhookUrl: "https://hook.us2.make.com/wprk61uaaa1jvii7bsrxto5k64y36pny", 
        availabilityWebhookUrl: "https://hook.us2.make.com/m8074aeoa757vitmyqdo4v5tx2m9dmxw", 
        
        // Custom security header (Phase 8 DevSecOps requirement)
        authToken: "GleamSecure2026!" 
    },

    /**
     * Fetches dynamic route-optimized availability slots from Make.com
     * @param {string} duration - Estimated onsite time
     * @param {string|number} panes - Estimated pane count
     * @param {string} address - Full property address
     * @returns {Promise<Array>} Array of available time slots
     */
    async fetchAvailability(duration, panes, address) {
        try {
            const response = await fetch(this.config.availabilityWebhookUrl, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "x-gleam-auth": this.config.authToken 
                },
                body: JSON.stringify({
                    duration: duration,
                    panes: panes,
                    address: address 
                })
            });

            if (!response.ok) {
                throw new Error(`Availability fetch failed: ${response.status}`);
            }

            const data = await response.json();
            return data.slots || [];
        } catch (error) {
            console.error("Make.com Availability API Error:", error);
            // Return empty array so the UI can gracefully fallback to "All Days" or contact message
            return []; 
        }
    },

    /**
     * Submits the final assembled booking payload to Make.com
     * Triggers ServiceM8 Company/Contact/Job creation and retention automation
     * @param {Object} payload - The finalized JSON object from BookingStateManager
     * @returns {Promise<Object>} Success response
     */
    async submitBooking(payload) {
        try {
            const response = await fetch(this.config.bookingWebhookUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-gleam-auth': this.config.authToken 
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Booking submission failed: ${response.status}`);
            }
            
            // Returns success confirmation and potentially a Stripe Payment Link
            return await response.json(); 
        } catch (error) {
            console.error("Make.com Booking Submission Error:", error);
            throw error; // Rethrow to let the UI display a failure message/fallback
        }
    }
};

// Expose to window for UI usage
window.BookingApiClient = BookingApiClient;