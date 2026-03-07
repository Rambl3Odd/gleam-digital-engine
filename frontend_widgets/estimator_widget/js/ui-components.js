/**
 * Gleam Services - UI Components
 * Dedicated purely to visual rendering and DOM manipulation.
 * Listens to StateManager and ApiClient.
 */

const UIConfig = {
    sparkleUrl: "https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/e04d58a2-fe60-48c7-8485-daf7a21ba10f/Sparkle+Favicon.png?format=1500w",
    services: [
        { id: 'ext', name: 'Exterior Window Cleaning', sub: 'Glass, Sills & Frames', icon: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/4cf77caa-aaf4-41ad-bd1a-2d39ba9d1ab4/service-window%26glass-exterior%28300x300%29.png?format=300w' },
        { id: 'int', name: 'Interior Window Cleaning', sub: 'Inside & Detailing', icon: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/647894df-9f0f-4b4c-9f2c-800ec19a043c/service-window%26glass-interior%28300x300%29.png?format=300w' },
        { id: 'scr', name: 'Window Screen Cleaning', sub: 'Scrub and Rinse', icon: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/db20b51d-8504-4373-8879-6b4f5966ea4f/service-window%26glass-screens%28300x300%29.png?format=300w' },
        { id: 'trk', name: 'Window Track Cleaning', sub: 'Scrub and Vacuum', icon: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/9c504379-66e9-4a06-b9fe-58e3a0d61230/service-window%26glass-tracks%28300x300%29.png?format=300w' },
        { id: 'tint', name: 'Window Tint & Film', sub: 'UV Protection & Privacy', icon: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/82ad4b0b-1a7c-42c0-9ce2-f7a3527c7673/service-window%26glass-tint%26film%28300x300%29.png?format=1500w' },
        { id: 'rest', name: 'Window & Glass Restoration', sub: 'Hard Water Removal', icon: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/84743489-d1dd-4315-b9a7-3a6e2a3284a2/Window_Restoration.png?format=1500w' }
    ]
};

const UIComponents = {
    
    init() {
        this.renderServiceGrid();
        this.updateSavingsUI(0);
        this.updateNavUI();
        this.updateSqftDisplay(3000);
    },

    renderServiceGrid() {
        const grid = document.getElementById('gcServiceGrid');
        if (!grid) return;
        grid.innerHTML = UIConfig.services.map(s => `
            <div class="gc-card" onclick="window.UIControllers.toggleService('${s.id}', this)">
                <div class="gc-check-circle">✓</div>
                <img src="${s.icon}" class="gc-icon" alt="${s.name}">
                <div class="gc-card-label">${s.name}</div>
                <div class="gc-card-sub">${s.sub}</div>
            </div>
        `).join('');
    },

    updateSavingsUI(selectedCount) {
        const bar = document.getElementById('gcSavingsBar');
        const text = document.getElementById('gcSavingsText');
        const container = document.getElementById('gcSavingsContainer');
        if (!bar || !text || !container) return;

        let width = 0, msg = "Select services to start estimate", color = "#718096", containerClass = "";
        const sparkIcon = `<img src="${UIConfig.sparkleUrl}" class="gc-sparkle-img" alt="Sparkle">`;

        if(selectedCount === 1) { width = 25; msg = "Select 1 more for <span style='color:var(--gc-primary); text-decoration:underline;'>Basic Savings (5%)</span>"; color = "#2D3748"; }
        else if(selectedCount === 2) { width = 50; msg = `${sparkIcon} BASIC UNLOCKED (5% OFF)`; color = "#3D9898"; containerClass = "unlocked-basic"; }
        else if(selectedCount === 3) { width = 75; msg = `${sparkIcon} PREMIUM UNLOCKED (7.5% OFF)`; color = "#D69E2E"; containerClass = "unlocked-premium"; }
        else if(selectedCount >= 4) { width = 100; msg = `${sparkIcon} PREMIUM PLUS: 10% OFF (MAX SAVINGS)`; color = "#3D9898"; containerClass = "unlocked-plus"; }

        bar.style.width = width + "%"; 
        text.innerHTML = msg; 
        text.style.color = color;
        container.className = 'gc-savings-container ' + containerClass;
    },

    updateSqftDisplay(val) {
        const input = document.getElementById('gcMainSqftInput');
        if (input && document.activeElement !== input) { 
            input.value = parseInt(val, 10); 
        }
    },

    updateNavUI() {
        const state = window.StateManager.state;
        for(let i=1; i<=3; i++) {
            const view = document.getElementById(`gc-view-${i}`);
            if (view) view.classList.toggle('active', i === state.step);
        }
        
        const prog = (state.step / 3) * 100;
        document.getElementById('gcProgress').style.width = `${prog}%`;
        document.getElementById('gcStepText').innerText = `Step ${state.step}/3`;
        
        const backBtn = document.getElementById('gcBackBtn');
        const nextBtn = document.getElementById('gcNextBtn');
        if (backBtn) backBtn.style.visibility = state.step > 1 ? 'visible' : 'hidden';
        
        if (!nextBtn) return;

        if(state.step === 1) {
            nextBtn.innerText = "Next: Details";
            nextBtn.disabled = state.selectedServices.size === 0;
            nextBtn.onclick = () => window.UIControllers.nav(1);
        } else if (state.step === 2) {
            nextBtn.innerText = "Calculate Estimate";
            nextBtn.onclick = () => window.UIControllers.triggerSkeletonLoadAndCalculate();
        } else {
            nextBtn.innerText = "Book This Job"; 
            nextBtn.onclick = () => {
                if(window.ApiClient) {
                    window.ApiClient.redirectToBookingHub(state.estimateResult);
                }
            };
        }
    },

    renderEstimate(result) {
        if (!result) return;
        
        const fmtTime = (mins) => {
            if(mins < 60) return `${Math.round(mins)}m`;
            let h = Math.floor(mins/60), m = Math.round(mins%60);
            return `${h}h ${m}m`;
        };

        const fmtCost = (raw, discPercent) => {
            const final = raw * (1 - discPercent), saved = raw - final;
            let html = `<div class="gc-price-stack">`;
            if (saved > 1) {
                html += `<span class="gc-price-old">$${Math.round(raw)}</span>`;
                html += `<div><span class="gc-price-new">$${Math.round(final)}</span> <span class="gc-savings-pill">Save $${Math.round(saved)}</span></div>`;
            } else { html += `<span class="gc-price-new">$${Math.round(final)}</span>`; }
            html += `</div>`;
            return html;
        };

        document.getElementById('gcFinalPrice').innerText = `~ $${result.priceMid}`;
        document.getElementById('gcPriceLow').innerText = `$${result.priceLow}`;
        document.getElementById('gcPriceHigh').innerText = `$${result.priceHigh}`;
        document.getElementById('bd-sqft').innerText = `${window.StateManager.state.sqft.toLocaleString()} sq ft`;
        document.getElementById('bd-panes').innerText = `~${window.StateManager.state.panes}`;
        document.getElementById('bd-onsite').innerText = fmtTime(result.onsiteMinutes);
        
        if (result.rawTotal > result.priceMid) {
            document.getElementById('gcTotalSavings').style.display = 'flex';
            document.getElementById('gcSavingsAmount').innerText = `-$${result.rawTotal - result.priceMid}`;
        } else {
            document.getElementById('gcTotalSavings').style.display = 'none';
        }

        const breakdownHTML = result.itemsBreakdown.map(item => {
            const displaySub = item.name === 'Exterior Cleaning' ? 'Glass, Frames & Sills' : 
                               item.name === 'Interior Cleaning' ? 'Inside Glass & Sills' : '';
            return `
                <tr>
                    <td><strong>${item.name}</strong><br><span style="font-size:11px; color:#718096;">${displaySub}</span></td>
                    <td class="gc-td-time">${item.time > 60 ? `${Math.floor(item.time/60)}h ${Math.round(item.time%60)}m` : `${Math.round(item.time)}m`}</td>
                    <td>${item.name === 'Logistics & Setup' ? `$${Math.round(item.cost)}` : fmtCost(item.cost, result.discount)}</td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('gcBreakdownBody').innerHTML = breakdownHTML;
    },

    // --- PHASE 4.2 SKELETON LOAD IMPLEMENTATION ---
    showLoadingSkeleton() {
        // Hides the main form and shows a premium loading animation
        const content = document.getElementById('gcAppContent');
        content.innerHTML = `
            <div class="gc-skeleton-container" style="text-align:center; padding: 60px 20px;">
                <h3 id="gcLoaderText" style="color:var(--gc-primary); margin-bottom: 20px;">Locating property...</h3>
                <div class="gc-spinner" style="width: 40px; height: 40px; border: 4px solid #EDF2F7; border-top: 4px solid var(--gc-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;

        // Sequential loading text updates (mimicking AI backend)
        setTimeout(() => { document.getElementById('gcLoaderText').innerText = "Analyzing roof pitch..."; }, 1500);
        setTimeout(() => { document.getElementById('gcLoaderText').innerText = "Calculating environmental variables..."; }, 3000);
    }
};

/**
 * UI Controllers
 * These functions connect the inline HTML events (e.g. onclick="toggleService(...)")
 * to the StateManager and UI rendering logic.
 */
window.UIControllers = {
    setCustomerType(type, el) {
        window.StateManager.setCustomerType(type);
        document.querySelectorAll('.gc-seg-type-btn').forEach(btn => btn.classList.remove('active'));
        el.classList.add('active');
        
        if (type === 'res') {
            document.getElementById('gcResForm').classList.add('active');
            document.getElementById('gcBizForm').classList.remove('active');
            document.getElementById('gcResHeader').style.display = 'block';
            document.getElementById('gcBizHeader').style.display = 'none';
        } else {
            document.getElementById('gcResForm').classList.remove('active');
            document.getElementById('gcBizForm').classList.add('active');
            document.getElementById('gcResHeader').style.display = 'none';
            document.getElementById('gcBizHeader').style.display = 'block';
        }
    },

    checkZipInput(input) {
        const val = input.value;
        const btn = document.getElementById('gcResSubmit');
        const errorMsg = document.getElementById('gcSegError');
        
        if(val.length === 5) {
            // Check via StateManager's logic
            const isValid = window.StateManager.validateZip(val);
            if(isValid) {
                btn.disabled = false; errorMsg.style.display = 'none'; 
                input.classList.remove('invalid'); input.classList.add('valid');
            } else {
                btn.disabled = true; errorMsg.style.display = 'block'; 
                input.classList.add('invalid');
            }
        } else {
            btn.disabled = true; input.classList.remove('valid', 'invalid'); 
            errorMsg.style.display = 'none';
        }
    },

    validateSegmentation() {
        const zip = document.getElementById('gcZipInput').value;
        if (window.StateManager.validateZip(zip)) {
            document.getElementById('gcSegModal').classList.remove('active');
            document.getElementById('gcAppContent').style.filter = 'none';
        }
    },

    toggleService(id, el) {
        if (!window.StateManager.state.zipCodeValidated) {
            document.getElementById('gcSegModal').classList.add('active');
            return;
        }
        const selectedCount = window.StateManager.toggleService(id);
        el.classList.toggle('selected');
        UIComponents.updateSavingsUI(selectedCount);
        document.getElementById('gcNextBtn').disabled = selectedCount === 0;
    },

    selectHouseType(val, el) {
        document.querySelectorAll('.gc-house-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        window.StateManager.setSqft(val);
        UIComponents.updateSqftDisplay(val);
    },

    updateSqftFromInput(val) {
        window.StateManager.setSqft(val);
    },

    toggleCalculator() {
        const calc = document.getElementById('gcRoomCalc');
        if(calc) calc.style.display = calc.style.display === 'none' ? 'block' : 'none';
    },

    calcFromRooms() {
        const beds = document.getElementById('gcBeds').value;
        const baths = document.getElementById('gcBaths').value;
        const newSqft = window.StateManager.calcSqftFromRooms(beds, baths);
        if (newSqft) {
            UIComponents.updateSqftDisplay(newSqft);
            document.getElementById('gcMainSqftInput').style.borderColor = '#3D9898';
        }
    },

    setStories(val, el) {
        window.StateManager.setStories(val);
        el.parentElement.querySelectorAll('.gc-pill-opt').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    },

    setHistory(val, el) {
        window.StateManager.setHistory(val);
        el.parentElement.querySelectorAll('.gc-pill-opt').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        const msg = document.getElementById('gcRestorationMsg');
        if(msg) msg.style.display = val === 'high' ? 'block' : 'none';
    },

    updateSkylights(change) {
        const newVal = window.StateManager.updateSkylights(change);
        document.getElementById('gcSkylightCount').innerText = newVal;
    },

    // The Bridge between UI, Backend, and Math
    async triggerSkeletonLoadAndCalculate() {
        // 1. Show the user the Skeleton Load animation (Phase 4.2)
        UIComponents.showLoadingSkeleton();

        // 2. Trigger the Make.com Webhook via ApiClient (Phase 4.1)
        let aiResult = null;
        if(window.ApiClient) {
             aiResult = await window.ApiClient.fetchDigitalTwinEstimate();
        }

        // 3. Fallback to our local StateManager Math if Make.com fails or isn't connected yet
        if (!aiResult) {
            console.warn("Make.com API skipped or failed. Falling back to local JS calculation.");
            aiResult = window.StateManager.calculateEstimate();
        } else {
            // Update local state with AI results if successful
            window.StateManager.state.estimateResult = aiResult;
        }

        // 4. Restore the UI and Move to Step 3
        this.nav(1);
        UIComponents.renderEstimate(aiResult);
    },

    nav(dir) {
        const newStateStep = window.StateManager.state.step + dir;
        window.StateManager.setStep(newStateStep);
        UIComponents.updateNavUI();
    }
};

// Auto-initialize when the script loads
document.addEventListener("DOMContentLoaded", () => {
    UIComponents.init();
});

// Map legacy global functions to the new UIControllers so HTML buttons don't break immediately
window.setCustomerType = window.UIControllers.setCustomerType;
window.checkZipInput = window.UIControllers.checkZipInput;
window.validateSegmentation = window.UIControllers.validateSegmentation;
window.selectHouseType = window.UIControllers.selectHouseType;
window.updateSqftFromInput = window.UIControllers.updateSqftFromInput;
window.toggleCalculator = window.UIControllers.toggleCalculator;
window.calcFromRooms = window.UIControllers.calcFromRooms;
window.setStories = window.UIControllers.setStories;
window.setHistory = window.UIControllers.setHistory;
window.updateSkylights = window.UIControllers.updateSkylights;
window.nav = window.UIControllers.nav;