/* =========================================================
   products.js - Kelola produk (Tambah, Edit, Hapus)
   ========================================================= */

/** Menampilkan daftar produk ke tabel. */
function renderProducts() {
  const kataKunci = document.getElementById("product-search").value.trim().toLowerCase();
  const semua = getData(KEYS.products);

  const daftar = semua
    .filter(function (p) { return p.nama.toLowerCase().includes(kataKunci); })
    .sort(function (a, b) { return a.nama.localeCompare(b.nama); });

  setText("product-count", semua.length + " produk" +
    (kataKunci ? " (" + daftar.length + " cocok)" : ""));

  const tbody = document.getElementById("product-table");

  if (daftar.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">' +
      (semua.length === 0 ? 'Belum ada produk. Klik "+ Tambah Produk".' : "Produk tidak ditemukan") +
      "</td></tr>";
    return;
  }

  tbody.innerHTML = daftar.map(function (p) {
    const untung = p.hargaJual - p.hargaModal;
    let stok = String(p.stok);
    if (p.stok === 0) stok = '<span class="badge badge-out">Habis</span>';
    else if (p.stok <= BATAS_STOK_MENIPIS) stok = '<span class="badge badge-warn">' + p.stok + "</span>";

    return "<tr>" +
      "<td>" + escapeHTML(p.nama) + "</td>" +
      '<td class="right">' + formatRupiah(p.hargaModal) + "</td>" +
      '<td class="right">' + formatRupiah(p.hargaJual) + "</td>" +
      '<td class="right ' + (untung >= 0 ? "text-green" : "text-red") + '">' + formatRupiah(untung) + "</td>" +
      '<td class="right">' + stok + "</td>" +
      '<td class="right">' +
        '<button class="btn-icon" data-action="edit" data-id="' + p.id + '">Edit</button>' +
        '<button class="btn-icon danger" data-action="delete" data-id="' + p.id + '">Hapus</button>' +
      "</td>" +
      "</tr>";
  }).join("");
}

/**
 * Membuka form produk.
 * - Tanpa parameter        -> form kosong (tambah)
 * - Dengan produk ber-id   -> form edit
 * - Dengan data tanpa id   -> form tambah yang sudah terisi (dari Kalkulator)
 */
function openProductForm(produk) {
  const data = produk || {};
  const modeEdit = Boolean(data.id);

  document.getElementById("product-form").reset();
  setText("product-modal-title", modeEdit ? "Edit Produk" : "Tambah Produk");
  document.getElementById("product-id").value = data.id || "";
  document.getElementById("product-name").value = data.nama || "";
  document.getElementById("product-cost").value = data.hargaModal !== undefined ? data.hargaModal : "";
  document.getElementById("product-price").value = data.hargaJual !== undefined ? data.hargaJual : "";
  document.getElementById("product-stock").value = data.stok !== undefined ? data.stok : "";

  openModal("modal-product");
  document.getElementById("product-name").focus();
}

/** Dipanggil saat form produk disimpan. */
function saveProductForm(event) {
  event.preventDefault();

  const id = document.getElementById("product-id").value;
  const data = {
    nama: document.getElementById("product-name").value.trim(),
    hargaModal: Number(document.getElementById("product-cost").value),
    hargaJual: Number(document.getElementById("product-price").value),
    stok: parseInt(document.getElementById("product-stock").value, 10)
  };

  // Validasi sederhana
  if (!data.nama) {
    tampilkanPesan("Nama produk wajib diisi.", "error");
    return;
  }
  if (isNaN(data.hargaModal) || isNaN(data.hargaJual) || isNaN(data.stok) ||
      data.hargaModal < 0 || data.hargaJual < 0 || data.stok < 0) {
    tampilkanPesan("Harga dan stok harus berupa angka 0 atau lebih.", "error");
    return;
  }

  // Cek nama kembar (selain produk yang sedang diedit)
  const kembar = getData(KEYS.products).some(function (p) {
    return p.id !== id && p.nama.toLowerCase() === data.nama.toLowerCase();
  });
  if (kembar) {
    tampilkanPesan("Produk dengan nama ini sudah ada.", "error");
    return;
  }

  if (data.hargaJual < data.hargaModal &&
      !confirm("Harga jual lebih rendah dari harga modal (rugi). Tetap simpan?")) {
    return;
  }

  if (id) {
    updateItem(KEYS.products, id, data);
    tampilkanPesan("Produk diperbarui.");
  } else {
    data.dibuat = Date.now();
    addItem(KEYS.products, data);
    tampilkanPesan("Produk ditambahkan.");
  }

  closeModal("modal-product");
  refreshCurrentPage(); // dari app.js: tampilkan ulang halaman yang sedang aktif
}

function deleteProduct(id) {
  const produk = getItemById(KEYS.products, id);
  if (!produk) return;
  if (!confirm('Hapus produk "' + produk.nama + '"?\nNota lama yang memakai produk ini tetap aman.')) return;

  deleteItem(KEYS.products, id);
  tampilkanPesan("Produk dihapus.");
  renderProducts();
}

function initProducts() {
  document.getElementById("btn-add-product").addEventListener("click", function () {
    openProductForm();
  });

  document.getElementById("product-form").addEventListener("submit", saveProductForm);
  document.getElementById("product-search").addEventListener("input", renderProducts);

  // Event delegation: satu listener di tbody untuk semua tombol Edit/Hapus
  document.getElementById("product-table").addEventListener("click", function (event) {
    const tombol = event.target.closest("button[data-action]");
    if (!tombol) return;

    const id = tombol.dataset.id;
    if (tombol.dataset.action === "edit") {
      openProductForm(getItemById(KEYS.products, id));
    } else if (tombol.dataset.action === "delete") {
      deleteProduct(id);
    }
  });
}
