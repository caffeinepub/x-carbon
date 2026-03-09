/* =============================================
   X-CARBON — script.js
   Canvas Particles + Phase Logic + BLE + Demo
   ============================================= */

"use strict";

// ============================================
// CANVAS PARTICLE SYSTEM
// ============================================

(function initParticles() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  let particles = [];
  let animFrameId = null;

  const PARTICLE_COUNT = 100;
  const COLORS = [
    { r: 124, g: 58, b: 237 },  // purple
    { r: 34,  g: 211, b: 238 }, // cyan
    { r: 168, g: 85,  b: 247 }, // purple-hi
    { r: 99,  g: 22,  b: 190 }, // dark purple
  ];

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
  }

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const col = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        x:          randomBetween(0, canvas.width),
        y:          randomBetween(0, canvas.height),
        radius:     randomBetween(0.8, 2.8),
        vx:         randomBetween(-0.35, 0.35),
        vy:         randomBetween(-0.25, 0.25),
        opacity:    randomBetween(0.15, 0.45),
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        opacitySpd: randomBetween(0.002, 0.006),
        r: col.r, g: col.g, b: col.b,
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Opacity pulse
      p.opacity += p.opacityDir * p.opacitySpd;
      if (p.opacity >= 0.48 || p.opacity <= 0.08) {
        p.opacityDir *= -1;
      }

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.x < -5)  p.x = canvas.width  + 5;
      if (p.x > canvas.width  + 5) p.x = -5;
      if (p.y < -5)  p.y = canvas.height + 5;
      if (p.y > canvas.height + 5) p.y = -5;

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity})`;
      ctx.fill();

      // Soft glow halo for larger particles
      if (p.radius > 1.8) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity * 0.12})`;
        ctx.fill();
      }
    }

    animFrameId = requestAnimationFrame(drawParticles);
  }

  // Start
  resizeCanvas();
  drawParticles();

  // Resize handler (debounced)
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 150);
  });
})();


// ============================================
// PHASE MANAGEMENT
// ============================================

const PHASES = {
  SPLASH: "splash",
  ACCESS: "access-page",
  DASHBOARD: "dashboard",
};

let currentMode = null; // 'demo' | 'device'

function showPhase(id) {
  document.querySelectorAll(".phase").forEach(function (el) {
    el.classList.add("hidden");
    el.classList.remove("active");
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
  }
}


// ============================================
// SPLASH SCREEN
// ============================================

(function initSplash() {
  const splash = document.getElementById("splash");
  const progress = document.getElementById("splash-progress");
  const skipBtn = document.getElementById("splash-skip");
  let skipped = false;

  function doTransition() {
    if (skipped) return;
    skipped = true;
    splash.classList.add("fade-out");
    setTimeout(function () {
      showPhase(PHASES.ACCESS);
    }, 600);
  }

  // Start progress bar
  setTimeout(function () {
    progress.style.width = "100%";
  }, 50);

  // Auto-advance after 5 seconds
  const autoTimer = setTimeout(doTransition, 5000);

  // Skip on click anywhere
  splash.addEventListener("click", function () {
    clearTimeout(autoTimer);
    doTransition();
  });

  // Skip button specifically
  skipBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    clearTimeout(autoTimer);
    doTransition();
  });
})();


// ============================================
// ACCESS PAGE — BUTTONS
// ============================================

(function initAccess() {
  const btnConnect = document.getElementById("btn-connect");
  const btnDemo    = document.getElementById("btn-demo");
  const bleLoading = document.getElementById("ble-loading");
  const bleError   = document.getElementById("ble-error");
  const bleErrorTxt = document.getElementById("ble-error-text");

  function showBleStatus(state, message) {
    bleLoading.classList.add("hidden");
    bleError.classList.add("hidden");
    if (state === "loading") {
      bleLoading.classList.remove("hidden");
    } else if (state === "error") {
      bleError.classList.remove("hidden");
      if (message) bleErrorTxt.textContent = message;
    }
  }

  function launchDashboard(mode) {
    currentMode = mode;
    showPhase(PHASES.DASHBOARD);
    initDashboard(mode);
  }

  // Guest Demo
  btnDemo.addEventListener("click", function () {
    launchDashboard("demo");
  });

  // Connect ESP32 via Web Bluetooth
  btnConnect.addEventListener("click", async function () {
    // Check Web Bluetooth support
    if (!navigator.bluetooth) {
      showBleStatus("error", "Web Bluetooth requires Chrome on desktop. Please use Chrome or Edge.");
      return;
    }

    showBleStatus("loading");
    btnConnect.disabled = true;

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        // Uncomment for specific service filter:
        // filters: [{ name: 'XCarbon' }],
        // optionalServices: ['battery_service']
      });

      // Attempt GATT connection
      showBleStatus("loading");
      let server;
      try {
        server = await device.gatt.connect();
      } catch (gattErr) {
        // Device selected but GATT failed — still enter device mode
        console.warn("GATT connection failed, entering device mode without live data:", gattErr);
        launchDashboard("device");
        return;
      }

      console.log("Connected to", device.name || "unnamed device", server);
      launchDashboard("device");

    } catch (err) {
      btnConnect.disabled = false;

      if (err.name === "NotFoundError" || err.message.includes("cancelled")) {
        showBleStatus("error", "Device scan cancelled. Click again to retry.");
      } else if (err.name === "SecurityError") {
        showBleStatus("error", "Bluetooth permission denied. Please allow Bluetooth in your browser settings.");
      } else {
        showBleStatus("error", `Connection failed: ${err.message || err.name}`);
      }
    }
  });
})();


// ============================================
// DASHBOARD — INIT
// ============================================

function initDashboard(mode) {
  // Set nav mode badge
  const badge = document.getElementById("nav-mode-badge");
  badge.textContent = mode === "demo" ? "Demo Mode" : "Device Connected";
  badge.classList.add("visible");

  // Footer year
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Initialize state
  if (mode === "demo") {
    startDemoMode();
  } else {
    showDeviceWaiting();
  }

  // Set up pulse bars
  document.querySelectorAll(".metric-card").forEach(function (card) {
    card.classList.add("demo-pulse");
  });

  // Nav scroll + hamburger
  initNav();

  // Scroll reveal
  initScrollReveal();

  // Scroll to top after dashboard opens
  window.scrollTo({ top: 0, behavior: "instant" });
}


// ============================================
// DEMO MODE — LIVE DATA SIMULATION
// ============================================

const demoState = {
  carbon:   142.3,
  ink:      17.08,
  aqi:      58,
  vehicles: 4,
};

function startDemoMode() {
  // Set initial values
  updateDashboardDOM(demoState);

  // Animate every 1.5 seconds
  setInterval(function () {
    // Carbon: +0 to +2 mg
    demoState.carbon   = Math.round((demoState.carbon + Math.random() * 2) * 10) / 10;
    // Ink: proportional (~12% of carbon)
    demoState.ink      = Math.round(demoState.carbon * 0.12 * 10) / 10;
    // AQI: ±3 fluctuation, clamp 20–180
    demoState.aqi      = Math.max(20, Math.min(180, demoState.aqi + Math.round((Math.random() * 6) - 3)));
    // Vehicles: occasionally +1 (1 in 8 chance)
    if (Math.random() < 0.125) demoState.vehicles++;

    updateDashboardDOM(demoState);
  }, 1500);
}

function showDeviceWaiting() {
  const ids = ["val-carbon", "val-ink", "val-aqi", "val-vehicles"];
  ids.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = "—";
      el.style.fontSize = "1.4rem";
    }
  });

  ["trend-carbon", "trend-ink", "trend-aqi", "trend-vehicles"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.textContent = "Waiting for data…";
  });
}

// Exposed global for BLE characteristic updates
window.updateDashboard = function (data) {
  if (!data) return;
  const state = {
    carbon:   typeof data.carbonMg   === "number" ? data.carbonMg   : demoState.carbon,
    ink:      typeof data.inkMl      === "number" ? data.inkMl      : demoState.ink,
    aqi:      typeof data.aqi        === "number" ? data.aqi        : demoState.aqi,
    vehicles: typeof data.vehicles   === "number" ? data.vehicles   : demoState.vehicles,
  };
  updateDashboardDOM(state);
};

function updateDashboardDOM(data) {
  // Helper: animate value change
  function setVal(id, value, decimals) {
    const el = document.getElementById(id);
    if (!el) return;
    const formatted = typeof decimals === "number" ? value.toFixed(decimals) : String(value);
    if (el.textContent !== formatted) {
      el.textContent = formatted;
      el.classList.remove("updating");
      void el.offsetWidth; // reflow to restart animation
      el.classList.add("updating");
    }
  }

  function setTrend(id, current, previous, unit) {
    const el = document.getElementById(id);
    if (!el) return;
    const delta = current - previous;
    if (delta > 0) {
      el.textContent = `↑ +${delta.toFixed(1)} ${unit} since last update`;
      el.style.color = "var(--col-green)";
    } else if (delta < 0) {
      el.textContent = `↓ ${delta.toFixed(1)} ${unit} since last update`;
      el.style.color = "var(--col-red)";
    } else {
      el.textContent = `— stable`;
      el.style.color = "var(--col-text-dim)";
    }
  }

  // Store previous for trends
  const prev = Object.assign({}, demoState);

  // Carbon
  setVal("val-carbon", data.carbon, 1);
  setTrend("trend-carbon", data.carbon, prev.carbon, "mg");
  const carbonPct = Math.min(100, (data.carbon / 500) * 100);
  const carbonProgress = document.getElementById("progress-carbon");
  if (carbonProgress) carbonProgress.style.width = carbonPct + "%";

  // Ink
  setVal("val-ink", data.ink, 1);
  setTrend("trend-ink", data.ink, prev.ink, "ml");
  const inkPct = Math.min(100, (data.ink / 60) * 100);
  const inkProgress = document.getElementById("progress-ink");
  if (inkProgress) inkProgress.style.width = inkPct + "%";

  // AQI
  setVal("val-aqi", data.aqi, 0);
  setTrend("trend-aqi", data.aqi, prev.aqi, "");

  // AQI badge
  const aqiBadge = document.getElementById("aqi-badge");
  if (aqiBadge) {
    aqiBadge.className = "metric-unit aqi-badge";
    if (data.aqi <= 50) {
      aqiBadge.textContent = "Good";
      aqiBadge.classList.add("aqi-good");
    } else if (data.aqi <= 100) {
      aqiBadge.textContent = "Moderate";
      aqiBadge.classList.add("aqi-moderate");
    } else {
      aqiBadge.textContent = "Unhealthy";
      aqiBadge.classList.add("aqi-unhealthy");
    }
  }

  // AQI indicator bar
  const aqiBarFill = document.getElementById("aqi-bar-fill");
  if (aqiBarFill) {
    const aqiPct = Math.min(100, (data.aqi / 200) * 100);
    aqiBarFill.style.left = aqiPct + "%";
  }

  // Vehicles
  setVal("val-vehicles", data.vehicles, 0);
  const vehiclePct = Math.min(100, (data.vehicles / 20) * 100);
  const vehicleProgress = document.getElementById("progress-vehicles");
  if (vehicleProgress) vehicleProgress.style.width = vehiclePct + "%";
  const trendVehicles = document.getElementById("trend-vehicles");
  if (trendVehicles) {
    if (data.vehicles > prev.vehicles) {
      trendVehicles.textContent = `↑ New vehicle logged (+${data.vehicles - prev.vehicles})`;
      trendVehicles.style.color = "var(--col-green)";
    } else {
      trendVehicles.textContent = `${data.vehicles} vehicle${data.vehicles !== 1 ? "s" : ""} in session`;
      trendVehicles.style.color = "var(--col-text-dim)";
    }
  }

  // Update demo state
  Object.assign(demoState, data);
}


// ============================================
// NAV — HAMBURGER + SCROLL EFFECTS
// ============================================

function initNav() {
  const hamburger = document.getElementById("nav-hamburger");
  const navMenu   = document.getElementById("nav-menu");
  const navHeader = document.getElementById("nav-header");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", function () {
      const isOpen = navMenu.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close on nav link click (mobile)
    navMenu.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        navMenu.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (!navHeader.contains(e.target)) {
        navMenu.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Scroll shadow
  window.addEventListener("scroll", function () {
    if (navHeader) {
      navHeader.classList.toggle("scrolled", window.scrollY > 20);
    }
  }, { passive: true });

  // Active link highlight
  const sections = ["section-dashboard", "section-how-it-works", "section-impact"];
  const links = {
    "section-dashboard":    document.querySelector('[data-ocid="nav.dashboard_link"]'),
    "section-how-it-works": document.querySelector('[data-ocid="nav.how_it_works_link"]'),
    "section-impact":       document.querySelector('[data-ocid="nav.impact_link"]'),
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && links[entry.target.id]) {
        Object.values(links).forEach(function (l) { if (l) l.classList.remove("active"); });
        links[entry.target.id].classList.add("active");
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}


// ============================================
// SMOOTH SCROLL HELPERS
// ============================================

window.smoothScrollTo = function (e, sectionId) {
  if (e) e.preventDefault();
  const target = document.getElementById(sectionId);
  if (target) {
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 70;
    const top = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top: top, behavior: "smooth" });
  }
};

window.scrollToTop = function (e) {
  if (e) e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
};


// ============================================
// SCROLL REVEAL
// ============================================

function initScrollReveal() {
  const reveals = document.querySelectorAll(".reveal");

  if (!reveals.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // Stagger siblings
        const siblings = entry.target.parentElement.querySelectorAll(".reveal");
        let delay = 0;
        siblings.forEach(function (sib, idx) {
          if (sib === entry.target) delay = idx * 80;
        });
        setTimeout(function () {
          entry.target.classList.add("revealed");
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  reveals.forEach(function (el) {
    observer.observe(el);
  });
}
