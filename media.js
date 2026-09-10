/* Optional portfolio media. Use local file paths or direct HTTPS media URLs.
   Leave src empty to keep the original card. Instagram page URLs aren't video files.
   Images: { src: "images/filename.jpg", alt: "Describe the photograph" }
   Videos: { src: "videos/filename.mp4", start: 0, length: 8 }
   Choose a short H.264 MP4 export for broad browser compatibility. */
const portfolioMedia = {
  images: {
    poliwhanm: { src: "images/poliwhanm-pcb.png", alt: "3D rendering of the PoliWhanm wah pedal circuit board" },
    raive: { src: "images/raive.jpg", alt: "RAIVE AI Summer School" },
    commedia: { src: "", alt: "Commed’IA project from RAIVE" }
  },
  videos: {
    lens: { src: "videos/the-lens-preview.mp4", start: 0, length: 8 },
    crickets: { src: "", start: 0, length: 8 },
    jukebox: { src: "", start: 0, length: 8 },
    inktober: { src: "videos/inktober-preview.mp4", start: 0, length: 8 }
  }
};

for (const card of document.querySelectorAll("[data-image-key]")) {
  if (card.querySelector(".card-photo")) continue;
  const media = portfolioMedia.images[card.dataset.imageKey];
  if (!media?.src) continue;
  const photo = document.createElement("img");
  photo.className = "card-photo";
  photo.alt = media.alt;
  photo.loading = "lazy";
  photo.decoding = "async";
  photo.addEventListener("load", () => card.classList.add("has-photo"));
  photo.addEventListener("error", () => {
    photo.remove();
    card.classList.remove("has-photo");
  });
  card.prepend(photo);
  photo.src = media.src;
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const previews = [];
for (const card of document.querySelectorAll("[data-video-key]")) {
  const media = portfolioMedia.videos[card.dataset.videoKey];
  if (!media?.src) continue;
  const link = card.querySelector(".canvas-project-link");
  const title = card.querySelector("strong").textContent;
  const video = document.createElement("video");
  video.className = "canvas-preview";
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = "none";
  video.setAttribute("aria-hidden", "true");
  const badge = document.createElement("span");
  badge.className = "canvas-preview-badge";
  badge.textContent = "Hover to preview";
  badge.setAttribute("aria-hidden", "true");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "canvas-preview-toggle";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", `Play muted preview of ${title}`);
  button.textContent = "▶ Preview";
  card.append(video, badge, button);
  let active = false;
  let failed = false;
  let hovering = false;
  let focused = false;
  let request = 0;
  let start = Math.max(0, Number(media.start) || 0);
  const stop = () => {
    request++;
    active = false;
    video.pause();
    card.classList.remove("is-previewing");
    badge.textContent = "Hover to preview";
    button.textContent = "▶ Preview";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `Play muted preview of ${title}`);
  };
  const play = async (manual = false) => {
    if (failed || (!manual && reducedMotion.matches) || document.hidden) return;
    if (active) return;
    previews.forEach(preview => { if (preview.card !== card) preview.stop(); });
    active = true;
    const token = ++request;
    button.textContent = "Loading…";
    if (!video.getAttribute("src")) video.src = media.src;
    try {
      if (video.readyState >= 1) video.currentTime = start;
      await video.play();
      if (token !== request && !active) video.pause();
    } catch { if (token === request) stop(); }
  };
  video.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(video.duration)) start = Math.min(start, Math.max(0, video.duration - 0.1));
    video.currentTime = start;
  });
  video.addEventListener("playing", () => {
    if (!active) { video.pause(); return; }
    card.classList.add("is-previewing");
    badge.textContent = "Preview · muted";
    button.textContent = "Ⅱ Pause";
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", `Pause preview of ${title}`);
  });
  video.addEventListener("timeupdate", () => {
    if (active && video.currentTime >= start + Math.max(1, Number(media.length) || 8)) video.currentTime = start;
  });
  video.addEventListener("ended", () => {
    if (!active) return;
    video.currentTime = start;
    video.play().catch(stop);
  });
  video.addEventListener("error", () => {
    failed = true;
    stop();
    badge.remove();
    button.textContent = "Preview unavailable";
    button.setAttribute("aria-label", `Preview unavailable for ${title}`);
    button.disabled = true;
  });
  button.addEventListener("click", () => active ? stop() : play(true));
  card.addEventListener("pointerenter", () => { if (hoverPointer.matches) { hovering = true; play(); } });
  card.addEventListener("pointerleave", () => { if (!hoverPointer.matches) return; hovering = false; if (!focused) stop(); });
  link.addEventListener("focus", () => { focused = link.matches(":focus-visible"); if (focused) play(); });
  link.addEventListener("blur", () => { focused = false; if (!hovering) stop(); });
  card.addEventListener("keydown", event => { if (event.key === "Escape") stop(); });
  previews.push({ card, stop });
}
document.addEventListener("visibilitychange", () => { if (document.hidden) previews.forEach(p => p.stop()); });
reducedMotion.addEventListener("change", () => previews.forEach(p => p.stop()));
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (!entry.isIntersecting) previews.find(p => p.card === entry.target)?.stop();
  });
  previews.forEach(p => observer.observe(p.card));
}
