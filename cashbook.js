/* =========================================================
   cashbook.js - Buku Kas (pemasukan & pengeluaran)
   ========================================================= */

const KATEGORI_KAS = {
  masuk: ["Penjualan", "Modal Masuk", "Pendapatan Lain"],
  keluar: ["Bahan Baku", "Kemasan", "Operasional", "Gaji", "Sewa", "Listrik & Air", "Transportasi", "Promosi", "Lainnya"]
};

/** Mengisi saran kategori sesuai tipe (masuk/keluar). */
function isiOpsiKategori(tipe) {
  const daftar = KATEGORI_KAS[tipe] || [];
  document.getElementById("cash-category-list").innerHTML = daftar.map(function (k) {
    return '<option value="' + k + '"></option>';
  }).join("");
}

/** Mengambil data kas sesuai filter yang dipilih. */
function ambilKasTerfilter() {
  const tipe = document.getElementById("cash-filter-type").value;
  const bulan = document.getElementById("cash-filter-month").value; // "2026-10" atau ""

  return getData(KEYS.cashbook).filter(function (k) {
    const cocokTipe = tipe === "semua" || k.tipe === tipe;
    const cocokBulan = !bulan || k.tanggal.startsWith(bulan);
    return cocokTipe && cocokBulan;
  });
}

function renderCashbook() {
  const daftar = urutkanTerbaru(ambilKasTerfilter());
  const ringkasan = hitungRingkasanKas(daftar);

  setText("cash-income", formatRupiah(ringkasan.pemasukan));
  setText("cash-expense", formatRupiah(ringkasan.pengeluaran));
  const elSaldo = document.getElementById("cash-balance");
  elSaldo.textContent = formatRupiah(ringkasan.keuntungan);
  elSaldo.className = "stat-value " + (ringkasan.keuntungan >= 0 ? "text-green" : "text-red");

  const tbody = document.getElementById("cash-table");
  if (daftar.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Belum ada catatan kas</td></tr>';
    return;
  }

  tbody.innerHTML = daftar.map(function (k) {
    // Catatan dari nota tidak bisa diedit di sini (hapus lewat menu Invoice)
    const aksi = k.sumber === "invoice"
      ? '<span class="badge badge-info">Dari Nota</span>'
      : '<button class="btn-icon" data-action="edit" data-id="' + k.id + '">Edit</button>' +
        '<button class="btn-icon danger" data-action="delete" data-id="' + k.id + '">Hapus</button>';

    return "<tr>" +
      '<td class="nowrap">' + formatTanggal(k.tanggal) + "</td>" +
      "<td>" + badgeTipe(k.tipe) + "</td>" +
      "<td>" + escapeHTML(k.kategori) + "</td>" +
      "<td>" + escapeHTML(k.catatan || "-") + "</td>" +
      '<td class="right ' + (k.tipe === "masuk" ? "text-green" : "text-red") + '">' + formatRupiah(k.nominal) + "</td>" +
      '<td class="right">' + aksi + "</td>" +
      "</tr>";
  }).join("");
}

/** Membuka form kas. Tanpa parameter = tambah, dengan data = edit. */
function openCashForm(kas) {
  const data = kas || {};
  const tipe = data.tipe || "keluar";

  document.getElementById("cash-form").reset();
  setText("cash-modal-title", data.id ? "Edit Catatan Kas" : "Tambah Catatan Kas");
  document.getElementById("cash-id").value = data.id || "";
  document.getElementById("cash-type").value = tipe;
  document.getElementById("cash-date").value = data.tanggal || hariIni();
  document.getElementById("cash-category").value = data.kategori || "";
  document.getElementById("cash-amount").value = data.nominal || "";
  document.getElementById("cash-note").value = data.catatan || "";
  isiOpsiKategori(tipe);

  openModal("modal-cash");
}

function saveCashForm(event) {
  event.preventDefault();

  const id = document.getElementById("cash-id").value;
  const data = {
    tipe: document.getElementById("cash-type").value,
    tanggal: document.getElementById("cash-date").value,
    kategori: document.getElementById("cash-category").value.trim(),
    nominal: Number(document.getElementById("cash-amount").value),
    catatan: document.getElementById("cash-note").value.trim()
  };

  if (!data.tanggal || !data.kategori) {
    tampilkanPesan("Tanggal dan kategori wajib diisi.", "error");
    return;
  }
  if (isNaN(data.nominal) || data.nominal <= 0) {
    tampilkanPesan("Nominal harus lebih dari 0.", "error");
    return;
  }

  if (id) {
    updateItem(KEYS.cashbook, id, data);
    tampilkanPesan("Catatan kas diperbarui.");
  } else {
    data.sumber = "manual";
    data.dibuat = Date.now();
    addItem(KEYS.cashbook, data);
    tampilkanPesan("Catatan kas ditambahkan.");
  }

  closeModal("modal-cash");
  renderCashbook();
}

function deleteCash(id) {
  const kas = getItemById(KEYS.cashbook, id);
  if (!kas) return;
  if (!confirm("Hapus catatan " + kas.kategori + " sebesar " + formatRupiah(kas.nominal) + "?")) return;

  deleteItem(KEYS.cashbook, id);
  tampilkanPesan("Catatan kas dihapus.");
  renderCashbook();
}

function initCashbook() {
  document.getElementById("btn-add-cash").addEventListener("click", function () {
    openCashForm();
  });
  document.getElementById("cash-form").addEventListener("submit", saveCashForm);

  // Ganti tipe -> ganti saran kategori
  document.getElementById("cash-type").addEventListener("change", function () {
    document.getElementById("cash-category").value = "";
    isiOpsiKategori(this.value);
  });

  // Filter
  document.getElementById("cash-filter-type").addEventListener("change", renderCashbook);
  document.getElementById("cash-filter-month").addEventListener("change", renderCashbook);
  document.getElementById("cash-filter-clear").addEventListener("click", function () {
    document.getElementById("cash-filter-month").value = "";
    renderCashbook();
  });

  // Tombol Edit / Hapus
  document.getElementById("cash-table").addEventListener("click", function (event) {
    const tombol = event.target.closest("button[data-action]");
    if (!tombol) return;
    const id = tombol.dataset.id;

    if (tombol.dataset.action === "edit") {
      openCashForm(getItemById(KEYS.cashbook, id));
    } else if (tombol.dataset.action === "delete") {
      deleteCash(id);
    }
  });
}
