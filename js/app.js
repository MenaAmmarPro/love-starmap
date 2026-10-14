"use strict";

/*
 * love-starmap — a real (if small) map of the night sky.
 *
 * Stars come from js/stars-data.js. For the chosen date, time (UTC), and
 * observing location, we compute the Local Sidereal Time, turn each star's
 * RA/Dec into altitude/azimuth, and draw the sky you would actually see
 * looking straight up. Points below the horizon fade out.
 *
 * Edit the two blocks below to make it *ours*.
 */

/* ---------------- make it ours ---------------- */

/* Where the sky is drawn from by default. */
const DEFAULT_LOCATION = {
  name: "wherever we are",
  lat: 51.5074,
  lon: -0.1278
};

/* The star we call ours (an id from js/stars-data.js — try "vega"). */
const OUR_STAR_ID = "vega";
const OUR_STAR_MESSAGE =
  "Every time you find this one, I hope you hear me saying it: you are my favourite star.";

/* ------------------------------------------------ */

(function () {
  const STARS = Array.isArray(window.MENA_STARS) ? window.MENA_STARS : [];
  const CONSTELLATIONS = Array.isArray(window.MENA_CONSTELLATIONS) ? window.MENA_CONSTELLATIONS : [];
  const STORE_KEY = "mena-star-wishes";

  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;

  /* ---------- astronomy ---------- */
  function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function gmstDeg(date) {
    const jd = julianDate(date);
    const t = (jd - 2451545.0) / 36525;
    let gmst =
      280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * t * t -
      (t * t * t) / 38710000;
    return ((gmst % 360) + 360) % 360;
  }

  function lstDeg(date, lon) {
    return (((gmstDeg(date) + lon) % 360) + 360) % 360;
  }

  function altAz(star, lat, lon, date) {
    const ra = star.ra * 15;
    const H = (lstDeg(date, lon) - ra) * D2R;
    const dec = star.dec * D2R;
    const latR = lat * D2R;
    const sinAlt = Math.sin(dec) * Math.sin(latR) + Math.cos(dec) * Math.cos(latR) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    const az = Math.atan2(
      -Math.cos(dec) * Math.sin(H),
      Math.sin(dec) * Math.cos(latR) - Math.cos(dec) * Math.sin(latR) * Math.cos(H)
    );
    return { alt: alt * R2D, az: ((az * R2D) % 360 + 360) % 360 };
  }

  function project(alt, az, cx, cy, radius) {
    const r = ((90 - alt) / 90) * radius;
    const a = az * D2R;
    return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a), r: r };
  }

  window.MenaStarMap = {
    julianDate: julianDate,
    gmstDeg: gmstDeg,
    lstDeg: lstDeg,
    altAz: altAz,
    project: project,
    STARS: STARS,
    CONSTELLATIONS: CONSTELLATIONS
  };

  /* ---------- state ---------- */
  let location = loadLocation();
  let wishes = loadWishes();
  let showConstellations = true;
  let hovered = null;
  let pinned = null;
  let starsScreen = [];
  let lastSize = { w: 0, h: 0 };

  function loadLocation() {
    try {
      const raw = window.localStorage.getItem("mena-star-location");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        return { name: parsed.name || "chosen spot", lat: parsed.lat, lon: parsed.lon };
      }
    } catch {
      /* fall through */
    }
    return { name: DEFAULT_LOCATION.name, lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon };
  }

  function saveLocation() {
    try {
      window.localStorage.setItem("mena-star-location", JSON.stringify(location));
    } catch {
      /* location still works for this visit */
    }
  }

  function loadWishes() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((w) => w && typeof w.text === "string") : [];
    } catch {
      return [];
    }
  }

  function saveWishes() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(wishes));
    } catch {
      /* wishes still work for this visit */
    }
  }

  /* ---------- DOM ---------- */
  const els = {};

  function cacheEls() {
    [
      "sky", "star-info", "star-name", "star-meta", "star-note",
      "obs-date", "obs-time", "obs-now", "obs-lat", "obs-lon", "obs-locname",
      "wish-form", "wish-text", "wish-list", "wish-status", "const-toggle"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function makeDate() {
    const date = els["obs-date"] && els["obs-date"].value ? els["obs-date"].value : "2026-01-01";
    const time = els["obs-time"] && els["obs-time"].value ? els["obs-time"].value : "21:00";
    const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const tm = /^(\d{1,2}):(\d{2})$/.exec(time);
    const y = dm ? Number(dm[1]) : 2026;
    const mo = dm ? Number(dm[2]) : 1;
    const d = dm ? Number(dm[3]) : 1;
    const hh = tm ? Number(tm[1]) : 21;
    const mm = tm ? Number(tm[2]) : 0;
    return new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
  }

  /* ---------- rendering ---------- */
  function sizeCanvas() {
    const canvas = els["sky"];
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: 0 };
    const cssW = Math.max(280, Math.round(rect.width || canvas.parentNode && canvas.parentNode.clientWidth || 320));
    const cssH = Math.round(cssW * 0.72);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx && ctx.setTransform) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastSize = { w: cssW, h: cssH };
    return { ctx: ctx, w: cssW, h: cssH };
  }

  function buildStars(date) {
    const list = [];
    STARS.forEach((star) => {
      const aa = altAz(star, location.lat, location.lon, date);
      list.push({ star: star, alt: aa.alt, az: aa.az });
    });
    return list;
  }

  function draw() {
    const canvas = els["sky"];
    if (!canvas) return;
    const surface = sizeCanvas();
    if (!surface || !surface.ctx) return;
    const ctx = surface.ctx;
    const w = surface.w;
    const h = surface.h;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 18;
    const date = makeDate();

    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createRadialGradient(cx, cy, 8, cx, cy, radius + 20);
    bg.addColorStop(0, "#141a3d");
    bg.addColorStop(0.7, "#0a0d24");
    bg.addColorStop(1, "#05060f");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2);
    ctx.fill();

    /* horizon + cardinals */
    ctx.strokeStyle = "rgba(255,159,207,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    drawCardinals(ctx, cx, cy, radius);

    const sky = buildStars(date);
    starsScreen = [];

    /* constellation lines */
    if (showConstellations) {
      drawConstellations(ctx, sky, cx, cy, radius);
    }

    /* stars */
    const now = performance.now ? performance.now() : Date.now();
    sky.forEach((entry) => {
      const p = project(entry.alt, entry.az, cx, cy, radius);
      const above = entry.alt >= -2;
      const isOurs = entry.star.id === OUR_STAR_ID;
      const twinkle = above ? 0.72 + 0.28 * Math.abs(Math.sin(now / 620 + entry.star.ra)) : 0.18;
      const size = Math.max(0.8, 2.6 - Math.max(-1.5, Math.min(4, entry.star.mag)) * 0.42);
      drawStar(ctx, p.x, p.y, size, twinkle, above, isOurs);
      if (isOurs) {
        ctx.font = "600 12px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,224,242,0.95)";
        ctx.textAlign = "center";
        ctx.fillText("ours \u2665", p.x, p.y - 12);
      }
      starsScreen.push({ x: p.x, y: p.y, star: entry.star, alt: entry.alt, az: entry.az, above: above });
    });

    /* wish stars */
    wishes.forEach((wish, i) => {
      const p = wishPoint(i, cx, cy, radius);
      drawWishStar(ctx, p.x, p.y, now);
    });

    requestAnimationFrame(draw);
  }

  function drawCardinals(ctx, cx, cy, radius) {
    const marks = [
      { a: 0, t: "N" },
      { a: 90, t: "E" },
      { a: 180, t: "S" },
      { a: 270, t: "W" }
    ];
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillStyle = "rgba(200,210,255,0.75)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    marks.forEach((m) => {
      const a = m.a * D2R;
      const x = cx + radius * Math.sin(a);
      const y = cy - radius * Math.cos(a);
      ctx.fillText(m.t, x, y);
    });
  }

  function drawConstellations(ctx, sky, cx, cy, radius) {
    const byId = {};
    sky.forEach((entry) => { byId[entry.star.id] = project(entry.alt, entry.az, cx, cy, radius); });
    ctx.strokeStyle = "rgba(140,165,255,0.28)";
    ctx.lineWidth = 1;
    CONSTELLATIONS.forEach((con) => {
      con.segments.forEach((seg) => {
        const a = byId[seg[0]];
        const b = byId[seg[1]];
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    });
  }

  function drawStar(ctx, x, y, size, alpha, above, isOurs) {
    if (!above) return;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
    const core = isOurs ? "255,170,215" : "255,255,255";
    glow.addColorStop(0, "rgba(" + core + "," + (0.95 * alpha) + ")");
    glow.addColorStop(0.4, "rgba(" + core + "," + (0.28 * alpha) + ")");
    glow.addColorStop(1, "rgba(" + core + ",0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(" + core + "," + alpha + ")";
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    if (isOurs) {
      ctx.strokeStyle = "rgba(255,159,207,0.9)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, size * 2.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function wishPoint(i, cx, cy, radius) {
    const seed = (i * 2654435761) % 1000 / 1000;
    const ang = seed * Math.PI * 2;
    const dist = (0.25 + 0.7 * ((seed * 7) % 1)) * radius * 0.92;
    return { x: cx + dist * Math.sin(ang), y: cy - dist * Math.cos(ang) };
  }

  function drawWishStar(ctx, x, y, now) {
    const tw = 0.6 + 0.4 * Math.abs(Math.sin(now / 700 + x));
    ctx.fillStyle = "rgba(255,214,245," + tw + ")";
    ctx.beginPath();
    for (let k = 0; k < 4; k += 1) {
      const a = (k * Math.PI) / 2;
      const rr = k % 2 === 0 ? 6 : 2.4;
      const px = x + rr * Math.cos(a);
      const py = y + rr * Math.sin(a);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ---------- interaction ---------- */
  function nearestStar(x, y) {
    let best = null;
    let bestDist = Infinity;
    starsScreen.forEach((entry) => {
      if (!entry.above) return;
      const dx = entry.x - x;
      const dy = entry.y - y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist && dist <= 20 * 20) {
        bestDist = dist;
        best = entry;
      }
    });
    return best;
  }

  function showStar(entry) {
    if (!entry) return;
    const isOurs = entry.star.id === OUR_STAR_ID;
    if (els["star-name"]) els["star-name"].textContent = entry.star.name + (isOurs ? " \u2014 ours \u2665" : "");
    if (els["star-meta"]) {
      els["star-meta"].textContent =
        "alt " + entry.alt.toFixed(1) + "\u00b0  \u00b7  az " + entry.az.toFixed(0) + "\u00b0  \u00b7  mag " + entry.star.mag;
    }
    if (els["star-note"]) {
      els["star-note"].textContent = isOurs ? OUR_STAR_MESSAGE : "";
    }
  }

  function clearInfo() {
    if (els["star-name"]) els["star-name"].textContent = "Tap a star";
    if (els["star-meta"]) els["star-meta"].textContent = "Find your way around \u2014 N is up.";
    if (els["star-note"]) els["star-note"].textContent = "";
  }

  /* ---------- wishes ---------- */
  function renderWishes() {
    if (!els["wish-list"]) return;
    els["wish-list"].textContent = "";
    wishes.forEach((wish) => {
      const li = document.createElement("li");
      li.className = "wish-item";
      const star = document.createElement("span");
      star.className = "wish-star";
      star.textContent = "✦";
      const text = document.createElement("span");
      text.className = "wish-text";
      text.textContent = wish.text;
      li.appendChild(star);
      li.appendChild(text);
      els["wish-list"].appendChild(li);
    });
  }

  function addWish(event) {
    if (event) event.preventDefault();
    const text = els["wish-text"] ? els["wish-text"].value.trim() : "";
    if (!text) {
      setStatus("Whisper a wish first \u2665");
      return;
    }
    wishes.push({ text: text });
    saveWishes();
    if (els["wish-text"]) els["wish-text"].value = "";
    renderWishes();
    setStatus("Hung your wish in the sky \u2726");
  }

  function setStatus(message) {
    if (els["wish-status"]) els["wish-status"].textContent = message || "";
  }

  /* ---------- controls ---------- */
  function applyLocationFromInputs() {
    const lat = parseFloat(els["obs-lat"] && els["obs-lat"].value);
    const lon = parseFloat(els["obs-lon"] && els["obs-lon"].value);
    if (!Number.isNaN(lat) && !Number.isNaN(lon) && lat >= -90 && lat <= 90) {
      location = { name: (els["obs-locname"] && els["obs-locname"].value.trim()) || "chosen spot", lat: lat, lon: lon };
      saveLocation();
    }
  }

  function initControls() {
    const now = new Date();
    if (els["obs-date"] && !els["obs-date"].value) {
      els["obs-date"].value = now.toISOString().slice(0, 10);
    }
    if (els["obs-time"] && !els["obs-time"].value) {
      els["obs-time"].value = now.toISOString().slice(11, 16);
    }
    if (els["obs-lat"]) els["obs-lat"].value = location.lat;
    if (els["obs-lon"]) els["obs-lon"].value = location.lon;
    if (els["obs-locname"]) els["obs-locname"].value = location.name;

    if (els["obs-now"]) {
      els["obs-now"].addEventListener("click", () => {
        const n = new Date();
        if (els["obs-date"]) els["obs-date"].value = isoDate(n);
        if (els["obs-time"]) els["obs-time"].value = pad(n.getUTCHours()) + ":" + pad(n.getUTCMinutes());
        draw();
      });
    }
    ["obs-date", "obs-time", "obs-lat", "obs-lon"].forEach((id) => {
      if (els[id]) els[id].addEventListener("change", () => { applyLocationFromInputs(); draw(); });
    });
    if (els["obs-locname"]) els["obs-locname"].addEventListener("input", () => { applyLocationFromInputs(); });
    if (els["const-toggle"]) {
      els["const-toggle"].checked = showConstellations;
      els["const-toggle"].addEventListener("change", () => {
        showConstellations = els["const-toggle"].checked;
      });
    }
  }

  function pad(n) { return String(n).padStart(2, "0"); }
  function isoDate(d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }

  function initCanvasEvents() {
    const canvas = els["sky"];
    if (!canvas || !canvas.addEventListener) return;
    canvas.addEventListener("mousemove", (ev) => {
      const pos = pointerFromEvent(canvas, ev);
      const entry = nearestStar(pos.x, pos.y);
      hovered = entry;
      if (entry) showStar(entry);
      else if (!pinned) clearInfo();
    });
    canvas.addEventListener("mouseleave", () => {
      hovered = null;
      if (!pinned) clearInfo();
    });
    canvas.addEventListener("click", (ev) => {
      const pos = pointerFromEvent(canvas, ev);
      const entry = nearestStar(pos.x, pos.y);
      if (entry) {
        pinned = entry;
        showStar(entry);
      }
    });
    canvas.addEventListener("touchstart", (ev) => {
      const touch = ev.touches && ev.touches[0];
      if (!touch) return;
      const pos = pointerFromEvent(canvas, touch);
      const entry = nearestStar(pos.x, pos.y);
      if (entry) { pinned = entry; showStar(entry); }
    }, { passive: true });
  }

  function pointerFromEvent(canvas, ev) {
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: lastSize.w, height: lastSize.h };
    const scaleX = lastSize.w && rect.width ? lastSize.w / rect.width : 1;
    const scaleY = lastSize.h && rect.height ? lastSize.h / rect.height : 1;
    return { x: (ev.clientX - rect.left) * scaleX, y: (ev.clientY - rect.top) * scaleY };
  }

  function init() {
    cacheEls();
    initControls();
    initCanvasEvents();
    renderWishes();
    clearInfo();
    if (els["wish-form"]) els["wish-form"].addEventListener("submit", addWish);
    if (window.addEventListener) {
      window.addEventListener("resize", () => { draw(); });
    }
    draw();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => {});
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
