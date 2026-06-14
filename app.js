// QuickTools — Image Tool (runs entirely in the browser)
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const dropzone = $("dropzone");
  const fileInput = $("fileInput");
  const modeSel = $("mode");
  const formatSel = $("format");
  const quality = $("quality");
  const qualityVal = $("qualityVal");
  const maxWidth = $("maxWidth");
  const maxHeight = $("maxHeight");
  const actions = $("actions");
  const processBtn = $("processBtn");
  const downloadAllBtn = $("downloadAllBtn");
  const clearBtn = $("clearBtn");
  const results = $("results");

  let files = [];      // selected original File objects
  let processed = [];  // { name, blob, url, originalSize }

  $("year").textContent = new Date().getFullYear();

  // --- Control visibility (show/hide fields based on operation) ---
  function updateControlVisibility() {
    const mode = modeSel.value;
    document.querySelectorAll(".control[data-show]").forEach((el) => {
      const shows = el.getAttribute("data-show").split(" ");
      el.classList.toggle("hidden", !shows.includes(mode));
    });
  }
  modeSel.addEventListener("change", updateControlVisibility);
  updateControlVisibility();

  quality.addEventListener("input", () => {
    qualityVal.textContent = quality.value + "%";
  });

  // --- File selection ---
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", () => addFiles(fileInput.files));

  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); })
  );
  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  function addFiles(list) {
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    files = files.concat(imgs);
    actions.classList.remove("hidden");
    renderPreview();
  }

  function renderPreview() {
    results.innerHTML = "";
    files.forEach((f, i) => {
      const card = document.createElement("div");
      card.className = "result-card";
      const url = URL.createObjectURL(f);
      card.innerHTML = `
        <img src="${url}" alt="${escapeHtml(f.name)}" loading="lazy" />
        <div class="result-body">
          <div class="result-name">${escapeHtml(f.name)}</div>
          <div class="result-stats">${formatBytes(f.size)} · waiting to be processed</div>
          <button class="btn btn-ghost" data-remove="${i}">Remove</button>
        </div>`;
      results.appendChild(card);
    });
    results.querySelectorAll("[data-remove]").forEach((btn) =>
      btn.addEventListener("click", () => {
        files.splice(Number(btn.dataset.remove), 1);
        if (!files.length) actions.classList.add("hidden");
        renderPreview();
      })
    );
  }

  // --- Processing ---
  processBtn.addEventListener("click", async () => {
    if (!files.length) return;
    processBtn.disabled = true;
    processBtn.textContent = "Processing...";
    revokeProcessed();
    processed = [];
    results.innerHTML = "";

    for (const file of files) {
      try {
        const out = await processImage(file);
        processed.push(out);
        appendResultCard(out);
      } catch (err) {
        console.error(err);
        appendErrorCard(file, err);
      }
    }

    downloadAllBtn.disabled = processed.length === 0;
    processBtn.disabled = false;
    processBtn.textContent = "Process again";
  });

  async function processImage(file) {
    const mode = modeSel.value;
    const img = await loadImage(file);
    let { width, height } = img;

    if (mode === "resize") {
      const mw = parseInt(maxWidth.value, 10);
      const mh = parseInt(maxHeight.value, 10);
      const scale = Math.min(
        mw ? mw / width : Infinity,
        mh ? mh / height : Infinity,
        1 // never upscale beyond original
      );
      if (scale !== Infinity && scale < 1) {
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    // Output format: convert/compress -> selected; resize -> keep original type
    let outType;
    if (mode === "resize") {
      outType = file.type === "image/png" ? "image/png" : "image/jpeg";
    } else {
      outType = formatSel.value;
    }

    const q = Math.max(0.1, Math.min(1, Number(quality.value) / 100));
    const blob = await canvasToBlob(canvas, outType, outType === "image/png" ? undefined : q);

    URL.revokeObjectURL(img.src);
    const newName = renameForType(file.name, outType);
    return { name: newName, blob, url: URL.createObjectURL(blob), originalSize: file.size };
  }

  function appendResultCard(out) {
    const diff = out.originalSize - out.blob.size;
    const pct = out.originalSize ? Math.round((diff / out.originalSize) * 100) : 0;
    const savingText = diff > 0
      ? `<span class="saving">${pct}% smaller</span>`
      : `<span>size: unchanged/larger</span>`;
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <img src="${out.url}" alt="${escapeHtml(out.name)}" loading="lazy" />
      <div class="result-body">
        <div class="result-name">${escapeHtml(out.name)}</div>
        <div class="result-stats">
          ${formatBytes(out.originalSize)} → <strong>${formatBytes(out.blob.size)}</strong><br>${savingText}
        </div>
        <a class="btn btn-primary" href="${out.url}" download="${escapeHtml(out.name)}">Download</a>
      </div>`;
    results.appendChild(card);
  }

  function appendErrorCard(file, err) {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <div class="result-body">
        <div class="result-name">${escapeHtml(file.name)}</div>
        <div class="result-stats" style="color:var(--danger)">Could not process: ${escapeHtml(String(err.message || err))}</div>
      </div>`;
    results.appendChild(card);
  }

  downloadAllBtn.addEventListener("click", () => {
    processed.forEach((out, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = out.url;
        a.download = out.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 250); // stagger to bypass the browser's multi-download block
    });
  });

  clearBtn.addEventListener("click", () => {
    files = [];
    revokeProcessed();
    processed = [];
    results.innerHTML = "";
    actions.classList.add("hidden");
    downloadAllBtn.disabled = true;
    fileInput.value = "";
    processBtn.textContent = "Process";
  });

  // --- Helpers ---
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = URL.createObjectURL(file);
    });
  }

  function canvasToBlob(canvas, type, q) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Conversion failed"))),
        type,
        q
      );
    });
  }

  function renameForType(name, type) {
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[type] || "img";
    const base = name.replace(/\.[^.]+$/, "");
    return `${base}-quicktools.${ext}`;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(i ? 1 : 0) + " " + sizes[i];
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function revokeProcessed() {
    processed.forEach((p) => URL.revokeObjectURL(p.url));
  }
})();
