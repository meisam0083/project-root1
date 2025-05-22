/* === Imperial Estate Core Module === */
const ImperialEstate = (() => {
  // === State Management ===
  const state = {
    currentView: 'auth',
    map: null,
    marker: null,
    lastCoords: { main: null, sub: null },
    timers: new Set()
  };

  // === Security Configuration ===
  const SECURITY = {
    RECAPTCHA: {
      SITE_KEY: 'YOUR_ACTUAL_SITE_KEY',
      CALLBACKS: {
        SUCCESS: 'onCaptchaSuccess',
        ERROR: 'onCaptchaError'
      }
    },
    SUBSCRIPTION: {
      PLANS: new Map([
        [149000, { duration: 6, name: 'پلنیوم' }],
        [249000, { duration: 12, name: 'امپریال' }]
      ])
    }
  };

  // === DOM Elements ===
  const DOM = {
    views: document.querySelectorAll('[data-view]'),
    authForm: document.getElementById('authForm'),
    searchForm: document.getElementById('searchForm')
  };

  // === Service: Navigation ===
  const NavigationService = {
    switchView: (viewId) => {
      clearTimers();
      showLoading();

      setTimeout(() => {
        DOM.views.forEach(view => {
          const isActive = view.dataset.view === viewId;
          view.hidden = !isActive;
          view.classList.toggle('active', isActive);
        });
        
        state.currentView = viewId;
        updateNavigation();
        initViewFeatures(viewId);
        hideLoading();
      }, 600);
    },

    initViewFeatures: (viewId) => {
      if (viewId === 'map') MapService.init();
    }
  };

  // === Service: Map ===
  const MapService = {
    init: () => {
      if (!state.map) {
        state.map = L.map('mapContainer').setView([35.6892, 51.3890], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map);
      }
      this.updateMarker();
    },

    updateMarker: () => {
      const main = parseInt(document.getElementById('mainPlate').value) || 0;
      const sub = parseInt(document.getElementById('subPlate').value) || 0;

      if (main === state.lastCoords.main && sub === state.lastCoords.sub) return;

      const newLat = 35.6892 + (main * 0.0001);
      const newLng = 51.3890 + (sub * 0.0001);

      if (state.marker) state.map.removeLayer(state.marker);
      
      state.marker = L.marker([newLat, newLng], {
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconSize: [25, 41]
        })
      })
      .bindPopup(پلاک: ${main}-${sub})
      .addTo(state.map);

      state.map.setView([newLat, newLng], 18);
      state.lastCoords = { main, sub };
    }
  };

  // === Service: Payment ===
  const PaymentService = {
    process: async (amount) => {
      try {
        validatePaymentAmount(amount);
        showLoading();

        await simulatePaymentAPI(amount);
        StorageService.setSubscription(SECURITY.SUBSCRIPTION.PLANS.get(amount).duration);
        NavigationService.switchView('map');
      } catch (error) {
        showError(error.message);
      } finally {
        hideLoading();
      }
    }
  };

  // === Utilities ===
  const utils = {
    clearTimers: () => state.timers.forEach(timer => clearTimeout(timer)),
    showLoading: () => document.querySelector('.loading-overlay').hidden = false,
    hideLoading: () => document.querySelector('.loading-overlay').hidden = true,
    showError: (message) => alert(❌ خطا:\n${message})
  };

  // === Event Handlers ===
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (validatePhone()) NavigationService.switchView('subscription');
  };

  const handlePlanSelect = (e) => {
    const plan = parseInt(e.target.dataset.plan);
    if (plan) PaymentService.process(plan);
  };

  // === Initialization ===
  const init = () => {
    DOM.authForm.addEventListener('submit', handleAuthSubmit);
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="subscribe"]')) handlePlanSelect(e);
    });

    if (StorageService.hasValidSubscription()) {
      NavigationService.switchView('map');
    }
  };

  // === Public API ===
  return {
    init,
    onCaptchaSuccess: () => document.getElementById('captchaHelp').textContent = '',
    onCaptchaError: () => utils.showError('خطا در تأیید کپچا')
  };
})();

// === Bootstrap Application ===
document.addEventListener('DOMContentLoaded', ImperialEstate.init);
