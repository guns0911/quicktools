// QuickTools — QR Code Generator (client-side via the qrcode library)
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const text = $("qrText");
  const size = $("qrSize");
  const sizeVal = $("qrSizeVal");
  const ecc = $("qrEcc");
  const fg = $("qrFg");
  const bg = $("qrBg");
  const canvas = $("qrCanvas");
  const errEl = $("qrError");
  const dlPng = $("downloadPng");
  const dlSvg = $("downloadSvg");

  let ready = false;

  function options() {
    return {
      width: Number(size.value),
      margin: 2,
      errorCorrectionLevel: ecc.value,
      color: { dark: fg.value, light: bg.value },
    };
  }

  function render() {
    const value = text.value.trim();
    sizeVal.textContent = size.value + "px";

    if (typeof QRCode === "undefined") {
      errEl.textContent = "QR library could not load. Check your internet connection.";
      return;
    }
    if (!value) {
      errEl.textContent = "Enter some text or a link to generate a QR code.";
      ready = false;
      dlPng.disabled = dlSvg.disabled = true;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    QRCode.toCanvas(canvas, value, options(), (err) => {
      if (err) {
        errEl.textContent = "Could not generate QR code: " + err.message;
        ready = false;
        dlPng.disabled = dlSvg.disabled = true;
        return;
      }
      errEl.textContent = "";
      ready = true;
      dlPng.disabled = dlSvg.disabled = false;
    });
  }

  // Live update (debounced for typing)
  let t;
  const debounced = () => { clearTimeout(t); t = setTimeout(render, 150); };
  [text].forEach((el) => el.addEventListener("input", debounced));
  [size, ecc, fg, bg].forEach((el) => el.addEventListener("input", render));

  dlPng.addEventListener("click", () => {
    if (!ready) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "qrcode-quicktools.png");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  });

  dlSvg.addEventListener("click", () => {
    if (!ready) return;
    QRCode.toString(text.value.trim(), { type: "svg", ...options() }, (err, svg) => {
      if (err) return;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "qrcode-quicktools.svg");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });

  function triggerDownload(url, name) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Initial render once the library is available
  if (typeof QRCode !== "undefined") {
    render();
  } else {
    window.addEventListener("load", render);
  }
})();
