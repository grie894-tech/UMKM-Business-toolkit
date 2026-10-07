/* =========================================================
   dashboard.js - Ringkasan bisnis
   Dashboard tidak menyimpan data sendiri. Ia hanya MEMBACA
   data produk & buku kas, lalu menghitung ringkasannya.
   ========================================================= */

const BATAS_STOK_MENIPIS = 5;

function renderDashboard() {
  const daftarKas = getData(KEYS.cashbook);
  const daftarProduk = getData(KEYS.products);
  const ringkasan = hitungRingkasanKas(daftarKas);

  // 1. Kartu ringkasan
  setText("dash-income", formatRupiah(ringkasan.pemasukan));
  setText("dash-expense", formatRupiah(ringkasan.pengeluaran));
  setText("dash-products", daftarProduk.length);
  setText("dash-transactions", daftarKas.length);

  const elUntung = document.getElementById("dash-profit");
  elUntung.textContent = formatRupiah(ringkasan.keuntungan);
  elUntung.className = "stat-value " + (ringkasan.keuntungan >= 0 ? "text-green" : "text-red");

  // 2. Lima transaksi terakhir
  const terbaru = urutkanTerbaru(daftarKas).slice(0, 5);
  const tbody = document.getElementById("dash-recent");

  if (terbaru.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Belum ada transaksi</td></tr>';
  } else {
    tbody.innerHTML = terbaru.map(function (kas) {
      return "<tr>" +
        '<td class="nowrap">' + formatTanggal(kas.tanggal) + "</td>" +
        "<td>" + badgeTipe(kas.tipe) + "</td>" +
        "<td>" + escapeHTML(kas.catatan || kas.kategori) + "</td>" +
        '<td class="right ' + (kas.tipe === "masuk" ? "text-green" : "text-red") + '">' +
          formatRupiah(kas.nominal) + "</td>" +
        "</tr>";
    }).join("");
  }

  // 3. Produk dengan stok menipis
  const menipis = daftarProduk
    .filter(function (p) { return Number(p.stok) <= BATAS_STOK_MENIPIS; })
    .sort(function (a, b) { return a.stok - b.stok; });

  const elStok = document.getElementById("dash-lowstock");
  if (daftarProduk.length === 0) {
    elStok.innerHTML = '<p class="empty">Belum ada produk</p>';
  } else if (menipis.length === 0) {
    elStok.innerHTML = '<p class="empty">Semua stok aman</p>';
  } else {
    elStok.innerHTML = '<ul class="list">' + menipis.map(function (p) {
      const kelas = Number(p.stok) === 0 ? "badge-out" : "badge-warn";
      return "<li><span>" + escapeHTML(p.nama) + "</span>" +
        '<span class="badge ' + kelas + '">Stok ' + p.stok + "</span></li>";
    }).join("") + "</ul>";
  }
}
