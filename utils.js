/* =========================================================
   utils.js - Fungsi kecil yang dipakai banyak modul
   ========================================================= */

/**
 * Mengubah angka menjadi format Rupiah.
 * Contoh: formatRupiah(150000) -> "Rp 150.000"
 */
function formatRupiah(angka) {
  const nilai = Math.round(Number(angka) || 0);
  const tanda = nilai < 0 ? "-" : "";
  return tanda + "Rp " + Math.abs(nilai).toLocaleString("id-ID");
}

/**
 * Mengubah teks tanggal "2026-10-06" menjadi "6 Oktober 2026".
 */
function formatTanggal(teksTanggal) {
  if (!teksTanggal) return "-";
  const tanggal = new Date(teksTanggal + "T00:00:00");
  if (isNaN(tanggal)) return teksTanggal;
  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/**
 * Mengubah "2026-10" menjadi "Oktober 2026".
 */
function formatBulan(teksBulan) {
  if (!teksBulan) return "Semua waktu";
  const tanggal = new Date(teksBulan + "-01T00:00:00");
  return tanggal.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/**
 * Menghasilkan tanggal hari ini dalam format "YYYY-MM-DD"
 * (format yang dipakai oleh <input type="date">).
 */
function hariIni() {
  const d = new Date();
  const tahun = d.getFullYear();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return tahun + "-" + bulan + "-" + hari;
}

/**
 * Membuat ID unik sederhana, contoh: "lq2x8k3a9f1"
 * Gabungan waktu sekarang + angka acak, jadi hampir mustahil kembar.
 */
function buatId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Mengamankan teks sebelum dimasukkan ke HTML.
 * Tanpa ini, jika user mengetik "<b>" di nama produk,
 * browser akan menganggapnya sebagai kode HTML.
 */
function escapeHTML(teks) {
  return String(teks === undefined || teks === null ? "" : teks)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Mengisi teks pada elemen berdasarkan id. */
function setText(id, teks) {
  const el = document.getElementById(id);
  if (el) el.textContent = teks;
}

/**
 * Menghitung total pemasukan, pengeluaran, dan keuntungan
 * dari daftar catatan kas. Dipakai Dashboard, Buku Kas, Laporan.
 */
function hitungRingkasanKas(daftarKas) {
  let pemasukan = 0;
  let pengeluaran = 0;

  daftarKas.forEach(function (kas) {
    if (kas.tipe === "masuk") {
      pemasukan += Number(kas.nominal) || 0;
    } else {
      pengeluaran += Number(kas.nominal) || 0;
    }
  });

  return {
    pemasukan: pemasukan,
    pengeluaran: pengeluaran,
    keuntungan: pemasukan - pengeluaran
  };
}

/**
 * Mengurutkan data dari yang terbaru (berdasarkan tanggal,
 * lalu waktu dibuat). Mengembalikan array baru.
 */
function urutkanTerbaru(daftar) {
  return daftar.slice().sort(function (a, b) {
    if (a.tanggal !== b.tanggal) {
      return a.tanggal < b.tanggal ? 1 : -1;
    }
    return (b.dibuat || 0) - (a.dibuat || 0);
  });
}

/** Badge (label warna) untuk tipe kas. */
function badgeTipe(tipe) {
  return tipe === "masuk"
    ? '<span class="badge badge-in">Masuk</span>'
    : '<span class="badge badge-out">Keluar</span>';
}

/* ---------------- Modal ---------------- */

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("open");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("open");
}

function closeAllModals() {
  document.querySelectorAll(".modal.open").forEach(function (m) {
    m.classList.remove("open");
  });
}

/* ---------------- Toast (notifikasi) ---------------- */

let toastTimer = null;

/**
 * Menampilkan pesan singkat di bawah layar.
 * tipe: "success" (default) atau "error"
 */
function tampilkanPesan(pesan, tipe) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = pesan;
  toast.className = "toast show" + (tipe === "error" ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.className = "toast";
  }, 2800);
}
