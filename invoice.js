/* =========================================================
   invoice.js - Membuat, menyimpan, preview, dan cetak nota

   Saat nota DISIMPAN:
   1. Nota masuk ke daftar invoice
   2. Stok produk berkurang
   3. Total nota tercatat sebagai PEMASUKAN di Buku Kas
   ========================================================= */

let invoiceDipreview = null; // nota yang sedang tampil di modal preview

/**
 * Membuat nomor invoice otomatis: INV-YYYYMMDD-001
 * Nomor urut dihitung ulang setiap hari.
 */
function buatNomorInvoice(tanggal) {
  const prefix = "INV-" + tanggal.replace(/-/g, "") + "-";
  let terbesar = 0;

  getData(KEYS.invoices).forEach(function (inv) {
    if (inv.nomor.startsWith(prefix)) {
      const urutan = parseInt(inv.nomor.slice(prefix.length), 10);
      if (urutan > terbesar) terbesar = urutan;
    }
  });

  return prefix + String(terbesar + 1).padStart(3, "0");
}

/** Membuat pilihan <option> produk untuk dropdown. */
function opsiProdukHTML(idTerpilih) {
  const daftar = getData(KEYS.products).sort(function (a, b) {
    return a.nama.localeCompare(b.nama);
  });

  let html = '<option value="">-- Pilih produk --</option>';
  daftar.forEach(function (p) {
    html += '<option value="' + p.id + '"' + (p.id === idTerpilih ? " selected" : "") + ">" +
      escapeHTML(p.nama) + " (stok " + p.stok + ")</option>";
  });
  return html;
}

/** Menambah satu baris item ke tabel nota. */
function tambahBarisItem() {
  const tr = document.createElement("tr");
  tr.className = "inv-row";
  tr.innerHTML =
    '<td><select class="inv-product">' + opsiProdukHTML("") + "</select></td>" +
    '<td><input type="number" class="inv-qty" min="1" step="1" value="1"></td>' +
    '<td><input type="number" class="inv-price" min="0" value="0"></td>' +
    '<td class="right inv-subtotal">Rp 0</td>' +
    '<td class="right"><button type="button" class="btn-icon danger inv-remove" title="Hapus item">&times;</button></td>';
  document.getElementById("inv-items").appendChild(tr);
}

/** Menghitung subtotal setiap baris dan total nota. */
function hitungTotalInvoice() {
  let total = 0;
  document.querySelectorAll("#inv-items .inv-row").forEach(function (baris) {
    const jumlah = Number(baris.querySelector(".inv-qty").value) || 0;
    const harga = Number(baris.querySelector(".inv-price").value) || 0;
    const subtotal = jumlah * harga;
    baris.querySelector(".inv-subtotal").textContent = formatRupiah(subtotal);
    total += subtotal;
  });
  setText("inv-total", formatRupiah(total));
  return total;
}

/** Membaca semua isi form nota menjadi satu objek. */
function bacaFormInvoice() {
  const items = [];

  document.querySelectorAll("#inv-items .inv-row").forEach(function (baris) {
    const produkId = baris.querySelector(".inv-product").value;
    if (!produkId) return; // baris tanpa produk dilewati

    const produk = getItemById(KEYS.products, produkId);
    if (!produk) return;

    const jumlah = parseInt(baris.querySelector(".inv-qty").value, 10) || 0;
    const harga = Number(baris.querySelector(".inv-price").value) || 0;

    items.push({
      produkId: produkId,
      nama: produk.nama,
      jumlah: jumlah,
      harga: harga,
      hargaModal: Number(produk.hargaModal) || 0, // disimpan untuk hitung laba di Laporan
      subtotal: jumlah * harga
    });
  });

  return {
    nomor: document.getElementById("inv-number").value,
    tanggal: document.getElementById("inv-date").value,
    pelanggan: document.getElementById("inv-customer").value.trim(),
    catatan: document.getElementById("inv-note").value.trim(),
    items: items,
    total: items.reduce(function (jumlah, item) { return jumlah + item.subtotal; }, 0)
  };
}

/**
 * Mengecek isi nota. Mengembalikan pesan error, atau "" jika aman.
 * cekStok = true -> pastikan stok cukup (dipakai saat menyimpan).
 */
function validasiInvoice(inv, cekStok) {
  if (!inv.tanggal) return "Tanggal wajib diisi.";
  if (!inv.pelanggan) return "Nama pelanggan wajib diisi.";
  if (inv.items.length === 0) return "Pilih minimal 1 produk.";
  if (inv.items.some(function (i) { return i.jumlah < 1; })) return "Jumlah setiap item minimal 1.";

  if (cekStok) {
    // Jumlahkan kebutuhan per produk (jika produk sama dipilih 2 kali)
    const kebutuhan = {};
    inv.items.forEach(function (i) {
      kebutuhan[i.produkId] = (kebutuhan[i.produkId] || 0) + i.jumlah;
    });

    for (const id in kebutuhan) {
      const produk = getItemById(KEYS.products, id);
      if (!produk) return "Ada produk yang sudah dihapus.";
      if (kebutuhan[id] > produk.stok) {
        return 'Stok "' + produk.nama + '" tidak cukup (tersisa ' + produk.stok + ").";
      }
    }
  }
  return "";
}

/** Menyimpan nota + kurangi stok + catat ke buku kas. */
function simpanInvoice() {
  const inv = bacaFormInvoice();
  const error = validasiInvoice(inv, true);
  if (error) {
    tampilkanPesan(error, "error");
    return;
  }

  inv.nomor = buatNomorInvoice(inv.tanggal); // hitung ulang agar pasti unik
  inv.dibuat = Date.now();
  const tersimpan = addItem(KEYS.invoices, inv);

  // Kurangi stok setiap produk
  tersimpan.items.forEach(function (item) {
    const produk = getItemById(KEYS.products, item.produkId);
    if (produk) {
      updateItem(KEYS.products, produk.id, { stok: produk.stok - item.jumlah });
    }
  });

  // Catat otomatis sebagai pemasukan
  addItem(KEYS.cashbook, {
    tipe: "masuk",
    kategori: "Penjualan",
    nominal: tersimpan.total,
    catatan: "Nota " + tersimpan.nomor + " - " + tersimpan.pelanggan,
    tanggal: tersimpan.tanggal,
    sumber: "invoice",
    invoiceId: tersimpan.id,
    dibuat: Date.now()
  });

  tampilkanPesan("Nota disimpan. Stok & buku kas diperbarui.");
  resetFormInvoice();
  renderInvoiceList();
  tampilkanPreviewInvoice(tersimpan);
}

/** Menghapus nota: stok dikembalikan, catatan kas terkait dihapus. */
function hapusInvoice(id) {
  const inv = getItemById(KEYS.invoices, id);
  if (!inv) return;
  if (!confirm("Hapus nota " + inv.nomor + "?\nStok akan dikembalikan dan catatan kas terkait ikut dihapus.")) return;

  inv.items.forEach(function (item) {
    const produk = getItemById(KEYS.products, item.produkId);
    if (produk) {
      updateItem(KEYS.products, produk.id, { stok: produk.stok + item.jumlah });
    }
  });

  const sisaKas = getData(KEYS.cashbook).filter(function (k) { return k.invoiceId !== id; });
  saveData(KEYS.cashbook, sisaKas);
  deleteItem(KEYS.invoices, id);

  tampilkanPesan("Nota dihapus.");
  renderInvoice();
}

function resetFormInvoice() {
  document.getElementById("inv-date").value = hariIni();
  document.getElementById("inv-customer").value = "";
  document.getElementById("inv-note").value = "";
  document.getElementById("inv-items").innerHTML = "";
  document.getElementById("inv-number").value = buatNomorInvoice(hariIni());
  tambahBarisItem();
  hitungTotalInvoice();
}

/** Membuat HTML nota (dipakai untuk preview DAN print). */
function buatHTMLNota(inv) {
  const s = getSettings();
  const namaBisnis = s.namaBisnis || "Nama Bisnis Anda";

  const logo = s.logo ? '<img src="' + s.logo + '" class="nota-logo" alt="Logo">' : "";
  const slogan = s.slogan ? '<p class="nota-slogan">' + escapeHTML(s.slogan) + "</p>" : "";
  const alamat = s.alamat ? "<p>" + escapeHTML(s.alamat) + "</p>" : "";
  const wa = s.whatsapp ? "<p>WA: " + escapeHTML(s.whatsapp) + "</p>" : "";
  const catatan = inv.catatan ? '<p class="nota-note"><strong>Catatan:</strong> ' + escapeHTML(inv.catatan) + "</p>" : "";

  const baris = inv.items.map(function (item, i) {
    return "<tr>" +
      "<td>" + (i + 1) + "</td>" +
      "<td>" + escapeHTML(item.nama) + "</td>" +
      '<td class="right">' + item.jumlah + "</td>" +
      '<td class="right">' + formatRupiah(item.harga) + "</td>" +
      '<td class="right">' + formatRupiah(item.subtotal) + "</td>" +
      "</tr>";
  }).join("");

  return '<div class="nota">' +
    '<div class="nota-header">' +
      '<div class="nota-biz">' + logo +
        "<div><h2>" + escapeHTML(namaBisnis) + "</h2>" + slogan + alamat + wa + "</div>" +
      "</div>" +
      '<div class="nota-meta">' +
        "<h3>NOTA</h3>" +
        "<p>No: <strong>" + escapeHTML(inv.nomor) + "</strong></p>" +
        "<p>Tanggal: " + formatTanggal(inv.tanggal) + "</p>" +
      "</div>" +
    "</div>" +
    '<div class="nota-customer">Kepada: <strong>' + escapeHTML(inv.pelanggan) + "</strong></div>" +
    '<table class="nota-table">' +
      "<thead><tr><th>No</th><th>Produk</th>" +
      '<th class="right">Jumlah</th><th class="right">Harga</th><th class="right">Subtotal</th></tr></thead>' +
      "<tbody>" + baris + "</tbody>" +
      '<tfoot><tr><td colspan="4" class="right">TOTAL</td><td class="right">' + formatRupiah(inv.total) + "</td></tr></tfoot>" +
    "</table>" +
    catatan +
    '<div class="nota-footer">' +
      "<p>Terima kasih atas pembelian Anda.</p>" +
      '<div class="nota-sign">Hormat kami,<br><br><br>( ' + escapeHTML(namaBisnis) + " )</div>" +
    "</div>" +
  "</div>";
}

function tampilkanPreviewInvoice(inv) {
  invoiceDipreview = inv;
  document.getElementById("invoice-preview").innerHTML = buatHTMLNota(inv);
  openModal("modal-invoice");
}

/** Cetak: isi #print-area lalu panggil dialog print browser. */
function cetakInvoice() {
  if (!invoiceDipreview) return;
  document.getElementById("print-area").innerHTML = buatHTMLNota(invoiceDipreview);
  window.print();
}

/** Menampilkan riwayat nota. */
function renderInvoiceList() {
  const daftar = urutkanTerbaru(getData(KEYS.invoices));
  const tbody = document.getElementById("inv-list");

  if (daftar.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Belum ada nota</td></tr>';
    return;
  }

  tbody.innerHTML = daftar.map(function (inv) {
    return "<tr>" +
      "<td>" + escapeHTML(inv.nomor) + "</td>" +
      '<td class="nowrap">' + formatTanggal(inv.tanggal) + "</td>" +
      "<td>" + escapeHTML(inv.pelanggan) + "</td>" +
      '<td class="right">' + formatRupiah(inv.total) + "</td>" +
      '<td class="right">' +
        '<button class="btn-icon" data-action="view" data-id="' + inv.id + '">Lihat</button>' +
        '<button class="btn-icon danger" data-action="delete" data-id="' + inv.id + '">Hapus</button>' +
      "</td>" +
      "</tr>";
  }).join("");
}

/** Dipanggil setiap kali halaman Invoice dibuka. */
function renderInvoice() {
  // Perbarui pilihan produk (mungkin ada produk baru / stok berubah)
  document.querySelectorAll("#inv-items .inv-product").forEach(function (select) {
    select.innerHTML = opsiProdukHTML(select.value);
  });

  if (document.querySelectorAll("#inv-items .inv-row").length === 0) {
    tambahBarisItem();
  }

  const tanggal = document.getElementById("inv-date").value || hariIni();
  document.getElementById("inv-date").value = tanggal;
  document.getElementById("inv-number").value = buatNomorInvoice(tanggal);

  hitungTotalInvoice();
  renderInvoiceList();
}

function initInvoice() {
  const tbody = document.getElementById("inv-items");

  document.getElementById("inv-add-row").addEventListener("click", function () {
    tambahBarisItem();
  });

  // Saat produk dipilih: isi harga otomatis dari harga jual produk
  tbody.addEventListener("change", function (event) {
    if (event.target.classList.contains("inv-product")) {
      const baris = event.target.closest("tr");
      const produk = getItemById(KEYS.products, event.target.value);
      baris.querySelector(".inv-price").value = produk ? produk.hargaJual : 0;
      hitungTotalInvoice();
    }
  });

  // Saat jumlah / harga diketik: hitung ulang total
  tbody.addEventListener("input", hitungTotalInvoice);

  // Tombol hapus baris
  tbody.addEventListener("click", function (event) {
    if (event.target.closest(".inv-remove")) {
      event.target.closest("tr").remove();
      if (tbody.children.length === 0) tambahBarisItem();
      hitungTotalInvoice();
    }
  });

  // Nomor invoice mengikuti tanggal
  document.getElementById("inv-date").addEventListener("change", function () {
    const tanggal = this.value || hariIni();
    document.getElementById("inv-number").value = buatNomorInvoice(tanggal);
  });

  document.getElementById("inv-reset").addEventListener("click", resetFormInvoice);
  document.getElementById("inv-save").addEventListener("click", simpanInvoice);

  document.getElementById("inv-preview").addEventListener("click", function () {
    const inv = bacaFormInvoice();
    const error = validasiInvoice(inv, false);
    if (error) {
      tampilkanPesan(error, "error");
      return;
    }
    tampilkanPreviewInvoice(inv);
  });

  document.getElementById("inv-print").addEventListener("click", cetakInvoice);

  // Tombol Lihat / Hapus di riwayat nota
  document.getElementById("inv-list").addEventListener("click", function (event) {
    const tombol = event.target.closest("button[data-action]");
    if (!tombol) return;
    const id = tombol.dataset.id;

    if (tombol.dataset.action === "view") {
      const inv = getItemById(KEYS.invoices, id);
      if (inv) tampilkanPreviewInvoice(inv);
    } else if (tombol.dataset.action === "delete") {
      hapusInvoice(id);
    }
  });
}
