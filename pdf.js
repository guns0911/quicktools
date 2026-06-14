// QuickTools — PDF Tools (client-side via pdf-lib)
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const modeSel = $("pdfMode");
  const dropzone = $("dropzone");
  const fileInput = $("fileInput");
  const dzHint = $("dzHint");
  const fileList = $("fileList");
  const actions = $("actions");
  const runBtn = $("runBtn");
  const clearBtn = $("clearBtn");
  const statusEl = $("status");

  let files = [];

  function accepts() {
    return modeSel.value === "merge" ? ["application/pdf"] : ["image/jpeg", "image/png"];
  }

  function syncMode() {
    if (modeSel.value === "merge") {
      dzHint.textContent = "Select two or more PDF files";
      fileInput.setAttribute("accept", "application/pdf");
    } else {
      dzHint.textContent = "Select one or more images (JPG, PNG)";
      fileInput.setAttribute("accept", "image/jpeg,image/png");
    }
    files = [];
    renderList();
  }
  modeSel.addEventListener("change", syncMode);

  // File selection
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
    const ok = accepts();
    const accepted = Array.from(list).filter((f) => ok.includes(f.type));
    if (!accepted.length) {
      statusEl.textContent = modeSel.value === "merge"
        ? "Please add PDF files."
        : "Please add JPG or PNG images.";
      return;
    }
    files = files.concat(accepted);
    statusEl.textContent = "";
    renderList();
  }

  function renderList() {
    fileList.innerHTML = "";
    files.forEach((f, i) => {
      const li = document.createElement("li");
      li.className = "result-card";
      li.style.flexDirection = "row";
      li.style.alignItems = "center";
      li.style.justifyContent = "space-between";
      li.style.padding = "12px 14px";
      li.innerHTML = `
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          <strong>${i + 1}.</strong> ${escapeHtml(f.name)} <span class="muted">(${formatBytes(f.size)})</span>
        </span>
        <span style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-ghost" data-up="${i}" title="Move up">↑</button>
          <button class="btn btn-ghost" data-down="${i}" title="Move down">↓</button>
          <button class="btn btn-ghost" data-remove="${i}" title="Remove">✕</button>
        </span>`;
      fileList.appendChild(li);
    });
    actions.classList.toggle("hidden", files.length === 0);

    fileList.querySelectorAll("[data-remove]").forEach((b) =>
      b.addEventListener("click", () => { files.splice(+b.dataset.remove, 1); renderList(); })
    );
    fileList.querySelectorAll("[data-up]").forEach((b) =>
      b.addEventListener("click", () => move(+b.dataset.up, -1))
    );
    fileList.querySelectorAll("[data-down]").forEach((b) =>
      b.addEventListener("click", () => move(+b.dataset.down, 1))
    );
  }

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= files.length) return;
    [files[i], files[j]] = [files[j], files[i]];
    renderList();
  }

  clearBtn.addEventListener("click", () => {
    files = [];
    statusEl.textContent = "";
    fileInput.value = "";
    renderList();
  });

  runBtn.addEventListener("click", async () => {
    if (!files.length) return;
    if (typeof PDFLib === "undefined") {
      statusEl.textContent = "PDF library could not load. Check your internet connection.";
      return;
    }
    runBtn.disabled = true;
    statusEl.textContent = "Working...";
    try {
      const blob = modeSel.value === "merge" ? await mergePdfs() : await imagesToPdf();
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "quicktools.pdf");
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      statusEl.textContent = "Done! Your PDF has been downloaded.";
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Something went wrong: " + (err.message || err);
    } finally {
      runBtn.disabled = false;
    }
  });

  async function mergePdfs() {
    const { PDFDocument } = PDFLib;
    const out = await PDFDocument.create();
    for (const f of files) {
      const bytes = await f.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    const data = await out.save();
    return new Blob([data], { type: "application/pdf" });
  }

  async function imagesToPdf() {
    const { PDFDocument } = PDFLib;
    const out = await PDFDocument.create();
    for (const f of files) {
      const bytes = await f.arrayBuffer();
      const img = f.type === "image/png"
        ? await out.embedPng(bytes)
        : await out.embedJpg(bytes);
      const page = out.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    const data = await out.save();
    return new Blob([data], { type: "application/pdf" });
  }

  function triggerDownload(url, name) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
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

  syncMode();
})();
