/* =========================================================
   storage.js - Semua urusan simpan & baca data (LocalStorage)

   LocalStorage hanya bisa menyimpan TEKS.
   Karena itu:
   - Saat menyimpan : data diubah ke teks JSON  -> JSON.stringify()
   - Saat membaca   : teks JSON diubah ke data  -> JSON.parse()
   ========================================================= */

// Nama "laci" penyimpanan. Ditulis sekali di sini agar tidak salah ketik.
const KEYS = {
  products: "umkm_products",   // daftar produk
  cashbook: "umkm_cashbook",   // catatan buku kas
  invoices: "umkm_invoices",   // daftar nota
  settings: "umkm_settings"    // informasi bisnis (satu objek)
};

/**
 * Cek apakah LocalStorage bisa dipakai.
 * Pada beberapa kondisi (mode privat tertentu / halaman di-sandbox),
 * LocalStorage diblokir browser. Jika begitu, data disimpan sementara
 * di memori (hilang saat halaman ditutup) agar aplikasi tetap jalan.
 */
const penyimpanan = (function () {
  try {
    const tes = "__umkm_test__";
    window.localStorage.setItem(tes, "1");
    window.localStorage.removeItem(tes);
    return window.localStorage;
  } catch (error) {
    console.warn("LocalStorage tidak tersedia, memakai memori sementara.");
    const memori = {};
    return {
      getItem: function (k) { return k in memori ? memori[k] : null; },
      setItem: function (k, v) { memori[k] = String(v); },
      removeItem: function (k) { delete memori[k]; },
      sementara: true
    };
  }
})();

/**
 * READ - Mengambil data dari LocalStorage.
 * Jika belum ada data, kembalikan nilaiAwal (default: array kosong).
 */
function getData(key, nilaiAwal) {
  if (nilaiAwal === undefined) nilaiAwal = [];
  try {
    const teks = penyimpanan.getItem(key);
    return teks ? JSON.parse(teks) : nilaiAwal;
  } catch (error) {
    console.error("Gagal membaca data:", key, error);
    return nilaiAwal;
  }
}

/**
 * SAVE - Menyimpan seluruh data ke LocalStorage.
 * Mengembalikan true jika berhasil, false jika gagal (misal memori penuh).
 */
function saveData(key, data) {
  try {
    penyimpanan.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan data:", key, error);
    alert("Penyimpanan browser penuh. Coba hapus logo atau data lama.");
    return false;
  }
}

/**
 * CREATE - Menambah satu item ke daftar.
 * Item otomatis diberi id unik jika belum punya.
 */
function addItem(key, item) {
  const daftar = getData(key);
  if (!item.id) item.id = buatId();
  daftar.push(item);
  saveData(key, daftar);
  return item;
}

/**
 * Mengambil satu item berdasarkan id.
 * Mengembalikan null jika tidak ditemukan.
 */
function getItemById(key, id) {
  const daftar = getData(key);
  return daftar.find(function (item) { return item.id === id; }) || null;
}

/**
 * UPDATE - Mengubah item berdasarkan id.
 * Hanya properti di dataBaru yang diganti, sisanya tetap.
 */
function updateItem(key, id, dataBaru) {
  const daftar = getData(key);
  const index = daftar.findIndex(function (item) { return item.id === id; });
  if (index === -1) return null;

  // Object.assign: gabungkan data lama dengan data baru
  daftar[index] = Object.assign({}, daftar[index], dataBaru, { id: id });
  saveData(key, daftar);
  return daftar[index];
}

/**
 * DELETE - Menghapus item berdasarkan id.
 */
function deleteItem(key, id) {
  const daftar = getData(key);
  const sisa = daftar.filter(function (item) { return item.id !== id; });
  saveData(key, sisa);
  return sisa.length < daftar.length; // true jika ada yang terhapus
}
