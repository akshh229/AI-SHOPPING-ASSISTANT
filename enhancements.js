/* =============================================================
   ShopSmart AI – enhancements.js
   Animations applied (organic, handcrafted feel):
   1.  Aurora canvas — drifting light orbs (Lissajous paths)
   2.  Floating dust particles — random drift, size variation
   3.  Page entrance — spring-physics stagger via Anime.js
   4.  Typewriter — char-by-char reveal on AI messages
   5.  Send-flight — icon launches on send click
   6.  Magnetic send button — cursor-tracking pull
   7.  Ripple on chips — physics splash
   8.  Flow-step pulse — step number bounce + slide
   9.  Cursor glow trailer — lagged radial light
   10. Input grow — textarea springs taller on focus
   11. Progress ring — SVG arc fills as steps complete
   12. Char counter — fades in when typing
   ============================================================= */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Aurora Canvas — Lissajous orbs ───────────────────── */
  function initAurora() {
    const canvas = document.getElementById("aurora-canvas");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    let W, H, t = 0;

    // Each orb follows a Lissajous figure — more organic than linear drift
    const orbs = [
      { ax: 0.22, ay: 0.25, rx: 0.18, ry: 0.14, fx: 0.0004, fy: 0.0007, hue: 265, r: 0.52 },
      { ax: 0.72, ay: 0.65, rx: 0.15, ry: 0.18, fx: 0.0003, fy: 0.0005, hue: 230, r: 0.48 },
      { ax: 0.80, ay: 0.18, rx: 0.12, ry: 0.10, fx: 0.0006, fy: 0.0004, hue: 195, r: 0.40 },
      { ax: 0.38, ay: 0.82, rx: 0.10, ry: 0.12, fx: 0.0005, fy: 0.0006, hue: 250, r: 0.35 },
    ];

    function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
    window.addEventListener("resize", resize);
    resize();

    (function draw() {
      ctx.clearRect(0, 0, W, H);
      t++;
      orbs.forEach((o, i) => {
        const cx     = (o.ax + Math.sin(t * o.fx + i * 1.3) * o.rx) * W;
        const cy     = (o.ay + Math.cos(t * o.fy + i * 0.8) * o.ry) * H;
        const radius = o.r * Math.min(W, H);
        const hue    = o.hue + Math.sin(t * 0.0015 + i) * 18;
        const g      = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0,   `hsla(${hue},78%,55%,0.17)`);
        g.addColorStop(0.4, `hsla(${hue+25},68%,45%,0.07)`);
        g.addColorStop(1,   `hsla(${hue+50},55%,30%,0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    })();
  }

  /* ── 2. Floating Dust Particles ───────────────────────────── */
  function initParticles() {
    if (prefersReduced) return;
    const container = document.getElementById("app");
    if (!container) return;

    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;";
    document.body.appendChild(wrap);

    // 28 particles, each with slightly different character
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("span");
      const size  = 1.5 + Math.random() * 2.8;         // 1.5–4.3px
      const dur   = 14 + Math.random() * 22;             // 14–36s drift
      const delay = -Math.random() * 30;                 // desync start
      const x     = Math.random() * 100;                 // vw%
      const hue   = [265, 195, 280, 230][i % 4];

      p.style.cssText = `
        position:absolute;
        left:${x}vw;
        bottom:-10px;
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:hsla(${hue},80%,70%,${0.12 + Math.random() * 0.2});
        box-shadow:0 0 ${size * 2}px hsla(${hue},80%,70%,0.3);
        animation: particle-rise ${dur}s ${delay}s ease-in-out infinite;
        will-change: transform, opacity;
      `;
      wrap.appendChild(p);
    }

    // Inject keyframes dynamically so they can vary per particle
    if (!document.getElementById("particle-kf")) {
      const style = document.createElement("style");
      style.id = "particle-kf";
      style.textContent = `
        @keyframes particle-rise {
          0%   { transform: translateY(0)   translateX(0)    scale(1);    opacity: 0; }
          10%  { opacity: 1; }
          50%  { transform: translateY(-45vh) translateX(${Math.random()>0.5?'':'-'}${8+Math.random()*20}px) scale(0.8); }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-100vh) translateX(0) scale(0.4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /* ── 3. Page Entrance — spring stagger ────────────────────── */
  function initPageEntrance() {
    if (typeof anime === "undefined" || prefersReduced) return;

    anime.timeline({ easing: "spring(1, 80, 10, 0)" })
      .add({ targets: ".brand",     translateY: [-28, 0], opacity: [0, 1], duration: 750 })
      .add({ targets: ".lab-badge", translateX: [-18, 0], opacity: [0, 1], duration: 550 }, "-=450")
      .add({ targets: ".info-card", translateY: [18, 0],  opacity: [0, 1],
             delay: anime.stagger(75), duration: 550 }, "-=280")
      .add({ targets: ".flow-step", translateX: [-14, 0], opacity: [0, 1],
             delay: anime.stagger(45), duration: 380 }, "-=180")
      .add({ targets: ".tech-stack", opacity: [0, 1], duration: 380 }, "-=80");

    anime({
      targets: ".right-panel",
      translateX: [36, 0],
      opacity: [0, 1],
      easing: "spring(1, 80, 10, 0)",
      duration: 850,
      delay: 120,
    });
  }

  /* ── 4. Typewriter on AI message text ─────────────────────── */
  function typewriterReveal(bubble) {
    if (prefersReduced) return;
    // Only plain text nodes, skip product cards/HTML-heavy content
    const text = bubble.textContent;
    if (!text || text.length > 400 || bubble.querySelector(".product-card")) return;

    const originalHTML = bubble.innerHTML;
    // Only animate if it's a short conversational reply
    if (bubble.children.length > 2) return;

    bubble.style.minHeight = bubble.offsetHeight + "px";
    bubble.textContent = "";

    let i = 0;
    const speed = Math.max(12, Math.min(28, 3000 / text.length)); // adaptive speed
    function tick() {
      if (i <= text.length) {
        bubble.textContent = text.slice(0, i) + (i < text.length ? "▍" : "");
        i++;
        setTimeout(tick, speed);
      } else {
        bubble.textContent = text; // clean final state
        bubble.style.minHeight = "";
      }
    }
    tick();
  }

  /* ── 5. Send-flight icon animation ───────────────────────── */
  function initSendFlight() {
    const btn = document.getElementById("send-btn");
    if (!btn || typeof anime === "undefined") return;

    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const icon = btn.querySelector(".send-icon");
      if (!icon) return;
      anime({
        targets: icon,
        translateX: [0, 28],
        translateY: [0, -28],
        opacity:    [1, 0],
        scale:      [1, 0.6],
        duration:   320,
        easing:     "easeInCubic",
        complete: () => {
          // Spring back to center
          anime({
            targets: icon,
            translateX: [-28, 0],
            translateY: [28, 0],
            opacity:    [0, 1],
            scale:      [0.6, 1],
            duration:   450,
            easing:     "spring(1, 80, 10, 0)",
          });
        }
      });
    });
  }

  /* ── 6. Magnetic Send Button ──────────────────────────────── */
  function initMagneticButton() {
    const btn = document.getElementById("send-btn");
    if (!btn || prefersReduced) return;

    btn.addEventListener("mousemove", (e) => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.32;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.32;
      btn.style.transform = `translate(${dx}px,${dy}px) scale(1.1)`;
    });

    btn.addEventListener("mouseleave", () => {
      if (typeof anime !== "undefined") {
        anime({ targets: btn, translateX: 0, translateY: 0, scale: 1,
                easing: "spring(1, 80, 10, 0)", duration: 600 });
      } else {
        btn.style.transform = "";
      }
    });
  }

  /* ── 7. Ripple on Quick Chips ─────────────────────────────── */
  function addRipple(e) {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x    = e.clientX - rect.left - size / 2;
    const y    = e.clientY - rect.top  - size / 2;
    const r    = document.createElement("span");
    r.className = "ripple";
    r.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }

  function attachRipples(root) {
    root.querySelectorAll(".quick-chip").forEach(c => {
      if (!c.dataset.ripple) { c.addEventListener("click", addRipple); c.dataset.ripple = "1"; }
    });
  }

  /* ── 8. Animate new messages ──────────────────────────────── */
  function patchMessageAnimation() {
    const area = document.getElementById("messages-area");
    if (!area) return;

    const obs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;

          if (node.classList?.contains("message")) {
            if (!prefersReduced && typeof anime !== "undefined") {
              node.style.opacity = "0";
              anime({
                targets: node,
                opacity:    [0, 1],
                translateY: [16, 0],
                scale:      [0.97, 1],
                easing:     "spring(1, 90, 12, 0)",
                duration:   480,
              });
            }
            // Typewriter on AI messages only
            if (node.classList.contains("ai")) {
              const bubble = node.querySelector(".msg-bubble");
              if (bubble) setTimeout(() => typewriterReveal(bubble), 50);
            }
          }

          if (node.classList?.contains("quick-replies") && !prefersReduced && typeof anime !== "undefined") {
            node.style.opacity = "0";
            const chips = node.querySelectorAll(".quick-chip");
            chips.forEach(c => { c.style.opacity = "0"; });
            anime({
              targets: chips,
              opacity:    [0, 1],
              translateY: [10, 0],
              scale:      [0.88, 1],
              delay:      anime.stagger(55, { start: 90 }),
              easing:     "spring(1, 80, 10, 0)",
              duration:   420,
              begin: () => { node.style.opacity = "1"; },
            });
          }

          attachRipples(node);
        });
      });
    });

    obs.observe(area, { childList: true });
  }

  /* ── 9. Flow-step pulse on class change ───────────────────── */
  function patchFlowStepAnimation() {
    if (typeof anime === "undefined" || prefersReduced) return;

    const obs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === "attributes" && m.attributeName === "class") {
          const el = m.target;
          if (el.classList.contains("active")) {
            anime({ targets: el, translateX: [0, 5, 0], easing: "spring(1, 80, 10, 0)", duration: 500 });
            const num = el.querySelector(".step-num");
            if (num) anime({ targets: num, scale: [1, 1.35, 1], easing: "spring(2, 80, 10, 0)", duration: 380 });
          }
        }
      });
    });

    for (let i = 1; i <= 7; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el) obs.observe(el, { attributes: true });
    }
  }

  /* ── 10. Cursor Glow Trailer ──────────────────────────────── */
  function initCursorGlow() {
    if (prefersReduced) return;
    const dot = document.createElement("div");
    dot.style.cssText = `
      position:fixed; width:280px; height:280px; border-radius:50%;
      background:radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 68%);
      pointer-events:none; z-index:0;
      transform:translate(-50%,-50%); opacity:0; transition:opacity 0.4s ease;
    `;
    document.body.appendChild(dot);
    let mx=0, my=0, cx=0, cy=0;
    document.addEventListener("mousemove", e => { mx=e.clientX; my=e.clientY; dot.style.opacity="1"; });
    document.addEventListener("mouseleave", () => { dot.style.opacity="0"; });
    (function trail() {
      cx += (mx - cx) * 0.09;
      cy += (my - cy) * 0.09;
      dot.style.left = cx + "px";
      dot.style.top  = cy + "px";
      requestAnimationFrame(trail);
    })();
  }

  /* ── 11. Input textarea spring-grow on focus ──────────────── */
  function initInputGrow() {
    const input = document.getElementById("user-input");
    if (!input || typeof anime === "undefined") return;

    input.addEventListener("focus", () => {
      anime({ targets: input, paddingTop: ["8px", "11px"], duration: 300, easing: "easeOutCubic" });
    });
    input.addEventListener("blur", () => {
      if (!input.value) anime({ targets: input, paddingTop: "8px", duration: 300, easing: "easeInCubic" });
    });
  }

  /* ── 12. Progress Ring (SVG arc) ──────────────────────────── */
  function initProgressRing() {
    // Inject a tiny SVG progress ring into chat-header
    const header = document.querySelector(".chat-header-info");
    if (!header) return;

    const size = 36, stroke = 2.5, r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.style.cssText = "position:absolute;top:10px;right:12px;opacity:0.7;";
    svg.setAttribute("aria-hidden", "true");

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", size/2); bg.setAttribute("cy", size/2); bg.setAttribute("r", r);
    bg.setAttribute("fill", "none"); bg.setAttribute("stroke", "rgba(255,255,255,0.06)");
    bg.setAttribute("stroke-width", stroke);

    const arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    arc.setAttribute("cx", size/2); arc.setAttribute("cy", size/2); arc.setAttribute("r", r);
    arc.setAttribute("fill", "none"); arc.setAttribute("stroke", "#A78BFA");
    arc.setAttribute("stroke-width", stroke);
    arc.setAttribute("stroke-linecap", "round");
    arc.setAttribute("stroke-dasharray", circ);
    arc.setAttribute("stroke-dashoffset", circ);
    arc.setAttribute("transform", `rotate(-90 ${size/2} ${size/2})`);
    arc.style.transition = "stroke-dashoffset 0.6s cubic-bezier(0.34,1.2,0.64,1)";

    svg.appendChild(bg); svg.appendChild(arc);
    header.style.position = "relative";
    header.appendChild(svg);

    // Observe flow-step class changes to update ring
    const totalSteps = 7;
    function updateRing() {
      let completed = 0;
      for (let i = 1; i <= totalSteps; i++) {
        const el = document.getElementById(`step-${i}`);
        if (el && (el.classList.contains("completed") || el.classList.contains("active"))) completed++;
      }
      const pct = completed / totalSteps;
      arc.setAttribute("stroke-dashoffset", circ * (1 - pct));
    }

    const obs = new MutationObserver(updateRing);
    for (let i = 1; i <= totalSteps; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el) obs.observe(el, { attributes: true });
    }
  }

  /* ── 13. Char Counter ─────────────────────────────────────── */
  function initCharCounter() {
    const input   = document.getElementById("user-input");
    const wrapper = document.querySelector(".input-wrapper");
    if (!input || !wrapper) return;

    const counter = document.createElement("span");
    counter.className = "char-count";
    counter.setAttribute("aria-live", "polite");
    counter.setAttribute("aria-label", "characters remaining");
    wrapper.appendChild(counter);

    input.addEventListener("input", () => {
      const len  = input.value.length;
      const max  = parseInt(input.getAttribute("maxlength")) || 1000;
      const left = max - len;
      counter.textContent = len > 0 ? String(left) : "";
      counter.className = "char-count" + (left < 100 ? " warn" : "") + (left < 20 ? " limit" : "");
    });
  }

  /* ── 14. Ctrl-btn icon hover spin ────────────────────────── */
  function initCtrlButtons() {
    if (typeof anime === "undefined") return;
    const restart = document.getElementById("btn-restart");
    if (restart) {
      restart.addEventListener("click", () => {
        anime({ targets: restart.querySelector("svg"), rotate: [0, 360],
                easing: "easeOutCubic", duration: 500 });
      });
    }
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    initAurora();
    initParticles();
    initCursorGlow();
    initCharCounter();
    initMagneticButton();
    initSendFlight();
    initInputGrow();
    initProgressRing();
    patchMessageAnimation();
    patchFlowStepAnimation();
    initCtrlButtons();

    if (typeof anime !== "undefined") {
      initPageEntrance();
    } else {
      setTimeout(() => { if (typeof anime !== "undefined") initPageEntrance(); }, 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
