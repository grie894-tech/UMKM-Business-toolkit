# UMKM Business Toolkit — Panduan Belajar

Aplikasi web untuk UMKM: produk, kalkulator HPP, nota, buku kas, laporan, dan pengaturan bisnis.
Dibuat dengan HTML, CSS, JavaScript murni, dan LocalStorage. Tanpa backend, tanpa internet.

## Cara Menjalankan

1. Ekstrak folder `umkm-business-toolkit`.
2. Klik dua kali `index.html` untuk membuka Landing Page (halaman depan).
3. Klik "Buka Aplikasi" atau langsung buka `app.html` untuk memakai aplikasinya.
4. Selesai. Data otomatis tersimpan di browser tersebut.

Tidak perlu server. Jika ingin, di VS Code bisa juga pakai ekstensi "Live Server".

## Struktur File

```
umkm-business-toolkit/
├── index.html          Landing Page: halaman depan yang memperkenalkan fitur
├── landing.css         Tampilan khusus Landing Page
├── landing.js          Menu HP, animasi muncul saat scroll, tahun di footer
├── app.html            Aplikasi: satu halaman berisi semua menu, modal, dan urutan script
├── style.css           Tampilan aplikasi (warna, layout, responsif HP, mode print)
├── app.js              Navigasi menu + menjalankan semua modul (dimuat terakhir)
├── modules/
│   ├── utils.js        Fungsi bantu: format Rupiah, tanggal, ID, modal, notifikasi
│   ├── storage.js      CRUD LocalStorage: getData, saveData, addItem, updateItem, deleteItem
│   ├── settings.js     Nama bisnis, logo, alamat, WA, slogan
│   ├── dashboard.js    Ringkasan angka + transaksi terakhir + stok menipis
│   ├── products.js     Tambah / edit / hapus / cari produk
│   ├── calculator.js   Hitung HPP & harga jual rekomendasi
│   ├── invoice.js      Buat nota, preview, print, riwayat nota
│   ├── cashbook.js     Catat pemasukan & pengeluaran, filter
│   └── reports.js      Ringkasan, grafik 6 bulan, produk terjual, riwayat
└── assets/images/      Screenshot aplikasi yang dipakai di Landing Page
```

Kenapa memakai `<script src>` biasa, bukan `import/export`?
Karena `import` (ES Modules) diblokir browser saat file dibuka langsung (`file://`).
Dengan script biasa, semua fungsi menjadi "global" dan bisa saling dipanggil,
asalkan urutan pemuatan benar: `utils → storage → modul-modul → app.js`.

## Data di LocalStorage

| Key | Isi |
|---|---|
| `umkm_products` | `[{ id, nama, hargaModal, hargaJual, stok, dibuat }]` |
| `umkm_cashbook` | `[{ id, tipe: "masuk"/"keluar", kategori, nominal, catatan, tanggal, sumber, invoiceId? }]` |
| `umkm_invoices` | `[{ id, nomor, tanggal, pelanggan, catatan, items: [{ produkId, nama, jumlah, harga, hargaModal, subtotal }], total }]` |
| `umkm_settings` | `{ namaBisnis, slogan, alamat, whatsapp, logo }` |

Melihat isinya: tekan F12 → tab Application → Local Storage.

## Fungsi CRUD (storage.js)

```js
getData(KEYS.products)                       // READ   : ambil semua produk
saveData(KEYS.products, daftar)              // SAVE   : simpan seluruh daftar
addItem(KEYS.products, { nama: "Keripik" })  // CREATE : tambah 1 item (id otomatis)
updateItem(KEYS.products, id, { stok: 10 })  // UPDATE : ubah sebagian data
deleteItem(KEYS.products, id)                // DELETE : hapus berdasarkan id
getItemById(KEYS.products, id)               // ambil 1 item
```

Kuncinya: LocalStorage hanya menyimpan teks, jadi data diubah dengan
`JSON.stringify()` saat disimpan dan `JSON.parse()` saat dibaca.

## Alur Data (bagaimana fitur saling terhubung)

```
Pengaturan ──► kepala Nota + nama/logo di sidebar
Kalkulator ──► "Simpan sebagai Produk" (HPP → harga modal, rekomendasi → harga jual)
Produk ──► dipilih di Nota
Simpan Nota ──► stok produk berkurang
            └─► otomatis tercatat "Pemasukan / Penjualan" di Buku Kas
Hapus Nota ──► stok dikembalikan + catatan kas terkait ikut terhapus
Buku Kas + Nota ──► Dashboard & Laporan (hanya membaca, tidak menyimpan)
```

Catatan kas yang berasal dari nota diberi label "Dari Nota" dan hanya bisa dihapus lewat menu Invoice,
supaya data stok dan kas tidak berantakan.

## Rumus

- Total Modal = Harga Modal + Biaya Tambahan
- HPP per Unit = Total Modal ÷ Jumlah Produk
- Harga Jual Rekomendasi = HPP + (HPP × Target %), dibulatkan ke atas kelipatan Rp 100
- Untung per Unit = Harga Jual − HPP
- Keuntungan (Dashboard/Laporan) = Total Pemasukan − Total Pengeluaran
- Laba Kotor per produk (Laporan) = Omzet − (Harga Modal × Qty)

Contoh: modal 100.000 + tambahan 20.000, 10 unit, target 30% →
HPP Rp 12.000, harga jual Rp 15.600, untung Rp 3.600/unit, total Rp 36.000.

## Konsep Penting yang Dipakai

- `addEventListener` — menjalankan fungsi saat terjadi klik / ketik / submit.
- `event.preventDefault()` — mencegah form me-reload halaman.
- Event delegation — satu listener di `<tbody>` menangani semua tombol Edit/Hapus,
  memakai `event.target.closest("button[data-action]")`.
- `data-*` attribute — menyimpan info di tombol, misal `data-id="..."`, dibaca lewat `tombol.dataset.id`.
- `location.hash` — menu memakai alamat `#products`, `#invoice`, dst. Tombol Back browser ikut berfungsi.
- `FileReader.readAsDataURL` — mengubah gambar logo jadi teks agar bisa disimpan.
- `@media print` — saat print, hanya `#print-area` (nota) yang tampil.
- `escapeHTML()` — mengamankan teks dari user sebelum dimasukkan ke HTML.

## Checklist Testing

Pengaturan
- [ ] Isi nama bisnis, slogan, alamat, WA → Simpan → nama di sidebar berubah
- [ ] Pilih logo (< 500 KB) → Simpan → logo muncul di sidebar
- [ ] "Lihat Contoh Nota" menampilkan data bisnis

Produk
- [ ] Tambah 2 produk, muncul di tabel
- [ ] Edit stok produk → tersimpan
- [ ] Cari produk berdasarkan nama
- [ ] Nama kembar ditolak; harga jual < modal memunculkan konfirmasi
- [ ] Hapus produk

Kalkulator
- [ ] Isi 100000 / 20000 / 10 / 30 → hasil HPP Rp 12.000, harga Rp 15.600
- [ ] "Simpan sebagai Produk" membuka form yang sudah terisi

Invoice
- [ ] Nomor otomatis `INV-YYYYMMDD-001`
- [ ] Pilih produk → harga terisi otomatis, total terhitung
- [ ] Preview tampil, Cetak membuka dialog print (hanya nota yang tercetak)
- [ ] Simpan → stok berkurang, Buku Kas bertambah pemasukan, nomor berikutnya jadi -002
- [ ] Jumlah melebihi stok → ditolak
- [ ] Hapus nota → stok kembali, catatan kas hilang

Buku Kas
- [ ] Tambah pengeluaran → ringkasan berubah
- [ ] Edit & hapus catatan manual
- [ ] Filter tipe dan bulan

Laporan & Dashboard
- [ ] Angka pemasukan/pengeluaran/keuntungan sama dengan Buku Kas
- [ ] Produk terjual & grafik tampil
- [ ] Filter periode bulan bekerja

Tampilan
- [ ] Di HP (F12 → ikon HP): menu ☰ membuka sidebar, tabel bisa digeser

Data permanen
- [ ] Tutup browser, buka lagi `app.html` → data masih ada

Landing Page
- [ ] Semua tombol "Buka Aplikasi" menuju `app.html`
- [ ] Menu atas melompat ke bagian Fitur, Cara Kerja, Data Aman, FAQ
- [ ] Di HP, tombol ☰ membuka menu; FAQ bisa dibuka-tutup
- [ ] Di aplikasi, menu "Halaman Utama" kembali ke Landing Page

## Jika Ada Masalah

1. Tekan F12 → tab Console, lihat pesan error berwarna merah.
2. Pastikan semua file ada di folder yang benar (terutama folder `modules/`).
3. Pastikan urutan `<script>` di `app.html` tidak diubah.
4. Data hanya tersimpan di browser yang sama. Browser lain atau mode Incognito = data kosong.
5. Ingin mulai dari nol: Pengaturan → "Hapus Semua Data".

## Ide Versi Berikutnya

Backup/restore data (export JSON), kirim nota via WhatsApp, diskon & pajak di nota,
kategori produk, multi-user, lalu sinkronisasi ke database online.
