// QuickTools — shared helpers (year stamp + active nav highlight)
(function () {
  "use strict";
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Highlight the current page in the nav
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "index.html" && (href === "./" || href === "index.html"))) {
      a.classList.add("active");
    }
  });
})();
