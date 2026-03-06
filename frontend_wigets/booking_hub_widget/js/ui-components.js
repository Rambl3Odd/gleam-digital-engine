/**
 * Gleam Central Booking Hub - UI Components
 * Dedicated purely to visual rendering and DOM manipulation.
 * Replaces legacy React implementation with high-performance Vanilla JS.
 */

const BookingUI = {
    timerInterval: null,
    
    init() {
        window.BookingStateManager.parseInboundData();
        this.startTimer();
        this.renderAll();
        
        // Fetch availability immediately if we have the onsite time
        const state = window.BookingStateManager.state;
        if (state.inbound.onsiteTime !== '--') {
            this.loadAvailability();
        }
    },

    startTimer() {
        this.timerInterval = setInterval(() => {
            const state = window.BookingStateManager.state;
            if (state.timeLeft > 0) {
                state.timeLeft -= 1;
                const clockEl = document.getElementById('gh-timer-clock');
                if (clockEl) {
                    const mins = Math.floor(state.timeLeft / 60);
                    const secs = (state.timeLeft % 60).toString().padStart(2, '0');
                    clockEl.innerText = `${mins}:${secs}`;
                }
            } else {
                clearInterval(this.timerInterval);
            }
        }, 1000);
    },

    async loadAvailability() {
        const state = window.BookingStateManager.state;
        state.schedule.isLoadingSlots = true;
        this.renderAll(); // Show loader

        if (window.BookingApiClient) {
            const slots = await window.BookingApiClient.fetchAvailability(
                state.inbound.onsiteTime, 
                state.inbound.panes, 
                state.address
            );
            state.schedule.availableSlots = slots;
        }

        state.schedule.isLoadingSlots = false;
        this.renderAll(); // Show slots
    },

    // --- MAIN RENDER CYCLE ---
    renderAll() {
        this.renderTopBar();
        this.renderProgress();
        this.renderContent();
        this.renderFooter();
        
        // Initialize Lucide Icons after DOM updates
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Initialize Google Autocomplete if on Step 3
        if (window.BookingStateManager.state.step === 3) {
            this.initAutocomplete();
        }
    },

    renderTopBar() {
        const state = window.BookingStateManager.state;
        const mins = Math.floor(state.timeLeft / 60);
        const secs = (state.timeLeft % 60).toString().padStart(2, '0');
        
        const topBarContainer = document.getElementById('gh-top-bar');
        if (!topBarContainer) return;

        topBarContainer.innerHTML = `
            <div class="gh-timer-label">
                <i data-lucide="clock" class="gh-icon-sm gh-text-white gh-opacity-70"></i> 
                Holding spot for
            </div>
            <span class="gh-timer-clock" id="gh-timer-clock">${mins}:${secs}</span>
        `;
    },

    renderProgress() {
        const state = window.BookingStateManager.state;
        const progressContainer = document.getElementById('gh-progress-area');
        if (!progressContainer) return;

        const titles = ["Review & Customize", "Choose Time Slot", "Final Details", "Complete"];
        
        progressContainer.innerHTML = `
            <div class="gh-progress-header poppins">
                <span class="gh-progress-title">${titles[state.step - 1]}</span>
                <span class="gh-progress-step">Step ${state.step} of 3</span>
            </div>
            <div class="gh-progress-track">
                <div class="gh-progress-fill" style="width: ${state.step * 33.33}%;"></div>
            </div>
        `;
    },

    renderContent() {
        const state = window.BookingStateManager.state;
        const contentContainer = document.getElementById('gh-main-content');
        if (!contentContainer) return;

        if (state.step === 1) contentContainer.innerHTML = this.getStep1HTML();
        else if (state.step === 2) contentContainer.innerHTML = this.getStep2HTML();
        else if (state.step === 3) contentContainer.innerHTML = this.getStep3HTML();
        else if (state.step === 4) contentContainer.innerHTML = this.getStep4HTML();
    },

    renderFooter() {
        const state = window.BookingStateManager.state;
        const footerContainer = document.getElementById('gh-footer-area');
        if (!footerContainer) return;

        if (state.step >= 4) {
            footerContainer.innerHTML = '';
            return;
        }

        const totals = window.BookingStateManager.calculateTotals();
        const totalSavings = parseFloat(totals.savings) + state.inbound.inboundSavings;
        const isNextDisabled = window.BookingControllers.isNextDisabled();
        
        const isSubmitting = window.BookingControllers.isSubmitting;
        const btnText = state.step === 1 ? 'Next Step' : (state.step === 3 ? 'Confirm & Book' : 'Continue');
        
        let btnContent = isSubmitting 
            ? `<i data-lucide="loader-2" class="gh-icon-md gh-animate-spin"></i><span>Booking...</span>`
            : `<span>${btnText}</span><i data-lucide="arrow-right" class="gh-icon-md"></i>`;

        footerContainer.innerHTML = `
            <div class="gh-footer">
                <div style="gap: 4px; display: flex; flex-direction: column;">
                    <div class="gh-total-label">Today's Total</div>
                    <div class="gh-total-val poppins">$${totals.total}</div>
                    <div class="gh-savings-pill">
                        <i data-lucide="sparkles" class="gh-icon-sm"></i> 
                        Save $${totalSavings.toFixed(0)} today
                    </div>
                </div>
                <div class="gh-flex gh-items-center gh-gap-3">
                    ${state.step > 1 ? `
                        <button onclick="window.BookingControllers.nav(-1)" 
                                class="gh-text-gray-500 gh-font-bold gh-text-sm gh-uppercase gh-tracking-wide gh-hover-text-primary gh-transition-colors gh-px-4 gh-py-2 gh-rounded-lg"
                                style="border: none; background: transparent;">
                            Back
                        </button>
                    ` : ''}
                    <button class="gh-main-btn" 
                            ${isNextDisabled ? 'disabled' : ''} 
                            onclick="window.BookingControllers.handleNext()">
                        ${btnContent}
                    </button>
                </div>
            </div>
        `;
    },

    // --- HTML GENERATORS FOR EACH STEP ---
    getStep1HTML() {
        const state = window.BookingStateManager.state;
        const totals = window.BookingStateManager.calculateTotals();
        const availableAddons = window.BookingStateManager.getAvailableAddons();
        const totalSavings = parseFloat(totals.savings) + state.inbound.inboundSavings;

        let itemsHTML = state.inbound.lineItems.length > 0 ? state.inbound.lineItems.map(item => `
            <tr>
                <td>
                    <span class="gh-item-name">${item.name}</span>
                    <span class="gh-item-sub">${item.sub || 'Professional Service'}</span>
                </td>
                <td class="gh-td-time">${item.time}</td>
                <td class="gh-savings-row-val">--</td>
                <td style="text-align:right">$${Math.round(item.price)}</td>
            </tr>
        `).join('') : `<tr><td colspan="4" class="gh-text-center gh-py-4 gh-text-gray-500">Loading itemized estimate...</td></tr>`;

        // Inject dynamic addons into the table
        Object.entries(state.addons).forEach(([id, val]) => {
            const addon = availableAddons.find(a => a.id === id);
            if (!addon) return;
            if (addon.isMultiSize) {
                Object.entries(val).forEach(([sizeKey, qty]) => {
                    if (qty > 0) {
                        const sizeConfig = addon.sizes.find(s => s.key === sizeKey);
                        itemsHTML += `
                            <tr>
                                <td>
                                    <span class="gh-item-name">${addon.name} (${sizeConfig.label})</span>
                                    <span class="gh-item-sub">Added Add-on</span>
                                </td>
                                <td class="gh-td-time">Included</td>
                                <td class="gh-savings-row-val">-$${(sizeConfig.price * 0.1).toFixed(0)}</td>
                                <td style="text-align:right">$${Math.round(sizeConfig.price * qty)}</td>
                            </tr>
                        `;
                    }
                });
            } else {
                itemsHTML += `
                    <tr>
                        <td>
                            <span class="gh-item-name">${addon.name}</span>
                            <span class="gh-item-sub">Added Add-on</span>
                        </td>
                        <td class="gh-td-time">Included</td>
                        <td class="gh-savings-row-val">-$${(addon.reg - addon.price).toFixed(0)}</td>
                        <td style="text-align:right">$${Math.round(addon.price * val)}</td>
                    </tr>
                `;
            }
        });

        let addonsGridHTML = availableAddons.map(a => {
            const isSelected = (a.id in state.addons);
            const val = state.addons[a.id];
            
            let qtyHTML = '';
            if (isSelected && a.editable) {
                if (a.isMultiSize) {
                    qtyHTML = a.sizes.map(sz => `
                        <div class="gh-flex gh-items-center gh-justify-between gh-gap-4">
                            <span class="gh-text-xs gh-font-bold gh-text-gray-500" style="min-width: 90px; text-align: right;">${sz.label}</span>
                            <div class="gh-qty-control">
                                <button class="gh-qty-btn" onclick="event.stopPropagation(); window.BookingControllers.updateQty('${a.id}', -1, '${sz.key}')">-</button>
                                <span class="gh-qty-val">${val[sz.key] || 0}</span>
                                <button class="gh-qty-btn" onclick="event.stopPropagation(); window.BookingControllers.updateQty('${a.id}', 1, '${sz.key}')">+</button>
                            </div>
                        </div>
                    `).join('');
                } else {
                    qtyHTML = `
                        <div class="gh-qty-control">
                            <button class="gh-qty-btn" onclick="event.stopPropagation(); window.BookingControllers.updateQty('${a.id}', -1)">-</button>
                            <span class="gh-qty-val">${val}</span>
                            <button class="gh-qty-btn" onclick="event.stopPropagation(); window.BookingControllers.updateQty('${a.id}', 1)">+</button>
                        </div>
                    `;
                }
            }

            return `
                <div class="gh-addon-card ${isSelected ? 'selected' : ''}" onclick="window.BookingControllers.toggleAddon('${a.id}', ${a.defaultQty}, ${a.isMultiSize})">
                    ${a.popular ? `<div class="gh-badge-popular poppins">Most Popular</div>` : ''}
                    <div class="gh-addon-info gh-z-10 gh-pointer-events-none">
                        <div class="gh-flex gh-items-center gh-justify-center gh-transition-colors gh-rounded-full gh-border-2 ${isSelected ? 'gh-border-primary gh-bg-primary' : 'gh-border-gray-300'}" style="width: 20px; height: 20px;">
                            ${isSelected ? `<i data-lucide="check" class="gh-icon-sm gh-text-white"></i>` : ''}
                        </div>
                        <img src="${a.img}" class="gh-addon-img" alt="${a.name}" />
                        <div>
                            <div class="gh-addon-name gh-flex gh-items-center gh-gap-2">${a.name}</div>
                            <div class="gh-addon-sub">${a.sub}</div>
                        </div>
                    </div>
                    <div class="gh-addon-price-col gh-z-10">
                        ${!a.isMultiSize ? `<span class="gh-price-tag poppins">$${(a.price * (val || a.defaultQty)).toFixed(0)}</span>` : ''}
                        ${isSelected && a.editable ? `<div class="gh-flex gh-flex-col gh-gap-2">${qtyHTML}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="fade-in">
                <div class="gh-price-header">
                    <h2 class="gh-font-black gh-text-2xl gh-text-center gh-mb-3 gh-text-dark">Review Your Estimate</h2>
                </div>

                <div class="gh-result-card fade-in">
                    <div class="gh-result-super">ESTIMATED TOTAL</div>
                    <div class="gh-price-big">$${totals.total}</div>
                    <div class="gh-range-pill">$${totals.baseLow} - $${totals.baseHigh}</div>

                    <div class="gh-stats-grid">
                        <div class="gh-stat-col">
                            <span class="gh-stat-label">HOME SIZE</span>
                            <span class="gh-stat-val">${state.inbound.homeSize}</span>
                        </div>
                        <div class="gh-stat-col">
                            <span class="gh-stat-label">EST. PANES</span>
                            <span class="gh-stat-val">~${state.inbound.panes}</span>
                        </div>
                        <div class="gh-stat-col">
                            <span class="gh-stat-label">ONSITE TIME</span>
                            <span class="gh-stat-val">${state.inbound.onsiteTime}</span>
                        </div>
                    </div>

                    ${totalSavings > 0 ? `
                        <div class="gh-savings-banner">
                            <span>⚡ BUNDLE SAVINGS APPLIED:</span>
                            <span>-$${totalSavings.toFixed(0)}</span>
                        </div>
                    ` : ''}

                    <button onclick="window.BookingControllers.toggleBreakdown()" class="gh-accordion-toggle">
                        <span id="gh-breakdown-text">View Itemized Breakdown</span>
                        <span id="gh-breakdown-carrot" class="gh-carrot"><i data-lucide="chevron-down" class="gh-icon-sm"></i></span>
                    </button>

                    <div id="gh-breakdown-wrapper" class="gh-breakdown-wrapper">
                        <table class="gh-breakdown-table">
                            <thead>
                                <tr>
                                    <th style="width:40%">Service</th>
                                    <th style="width:20%">Man Hours</th>
                                    <th style="width:20%">Savings</th>
                                    <th style="width:20%; text-align:right">Cost</th>
                                </tr>
                            </thead>
                            <tbody>${itemsHTML}</tbody>
                        </table>
                    </div>
                </div>

                <div class="gh-mt-8 gh-mb-4">
                    <h3 class="gh-font-black gh-text-2xl gh-text-dark">Recommended Add-ons</h3>
                </div>

                <div class="gh-setup-leverage" style="margin-bottom: 24px;">
                    <i data-lucide="zap" class="gh-icon-xl gh-text-accent gh-mt-1 gh-shrink-0" style="color: #FFC107;"></i>
                    <div>
                        <div class="gh-leverage-title">High Demand Near You!</div>
                        <p class="gh-leverage-text">Since your <strong>$60 setup fee</strong> is already covered, adding complementary services below is significantly cheaper. Lock them in now!</p>
                    </div>
                </div>
                
                <div class="gh-flex gh-flex-col gh-gap-0">
                    ${addonsGridHTML}
                </div>
            </div>
        `;
    },

    getStep2HTML() {
        const state = window.BookingStateManager.state;
        
        let slotsHTML = '';
        if (state.schedule.isLoadingSlots) {
            slotsHTML = `
                <div class="gh-flex gh-flex-col gh-items-center gh-justify-center gh-py-12">
                    <i data-lucide="loader-2" class="gh-icon-2xl gh-text-primary gh-animate-spin"></i>
                    <p class="gh-text-xs gh-font-bold gh-text-gray-400 gh-mt-4 gh-uppercase gh-tracking-wide">Calculating travel times...</p>
                </div>
            `;
        } else if (state.schedule.availableSlots.length > 0) {
            // Display first 6 slots for MVP styling logic
            const visibleSlots = state.schedule.availableSlots.slice(0, 6);
            slotsHTML = `<div class="gh-grid gh-grid-cols-1 gh-gap-2">`;
            slotsHTML += visibleSlots.map(s => `
                <div onclick="window.BookingControllers.selectSlot('${s.id}')" 
                     class="gh-slot-btn ${state.schedule.selectedSlot?.id === s.id ? 'selected' : ''}">
                    <div>
                        <span class="gh-slot-date">${s.day}</span>
                        <span class="gh-slot-time">${s.window}</span>
                    </div>
                    <span class="gh-tag gh-bg-gray-100 gh-px-2 gh-py-1 gh-rounded gh-uppercase gh-tracking-wide" style="font-size: 10px; font-weight: 700; color: #4A5568;">${s.tag || 'Available'}</span>
                </div>
            `).join('');
            slotsHTML += `</div>`;
        } else {
            slotsHTML = `<p class="gh-text-center gh-text-gray-500 gh-mt-8">No slots available. Please call to book.</p>`;
        }

        return `
            <div class="fade-in gh-pt-4">
                <h2 class="gh-font-black gh-text-2xl gh-text-center gh-mb-1 gh-text-dark">Lock in your appointment</h2>
                <div class="gh-toggle-container">
                    <button onclick="window.BookingControllers.setScheduleMode('suggested')" class="gh-toggle-btn ${state.schedule.mode === 'suggested' ? 'active' : ''}">Recommended</button>
                    <button onclick="window.BookingControllers.setScheduleMode('all')" class="gh-toggle-btn ${state.schedule.mode === 'all' ? 'active' : ''}">All Days</button>
                </div>
                ${slotsHTML}
            </div>
        `;
    },

    getStep3HTML() {
        const state = window.BookingStateManager.state;
        return `
            <div class="fade-in gh-pt-4">
                <h2 class="gh-font-black gh-text-2xl gh-mb-1 gh-text-dark">Final Details</h2>
                
                <div class="gh-bg-gray-50 gh-p-4 gh-rounded-xl gh-border gh-border-gray-100 gh-mb-6 gh-flex gh-items-start gh-gap-3">
                    <i data-lucide="calendar" class="gh-icon-lg gh-text-primary gh-mt-1"></i>
                    <div>
                        <div class="gh-text-sm gh-font-bold gh-text-dark">${state.schedule.selectedSlot?.day || 'Date Selected'}</div>
                        <div class="gh-text-xs gh-text-gray-500">${state.schedule.selectedSlot?.window || 'Time Window'}</div>
                    </div>
                </div>

                <div class="gh-grid gh-grid-cols-2 gh-gap-3">
                    <input class="gh-input" id="inp-firstName" placeholder="First Name" value="${state.contact.firstName}" oninput="window.BookingControllers.handleInput('firstName', this.value)" />
                    <input class="gh-input" id="inp-lastName" placeholder="Last Name" value="${state.contact.lastName}" oninput="window.BookingControllers.handleInput('lastName', this.value)" />
                </div>
                <input class="gh-input" id="inp-address" placeholder="Full Service Address" value="${state.address}" oninput="window.BookingControllers.handleAddressInput(this.value)" />
                <input class="gh-input" id="inp-email" placeholder="Email Address" type="email" value="${state.contact.email}" oninput="window.BookingControllers.handleInput('email', this.value)" />
                <input class="gh-input" id="inp-phone" placeholder="Mobile Phone" type="tel" value="${state.contact.phone}" oninput="window.BookingControllers.handleInput('phone', this.value)" />
            </div>
        `;
    },

    getStep4HTML() {
        return `
            <div class="fade-in gh-text-center gh-pt-20">
                <div class="gh-rounded-full gh-flex gh-items-center gh-justify-center gh-mx-auto gh-mb-8 gh-shadow-xl" style="width: 96px; height: 96px; background-color: #E6FFFA; color: #3D9898;">
                    <i data-lucide="check" class="gh-icon-2xl"></i>
                </div>
                <h2 class="gh-font-black gh-text-3xl gh-tracking-tight gh-mb-3 gh-text-dark">You're Booked!</h2>
                <p class="gh-text-sm gh-text-gray-500 gh-font-bold gh-px-8 gh-leading-relaxed">We've reserved your arrival window. A confirmation email has been sent to you.</p>
                <button onclick="window.location.reload()" class="gh-text-primary gh-font-bold gh-text-sm gh-mt-8 gh-hover-underline" style="background:none; border:none;">Start New Booking</button>
            </div>
        `;
    },

    // --- UTILITIES ---
    initAutocomplete() {
        const input = document.getElementById('inp-address');
        if (input && window.google) {
            try {
                const autocomplete = new window.google.maps.places.Autocomplete(input, {
                    types: ['address'],
                    componentRestrictions: { country: 'us' },
                    fields: ['formatted_address']
                });
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.formatted_address) {
                        window.BookingStateManager.setAddress(place.formatted_address);
                        window.BookingUI.renderFooter(); // Re-validate
                    }
                });
            } catch (e) {
                console.warn("Google Maps Autocomplete failed to load:", e);
            }
        }
    }
};

/**
 * UI Controllers
 * Maps user interactions to the StateManager and API Client, then triggers re-renders.
 */
window.BookingControllers = {
    isSubmitting: false,

    nav(direction) {
        const state = window.BookingStateManager.state;
        window.BookingStateManager.setStep(state.step + direction);
        window.BookingUI.renderAll();
    },

    toggleAddon(id, defaultQty, isMultiSize) {
        window.BookingStateManager.toggleAddon(id, defaultQty, isMultiSize);
        window.BookingUI.renderAll();
    },

    updateQty(id, delta, sizeKey) {
        window.BookingStateManager.updateAddonQty(id, delta, sizeKey);
        window.BookingUI.renderAll();
    },

    toggleBreakdown() {
        const wrapper = document.getElementById('gh-breakdown-wrapper');
        const carrot = document.getElementById('gh-breakdown-carrot');
        const text = document.getElementById('gh-breakdown-text');
        if (wrapper && carrot && text) {
            wrapper.classList.toggle('open');
            carrot.classList.toggle('open');
            text.innerText = wrapper.classList.contains('open') ? 'Hide Details' : 'View Itemized Breakdown';
        }
    },

    setScheduleMode(mode) {
        window.BookingStateManager.setScheduleMode(mode);
        window.BookingUI.renderContent();
        if (window.lucide) window.lucide.createIcons();
    },

    selectSlot(slotId) {
        const slots = window.BookingStateManager.state.schedule.availableSlots;
        const slot = slots.find(s => s.id === slotId);
        window.BookingStateManager.setSelectedSlot(slot);
        window.BookingUI.renderAll();
    },

    handleInput(field, value) {
        window.BookingStateManager.updateContactForm(field, value);
        // Only update the footer to validate the button, avoid re-rendering inputs and losing focus
        window.BookingUI.renderFooter();
        if (window.lucide) window.lucide.createIcons();
    },

    handleAddressInput(value) {
        window.BookingStateManager.setAddress(value);
        window.BookingUI.renderFooter();
        if (window.lucide) window.lucide.createIcons();
    },

    isNextDisabled() {
        const state = window.BookingStateManager.state;
        if (this.isSubmitting) return true;
        if (state.step === 2 && !state.schedule.selectedSlot) return true;
        if (state.step === 3 && !window.BookingStateManager.validateForm()) return true;
        return false;
    },

    async handleNext() {
        const state = window.BookingStateManager.state;
        
        if (state.step < 3) {
            this.nav(1);
        } else if (state.step === 3) {
            this.isSubmitting = true;
            window.BookingUI.renderFooter(); // Show loading state on button
            if (window.lucide) window.lucide.createIcons();

            try {
                const payload = window.BookingStateManager.buildFinalPayload();
                await window.BookingApiClient.submitBooking(payload);
                // Success! Move to Step 4
                this.isSubmitting = false;
                window.BookingStateManager.setStep(4);
                window.BookingUI.renderAll();
            } catch (error) {
                this.isSubmitting = false;
                window.BookingUI.renderFooter(); // Remove loading state
                if (window.lucide) window.lucide.createIcons();
                alert("There was an issue securing your booking. Please try again or call us.");
            }
        }
    }
};

// Expose to window globally
window.BookingUI = BookingUI;

// Auto-initialize when loaded
document.addEventListener("DOMContentLoaded", () => {
    BookingUI.init();
});