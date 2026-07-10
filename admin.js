// ==========================================
// ADMIN WORKFLOW & SUBMISSION STORAGE LOGIC
// ==========================================
const FIREBASE_DB_ADMIN_URL = "https://tuntas-04-default-rtdb.asia-southeast1.firebasedatabase.app";

/**
 * Fungsi Utama Simpan Catatan Iuran Sampah oleh Pengurus/Admin
 * @param {Object} dataInputForm - Data tampungan object dari form admin
 */
async function simpanIuranOlehAdmin(dataInputForm) {
    // Sediakan Overlay Loading jika element tersedia di admin panel
    const overlay = document.getElementById('loadingOverlayAdmin');
    if (overlay) overlay.style.display = 'flex';

    // Susun Blueprint Struktur Data Utama
    let payloadIuran = {
        warga_key: dataInputForm.wargaKey,                        // ID unik key warga di firebase
        nama_warga: dataInputForm.namaWarga,                      // Nama lengkap warga bersangkutan
        tipe_user: dataInputForm.tipeUser,                        // Berisi nilai "Anggota Tetap" atau "PON"
        nominal: parseInt(dataInputForm.nominalInput) || 0,        // Jumlah uang iuran/bakar sampah
        token_kuitansi: "T-" + Math.floor(100000 + Math.random() * 900000), // Token 6 digit acak
        tanggal: dataInputForm.tanggalHariIni,                     // Tanggal input hari ini, misal: "7 Juni 2026"
        nama_petugas: dataInputForm.namaAdminLogin || "APRIYANTO" // Nama Admin pelaksana
    };

    // ATUR SINKRONISASI PAYLOAD KONDISIONAL BERDASARKAN STRUKTUR USER REQUEST
    const tipeAkunUser = (dataInputForm.tipeUser || 'Anggota Tetap').toUpperCase();

    if (tipeAkunUser === "PON") {
        payloadIuran.hari = dataInputForm.hariPembakaran;         // Diisi nama hari, misal: "Jumat"
        payloadIuran.tanggal_setor = dataInputForm.tanggalBakar;  // Diisi tanggal pembakaran, misal: "10 Juli 2026"
    } else {
        payloadIuran.bulan = dataInputForm.pilihanBulan;          // Diisi nama bulan iuran, misal: "Juni"
    }

    try {
        // Eksekusi Pengiriman Data ke Node iuran_sampah.json di Firebase Database
        const response = await fetch(`${FIREBASE_DB_ADMIN_URL}/iuran_sampah.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadIuran)
        });

        if (!response.ok) throw new Error("Respon server Firebase bermasalah.");

        // Jika form admin memiliki fungsi reset otomatis setelah sukses
        const formElement = document.getElementById('formInputIuranAdmin');
        if (formElement) formElement.reset();

        // Tampilkan notifikasi sukses kepada admin
        if (typeof showNotifAdmin === "function") {
            showNotifAdmin('Catatan Iuran Berhasil Disimpan!', 'sukses');
        } else {
            alert("Catatan Iuran Berhasil Disimpan!");
        }

    } catch (error) {
        console.error("Gagal melakukan penyimpanan data iuran ke firebase:", error);
        if (typeof showNotifAdmin === "function") {
            showNotifAdmin('Gagal menyimpan iuran, periksa jaringan!', 'gagal');
        } else {
            alert("Gagal menyimpan data iuran warga.");
        }
    } finally {
        if (overlay) overlay.style.display = 'none';
    }
}

/**
 * Contoh Fungsi helper Opsional untuk sistem notifikasi di dashboard admin
 */
function showNotifAdmin(msg, type) {
    const alertBox = document.getElementById('adminNotificationAlert');
    if (!alertBox) return;
    
    alertBox.className = `fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-xl text-xs font-bold ${type === 'sukses' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`;
    alertBox.innerText = msg;
    alertBox.classList.remove('hidden');
    
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 3000);
}
