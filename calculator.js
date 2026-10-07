/* =========================================================
   calculator.js - Kalkulator HPP & Harga Jual

   Rumus:
   Total Modal        = Harga Modal + Biaya Tambahan
   HPP per Unit       = Total Modal / Jumlah Produk
   Harga Jual         = HPP + (HPP x Target Keuntungan %)
                        (dibulatkan ke atas ke kelipatan Rp 100)
   Untung per Unit    = Harga Jual - HPP
   Untung Total       = Untung per Unit x Jumlah Produk
   ========================================================= */

let hasilKalkulator = null; // hasil terakhir, dipakai tombol "Simpan sebagai Produk"

/** Fungsi murni: hanya menghitung, tidak menyentuh HTML. */
function hitungHPP(hargaModal, biayaTambahan, jumlahProduk, targetPersen) {
  const totalModal = hargaModal + biayaTambahan;
  const hpp = jumlahProduk > 0 ? totalModal / jumlahProduk : 0;
  const hargaJualMentah = hpp + (hpp * targetPersen / 100);

  // Math.round dulu untuk menghindari angka seperti 1300.0000001
  const hargaJual = Math.ceil(Math.round(hargaJualMentah) / 100) * 100;
  const untungPerUnit = hargaJual - hpp;

  return {
    totalModal: totalModal,
    hpp: hpp,
    hargaJual: hargaJual,
    untungPerUnit: untungPerUnit,
    untungTotal: untungPerUnit * jumlahProduk,
    jumlahProduk: jumlahProduk
  };
}

/** Ambil angka dari input. Jika kosong/salah, hasilnya 0. */
function ambilAngka(id) {
  const nilai = Number(document.getElementById(id).value);
  return isNaN(nilai) || nilai < 0 ? 0 : nilai;
}

function renderCalculator() {
  const hargaModal = ambilAngka("calc-cost");
  const biayaTambahan = ambilAngka("calc-extra");
  const jumlah = Math.floor(ambilAngka("calc-qty")) || 1;
  const target = ambilAngka("calc-margin");

  const hasil = hitungHPP(hargaModal, biayaTambahan, jumlah, target);
  hasilKalkulator = hasil;

  setText("calc-total", formatRupiah(hasil.totalModal));
  setText("calc-hpp", formatRupiah(hasil.hpp));
  setText("calc-price", formatRupiah(hasil.hargaJual));
  setText("calc-profit-unit", formatRupiah(hasil.untungPerUnit));
  setText("calc-profit-total", formatRupiah(hasil.untungTotal));
}

function initCalculator() {
  // Hitung otomatis setiap kali user mengetik
  document.getElementById("calc-form").addEventListener("input", renderCalculator);

  // Tombol reset: tunggu form ter-reset dulu, baru hitung ulang
  document.getElementById("calc-form").addEventListener("reset", function () {
    setTimeout(renderCalculator, 0);
  });

  // Kirim hasil ke form Produk
  document.getElementById("calc-save-product").addEventListener("click", function () {
    if (!hasilKalkulator || hasilKalkulator.totalModal <= 0) {
      tampilkanPesan("Isi harga modal terlebih dahulu.", "error");
      return;
    }
    openProductForm({
      nama: "",
      hargaModal: Math.round(hasilKalkulator.hpp),
      hargaJual: hasilKalkulator.hargaJual,
      stok: hasilKalkulator.jumlahProduk
    });
  });
}
