# X-Carbon – Turning Pollution Into Ink

## Current State
New project. No existing files.

## Requested Changes (Diff)

### Add
- `frontend/public/index.html` – Main HTML file
- `frontend/public/style.css` – All styles
- `frontend/public/script.js` – All interactivity and logic

### Modify
N/A

### Remove
N/A

## Implementation Plan

### index.html
- Three top-level sections hidden/shown via JS: `#splash`, `#access-page`, `#dashboard`
- Splash: full-screen with X-CARBON heading and tagline
- Access page: two buttons (Connect ESP32, Guest Demo Mode)
- Dashboard: nav, hero, live-dashboard cards, how-it-works, future-impact, footer
- Canvas element in body background for particle animation

### style.css
- CSS custom properties for purple/neon carbon palette
- Full-screen splash with glowing neon keyframe animation on title
- Access page centered card layout
- Dashboard grid layout with glow-effect cards
- Hover animations on cards (scale + glow intensify)
- Responsive breakpoints for mobile
- Scrollbar styling, smooth scroll on html
- Animated counter value pulse/blink keyframe

### script.js
- Canvas particle system: floating carbon dust particles (small circles, slow drift)
- Splash timer: 5-second auto-transition to access page (skip on click)
- ESP32 connection: Web Bluetooth API – scan for device, on success show dashboard
- Guest Demo Mode: populate cards with sample data, show dashboard
- Live data simulation: setInterval to slightly randomize demo values each second
- Smooth section transitions (fade/slide)
- IntersectionObserver for scroll-reveal on how-it-works and future-impact cards
- ESP32 real-data hook: exported `updateDashboard(data)` function ready for BLE characteristic notifications
