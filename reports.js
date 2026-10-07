/* =========================================================
   reports.js - Laporan keuangan & penjualan
   Membaca data Buku Kas dan Invoice, lalu merangkumnya.
   ========================================================= */

function renderReports() {
  const bulan = document.getElementById("report-month").value; // "" = semua waktu
  setText("report-period", "Periode: " + formatBulan(bulan));

  const semuaKas = getData(KEYS.cashbook);
  const kas = bulan ? semuaKas.filter(function (k) { return k.tanggal.startsWith(bulan); }) : semuaKas;
  const invoices = getData(KEYS.invoices).filter(function (inv) {
    return !bulan || inv.tanggal.startsWith(bulan);
  });

  // 1. Ringkasan
  const r = hitungRingkasanKas(kas);
  setText("rep-income", formatRupiah(r.pemasukan));
  setText("rep-expense", formatRupiah(r.pengeluaran));
  const elUntung = document.getElementById("rep-profit");
  elUntung.textContent = formatRupiah(r.keuntungan);
  elUntung.className = "stat-value " + (r.keuntungan >= 0 ? "text-green" : "text-red");

  // 2. Produk terjual (dari semua nota pada periode)
  const rekap = {};
  invoices.forEach(function (inv) {
    inv.items.forEach(function (item) {
      const kunci = item.produkId || item.nama;
      if (!rekap[kunci]) rekap[kunci] = { nama: item.nama, jumlah: 0, omzet: 0, modal: 0 };
      rekap[kunci].jumlah += item.jumlah;
      rekap[kunci].omzet += item.subtotal;
      rekap[kunci].modal += (item.hargaModal || 0) * item.jumlah;
    });
  });

  const daftarTerjual = Object.values(rekap).sort(function (a, b) { return b.jumlah - a.jumlah; });
  const totalTerjual = daftarTerjual.reduce(function (s, p) { return s + p.jumlah; }, 0);
  setText("rep-sold", totalTerjual + " item");

  const tbodyProduk = document.getElementById("rep-products");
  if (daftarTerjual.length === 0) {
    tbodyProduk.innerHTML = '<tr><td colspan="4" class="empty">Belum ada penjualan</td></tr>';
  } else {
    tbodyProduk.innerHTML = daftarTerjual.map(function (p) {
      const laba = p.omzet - p.modal;
      return "<tr>" +
        "<td>" + escapeHTML(p.nama) + "</td>" +
        '<td class="right">' + p.jumlah + "</td>" +
        '<td class="right">' + formatRupiah(p.omzet) + "</td>" +
        '<td class="right ' + (laba >= 0 ? "text-green" : "text-red") + '">' + formatRupiah(laba) + "</td>" +
        "</tr>";
    }).join("");
  }

  // 3. Grafik & kategori
  renderGrafikBulanan(semuaKas, bulan);
  renderPengeluaranKategori(kas);

  // 4. Riwayat transaksi
  const riwayat = urutkanTerbaru(kas);
  const tbodyRiwayat = document.getElementById("rep-history");
  if (riwayat.length === 0) {
    tbodyRiwayat.innerHTML = '<tr><td colspan="5" class="empty">Belum ada transaksi</td></tr>';
  } else {
    tbodyRiwayat.innerHTML = riwayat.map(function (k) {
      return "<tr>" +
        '<td class="nowrap">' + formatTanggal(k.tanggal) + "</td>" +
        "<td>" + badgeTipe(k.tipe) + "</td>" +
        "<td>" + escapeHTML(k.kategori) + "</td>" +
        "<td>" + escapeHTML(k.catatan || "-") + "</td>" +
        '<td class="right ' + (k.tipe === "masuk" ? "text-green" : "text-red") + '">' + formatRupiah(k.nominal) + "</td>" +
        "</tr>";
    }).join("");
  }
}

/**
 * Grafik batang sederhana dari <div> (tanpa library).
 * Tinggi batang = persentase terhadap nilai terbesar.
 */
function renderGrafikBulanan(semuaKas, bulanAkhir) {
  const akhir = bulanAkhir ? new Date(bulanAkhir + "-01T00:00:00") : new Date();
  const data = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(akhir.getFullYear(), akhir.getMonth() - i, 1);
    const kode = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const kasBulan = semuaKas.filter(function (k) { return k.tanggal.startsWith(kode); });
    const r = hitungRingkasanKas(kasBulan);
    data.push({
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      pemasukan: r.pemasukan,
      pengeluaran: r.pengeluaran
    });
  }

  const terbesar = Math.max(1, ...data.map(function (d) { return Math.max(d.pemasukan, d.pengeluaran); }));

  const kolom = data.map(function (d) {
    const tinggiMasuk = (d.pemasukan / terbesar) * 100;
    const tinggiKeluar = (d.pengeluaran / terbesar) * 100;
    return '<div class="chart-col">' +
      '<div class="chart-bars">' +
        '<div class="bar bar-in" style="height:' + tinggiMasuk + '%" title="Pemasukan ' + d.label + ": " + formatRupiah(d.pemasukan) + '"></div>' +
        '<div class="bar bar-out" style="height:' + tinggiKeluar + '%" title="Pengeluaran ' + d.label + ": " + formatRupiah(d.pengeluaran) + '"></div>' +
      "</div>" +
      '<span class="chart-label">' + d.label + "</span>" +
      "</div>";
  }).join("");

  document.getElementById("rep-chart").innerHTML =
    '<div class="chart">' + kolom + "</div>" +
    '<div class="legend"><span class="lg-in">Pemasukan</span><span class="lg-out">Pengeluaran</span></div>' +
    '<p class="muted small">Arahkan kursor ke batang untuk melihat nominal.</p>';
}

/** Daftar pengeluaran dikelompokkan per kategori. */
function renderPengeluaranKategori(kas) {
  const perKategori = {};
  kas.forEach(function (k) {
    if (k.tipe !== "keluar") return;
    perKategori[k.kategori] = (perKategori[k.kategori] || 0) + Number(k.nominal);
  });

  const daftar = Object.keys(perKategori)
    .map(function (nama) { return { nama: nama, total: perKategori[nama] }; })
    .sort(function (a, b) { return b.total - a.total; });

  const el = document.getElementById("rep-categories");
  if (daftar.length === 0) {
    el.innerHTML = '<p class="empty">Belum ada pengeluaran</p>';
    return;
  }

  const total = daftar.reduce(function (s, d) { return s + d.total; }, 0);
  el.innerHTML = daftar.map(function (d) {
    const persen = (d.total / total) * 100;
    return '<div class="cat-row">' +
      '<div class="cat-info"><span>' + escapeHTML(d.nama) + "</span><span>" +
        formatRupiah(d.total) + " (" + persen.toFixed(0) + "%)</span></div>" +
      '<div class="cat-bar"><div style="width:' + persen + '%"></div></div>' +
      "</div>";
  }).join("");
}

function initReports() {
  document.getElementById("report-month").addEventListener("change", renderReports);
  document.getElementById("report-all").addEventListener("click", function () {
    document.getElementById("report-month").value = "";
    renderReports();
  });
}
