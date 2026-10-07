/* =========================================================
   app.js - "Otak" aplikasi
   Mengatur navigasi menu dan menjalankan semua modul.
   File ini dimuat PALING AKHIR, setelah semua modul.
   ========================================================= */

// Daftar halaman: nama -> judul + fungsi untuk menampilkan isinya
const PAGES = {
  dashboard:  { title: "Dashboard",                  render: renderDashboard },
  products:   { title: "Produk",                     render: renderProducts },
  calculator: { title: "Kalkulator HPP & Harga Jual", render: renderCalculator },
  invoice:    { title: "Invoice / Nota",             render: renderInvoice },
  cashbook:   { title: "Buku Kas",                   render: renderCashbook },
  reports:    { title: "Laporan",                    render: renderReports },
  settings:   { title: "Pengaturan",                 render: renderSettings }
};

let currentPage = "dashboard";

/** Menampilkan satu halaman dan menyembunyikan yang lain. */
function showPage(nama) {
  if (!PAGES[nama]) nama = "dashboard";
  currentPage = nama;

  document.querySelectorAll(".page").forEach(function (page) {
    page.classList.toggle("active", page.id === "page-" + nama);
  });
  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.classList.toggle("active", link.dataset.page === nama);
  });

  setText("page-title", PAGES[nama].title);
  PAGES[nama].render();   // isi ulang data terbaru
  closeSidebar();
  window.scrollTo(0, 0);
}

/** Pindah halaman lewat alamat (#products, #invoice, dst). */
function goTo(nama) {
  if (location.hash === "#" + nama) {
    showPage(nama);      // hash sama -> tampilkan ulang saja
  } else {
    location.hash = nama; // memicu event "hashchange"
  }
}

/** Menampilkan ulang halaman yang sedang aktif (setelah data berubah). */
function refreshCurrentPage() {
  PAGES[currentPage].render();
}

/* ---------- Sidebar untuk HP ---------- */
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

/* ---------- Mulai aplikasi ---------- */
document.addEventListener("DOMContentLoaded", function () {
  // 1. Pasang event listener setiap modul (cukup sekali)
  initProducts();
  initCalculator();
  initInvoice();
  initCashbook();
  initReports();
  initSettings();

  // 2. Navigasi sidebar
  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      goTo(link.dataset.page);
    });
  });

  // 3. Tombol pintasan (data-goto) di Dashboard
  document.addEventListener("click", function (event) {
    const tombol = event.target.closest("[data-goto]");
    if (tombol) goTo(tombol.dataset.goto);
  });

  // 4. Menu HP
  document.getElementById("menu-toggle").addEventListener("click", openSidebar);
  document.getElementById("overlay").addEventListener("click", closeSidebar);

  // 5. Menutup modal: tombol [data-close], klik area gelap, atau tombol Esc
  document.querySelectorAll(".modal").forEach(function (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal || event.target.closest("[data-close]")) {
        modal.classList.remove("open");
      }
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeAllModals();
  });

  // 6. Saat alamat (#hash) berubah -> ganti halaman
  window.addEventListener("hashchange", function () {
    showPage(location.hash.slice(1));
  });

  // 7. Peringatan jika LocalStorage diblokir browser
  if (penyimpanan.sementara) {
    document.querySelector(".sidebar-footer").textContent =
      "Peringatan: penyimpanan browser diblokir. Data hilang saat halaman ditutup.";
  }

  // 8. Tampilan awal
  updateBrand();
  resetFormInvoice();
  showPage(location.hash.slice(1) || "dashboard");
});
