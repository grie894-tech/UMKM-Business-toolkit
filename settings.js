/* =========================================================
   settings.js - Pengaturan informasi bisnis
   Data ini dipakai di sidebar dan di kepala nota.
   ========================================================= */

const DEFAULT_SETTINGS = {
  namaBisnis: "",
  slogan: "",
  alamat: "",
  whatsapp: "",
  logo: "" // gambar dalam bentuk teks base64 (data URL)
};

const MAKS_UKURAN_LOGO = 500 * 1024; // 500 KB

// Logo yang sudah dipilih tapi belum disimpan
let logoSementara = "";

/** Mengambil pengaturan, digabung dengan nilai default. */
function getSettings() {
  return Object.assign({}, DEFAULT_SETTINGS, getData(KEYS.settings, {}));
}

/** Mengisi form pengaturan dengan data tersimpan. */
function renderSettings() {
  const s = getSettings();
  document.getElementById("set-name").value = s.namaBisnis;
  document.getElementById("set-slogan").value = s.slogan;
  document.getElementById("set-address").value = s.alamat;
  document.getElementById("set-wa").value = s.whatsapp;
  document.getElementById("set-logo").value = "";
  logoSementara = s.logo;
  tampilkanPreviewLogo();
}

function tampilkanPreviewLogo() {
  const img = document.getElementById("set-logo-preview");
  const kosong = document.getElementById("set-logo-empty");
  if (logoSementara) {
    img.src = logoSementara;
    img.hidden = false;
    kosong.hidden = true;
  } else {
    img.removeAttribute("src");
    img.hidden = true;
    kosong.hidden = false;
  }
}

/**
 * Membaca file gambar dan mengubahnya menjadi teks base64
 * dengan FileReader, agar bisa disimpan di LocalStorage.
 */
function handleLogoChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    tampilkanPesan("File harus berupa gambar.", "error");
    event.target.value = "";
    return;
  }
  if (file.size > MAKS_UKURAN_LOGO) {
    tampilkanPesan("Ukuran logo maksimal 500 KB.", "error");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    logoSementara = reader.result; // contoh: "data:image/png;base64,iVBOR..."
    tampilkanPreviewLogo();
    tampilkanPesan("Logo dipilih. Klik Simpan Pengaturan.");
  };
  reader.readAsDataURL(file);
}

function saveSettings(event) {
  event.preventDefault(); // cegah halaman reload saat form dikirim

  const whatsapp = document.getElementById("set-wa").value.trim();
  if (whatsapp && !/^[0-9+\-\s]+$/.test(whatsapp)) {
    tampilkanPesan("Nomor WhatsApp hanya boleh angka, spasi, + atau -.", "error");
    return;
  }

  const data = {
    namaBisnis: document.getElementById("set-name").value.trim(),
    slogan: document.getElementById("set-slogan").value.trim(),
    alamat: document.getElementById("set-address").value.trim(),
    whatsapp: whatsapp,
    logo: logoSementara
  };

  if (saveData(KEYS.settings, data)) {
    updateBrand();
    tampilkanPesan("Pengaturan disimpan.");
  }
}

/** Memperbarui nama & logo di sidebar. */
function updateBrand() {
  const s = getSettings();
  const nama = s.namaBisnis || "UMKM Toolkit";
  setText("brand-name", nama);

  const logo = document.getElementById("brand-logo");
  if (s.logo) {
    logo.innerHTML = '<img src="' + s.logo + '" alt="Logo">';
  } else {
    logo.textContent = nama.charAt(0).toUpperCase();
  }
  document.title = nama + " - UMKM Business Toolkit";
}

function resetSemuaData() {
  if (!confirm("Yakin hapus SEMUA data? Produk, nota, buku kas, dan pengaturan akan hilang.")) return;
  if (!confirm("Data tidak bisa dikembalikan. Lanjutkan?")) return;

  Object.values(KEYS).forEach(function (key) {
    penyimpanan.removeItem(key);
  });
  location.hash = "dashboard";
  location.reload();
}

/** Menampilkan contoh nota dengan data pengaturan saat ini. */
function lihatContohNota() {
  const contoh = {
    nomor: "INV-CONTOH-001",
    tanggal: hariIni(),
    pelanggan: "Pelanggan Contoh",
    catatan: "Ini hanya contoh tampilan nota.",
    items: [
      { nama: "Produk A", jumlah: 2, harga: 15000, subtotal: 30000 },
      { nama: "Produk B", jumlah: 1, harga: 25000, subtotal: 25000 }
    ],
    total: 55000
  };
  tampilkanPreviewInvoice(contoh); // fungsi dari invoice.js
}

function initSettings() {
  document.getElementById("settings-form").addEventListener("submit", saveSettings);
  document.getElementById("set-logo").addEventListener("change", handleLogoChange);

  document.getElementById("set-logo-remove").addEventListener("click", function () {
    logoSementara = "";
    document.getElementById("set-logo").value = "";
    tampilkanPreviewLogo();
    tampilkanPesan("Logo dihapus. Klik Simpan Pengaturan.");
  });

  document.getElementById("set-sample-invoice").addEventListener("click", lihatContohNota);
  document.getElementById("set-reset-all").addEventListener("click", resetSemuaData);
}
