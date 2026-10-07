/* =========================================================
   landing.js - Interaksi kecil di Landing Page
   ========================================================= */

// 1. Menu HP: buka / tutup
const navToggle = document.getElementById("nav-toggle");
const nav = document.getElementById("nav");

navToggle.addEventListener("click", function () {
  const terbuka = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", terbuka);
});

// Tutup menu setelah salah satu link diklik
nav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// 2. Garis bawah header muncul saat halaman di-scroll
const header = document.getElementById("header");
window.addEventListener("scroll", function () {
  header.classList.toggle("scrolled", window.scrollY > 10);
});

// 3. Animasi muncul saat elemen masuk layar
const elemenReveal = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const pengamat = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        pengamat.unobserve(entry.target); // cukup sekali
      }
    });
  }, { threshold: 0.15 });

  elemenReveal.forEach(function (el) { pengamat.observe(el); });
} else {
  // Browser lama: langsung tampilkan semua
  elemenReveal.forEach(function (el) { el.classList.add("visible"); });
}

// 4. Tahun otomatis di footer
document.getElementById("year").textContent = new Date().getFullYear();
