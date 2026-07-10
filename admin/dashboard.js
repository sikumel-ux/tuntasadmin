const firebaseConfig = {
    apiKey: "AIzaSyCzz0INhgBUARAxqLlMnCC8vyCciI9jpJk",
    authDomain: "tuntas-04.firebaseapp.com",
    databaseURL: "https://tuntas-04-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "tuntas-04",
    storageBucket: "tuntas-04.firebasestorage.app",
    messagingSenderId: "509433415219",
    appId: "1:509433415219:web:e485a0eab1a612fda64546"
};

const DB_URL = firebaseConfig.databaseURL;

// ==========================================
// ⚠️ ATUR DOMAIN APLIKASI WARGA KAMU DI SINI
// ==========================================
const DOMAIN_UTAMA_WARGA = "https://m.tuntas.web.id"; 

let dataWargaGlobal = {};

window.addEventListener('DOMContentLoaded', async () => {
    // Jalankan pengecekan session admin sederhana jika diperlukan
    const sesi = JSON.parse(localStorage.getItem("warga_session"));
    if(sesi) {
        document.getElementById('namaAdmin').innerText = `Admin: ${sesi.nama}`;
    }

    // Ambil basis data awal secara parallel
    await muatDaftarWarga();
    await muatRiwayatIuran();

    // Event Listener interaktif jika pilihan warga berubah tipe (PON / Tetap)
    document.getElementById('inputPilihWarga').addEventListener('change', (e) => {
        const keyWarga = e.target.value;
        const akun = dataWargaGlobal[keyWarga];
        const rowBulan = document.getElementById('rowFormBulan');
        
        if (akun && akun.tipe === "PON") {
            rowBulan.style.display = 'none'; // Sembunyikan jika Sektor PON
        } else {
            rowBulan.style.display = 'block'; // Tampilkan jika Anggota Tetap
        }
    });

    // Handler Kirim Form Iuran
    document.getElementById('formInputIuran').addEventListener('submit', prosesInputIuranBaru);
});

// 1. Ambil List Warga RT 04 dari Firebase untuk Dropdown & Widget
async function muatDaftarWarga() {
    try {
        const res = await fetch(`${DB_URL}/warga_rt04.json`);
        const data = await res.json();
        dataWargaGlobal = data || {};

        const selectWarga = document.getElementById('inputPilihWarga');
        selectWarga.innerHTML = '<option value="" disabled selected>-- Pilih Anggota Warga --</option>';

        let totalTetap = 0;
        let totalPon = 0;

        Object.keys(dataWargaGlobal).forEach(key => {
            const warga = dataWargaGlobal[key];
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = `${warga.nama} (${warga.tipe || 'Anggota Tetap'})`;
            selectWarga.appendChild(opt);

            // Hitung statistik widget
            if(warga.tipe === "PON") { totalPon++; } else { totalTetap++; }
        });

        document.getElementById('widgetTotalTetap').innerHTML = `${totalTetap} <span class="text-xs text-slate-500 font-bold">Jiwa</span>`;
        document.getElementById('widgetTotalPon').innerHTML = `${totalPon} <span class="text-xs text-slate-500 font-bold">User</span>`;

    } catch (error) {
        console.error("Gagal memuat daftar warga:", error);
    }
}

// 2. Ambil Riwayat Transaksi Iuran dari Firebase
async function muatRiwayatIuran() {
    try {
        const res = await fetch(`${DB_URL}/iuran_sampah.json`);
        const data = await res.json();
        const tabel = document.getElementById('tabelRiwayatIuran');
        tabel.innerHTML = '';

        if (!data) {
            tabel.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-zinc-600 font-bold uppercase">Belum ada riwayat pembayaran.</td></tr>`;
            return;
        }

        let totalKas = 0;
        let lunasBulanIni = 0;
        const bulanSekarang = "Juni"; // Bisa disesuaikan dinamis jika perlu

        // Urutkan berdasarkan data terbaru (terbalik)
        const keysTerbalik = Object.keys(data).reverse();

        keysTerbalik.forEach(key => {
            const iuran = data[key];
            const nominal = parseInt(iuran.nominal) || 0;
            totalKas += nominal;

            if (iuran.bulan === bulanSekarang && iuran.tipe_user !== "PON") {
                lunasBulanIni++;
            }

            const tr = document.createElement('tr');
            tr.className = "border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors";
            
            // Generate link url kuitansi eksternal absolut ke subdomain/domain warga
            const urlKuitansi = `${DOMAIN_UTAMA_WARGA}/kuitansi/index.html?id=${key}`;
            
            // Pesan WhatsApp otomatis untuk warga
            const teksWA = window.encodeURIComponent(`Halo Bpk/Ibu ${iuran.nama_warga}, berikut adalah bukti pembayaran resmi iuran sampah TUNTAS RT 04 Anda. Silakan lihat kuitansi digital di tautan berikut: ${urlKuitansi}`);

            tr.innerHTML = `
                <td class="py-3 px-2">
                    <div class="font-black text-white uppercase">${iuran.nama_warga}</div>
                    <div class="text-[9px] text-zinc-500 tracking-wider">${iuran.tipe_user === 'PON' ? 'Sektor PON' : 'Warga Tetap'}</div>
                </td>
                <td class="py-3 px-2 text-zinc-400 font-medium">${iuran.tipe_user === 'PON' ? '<span class="text-teal-500">Insidental</span>' : iuran.bulan}</td>
                <td class="py-3 px-2 font-black text-emerald-400">Rp ${nominal.toLocaleString('id-ID')}</td>
                <td class="py-3 px-2 text-center flex items-center justify-center gap-1.5 h-full pt-4">
                    <a href="${urlKuitansi}" target="_blank" class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-2 py-1 rounded-md text-[10px] font-bold transition-all">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Struk
                    </a>
                    <a href="https://api.whatsapp.com/send?text=${teksWA}" target="_blank" class="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2 py-1 rounded-md text-[10px] font-bold transition-all">
                        <i class="fa-brands fa-whatsapp"></i> Bagikan
                    </a>
                </td>
            `;
            tabel.appendChild(tr);
        });

        // Update nilai widget atas
        document.getElementById('widgetTotalKas').innerText = `Rp ${totalKas.toLocaleString('id-ID')}`;
        document.getElementById('widgetWargaLunas').innerHTML = `${lunasBulanIni} <span class="text-xs text-slate-500 font-bold">Warga</span>`;

    } catch (error) {
        console.error("Gagal memuat riwayat transaksi:", error);
    }
}

// 3. Proses Simpan Transaksi Iuran Baru ke Firebase
async function prosesInputIuranBaru(e) {
    e.preventDefault();
    
    const keyWargaSelected = document.getElementById('inputPilihWarga').value;
    const nominalInput = document.getElementById('inputNominalIuran').value.trim();
    const bulanInput = document.getElementById('inputBulanIuran').value;
    
    if(!keyWargaSelected) return;
    
    const warga = dataWargaGlobal[keyWargaSelected];
    const infoSesiAdmin = JSON.parse(localStorage.getItem("warga_session")) || { nama: "APRIYANO" };
    
    // Set format penanggalan lokal
    const opsiTanggal = { year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalHariIni = new Date().toLocaleDateString('id-ID', opsiTanggal);

    // Bikin string token kuitansi acak acuan
    const tokenAcak = "T-" + Math.floor(100000 + Math.random() * 900000);

    // Susun payload terstandarisasi untuk database
    const payloadIuran = {
        username: warga.username,
        nama_warga: warga.nama,
        tipe_user: warga.tipe || "Anggota Tetap",
        nominal: parseInt(nominalInput),
        bulan: warga.tipe === "PON" ? "PON-NON-BULANAN" : bulanInput,
        tanggal: tanggalHariIni,
        token_kuitansi: tokenAcak,
        nama_petugas: infoSesiAdmin.nama
    };

    try {
        const res = await fetch(`${DB_URL}/iuran_sampah.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadIuran)
        });

        if (res.ok) {
            tampilkanToast("Kuitansi Berhasil Diterbitkan!");
            document.getElementById('formInputIuran').reset();
            
            // Set default baris bulan kembali muncul jika sebelumnya tersembunyi
            document.getElementById('rowFormBulan').style.display = 'block';

            // Muat ulang data biar langsung sinkron ter-update
            await muatRiwayatIuran();
        }
    } catch (error) {
        alert("Gagal menyimpan data ke database server.");
    }
}

function tampilkanToast(pesan) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastText').innerText = pesan;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

function prosesLogoutAdmin() {
    localStorage.removeItem("warga_session");
    alert("Sesi keluar berhasil.");
    window.location.reload();
}
