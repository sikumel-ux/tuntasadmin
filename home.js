// ==========================================
// 1. KONFIGURASI DATABASE FIREBASE
// ==========================================
// Pastikan URL ini persis seperti yang tertera di Firebase Console Anda
const DB_URL = "https://tuntas-04-default-rtdb.asia-southeast1.firebasedatabase.app";

// Variabel global untuk menyimpan data warga di memori aplikasi
let MEMORI_WARGA_GLOBAL = {};

// ==========================================
// 2. FUNGSI UTAMA: MEMUAT DATA WARGA
// ==========================================
async function muatSistemWarga() {
    try {
        // Mengambil data dari node "warga_rt04"
        const res = await fetch(`${DB_URL}/warga_rt04.json`);
        
        // Cek jika ada masalah koneksi / HTTP error
        if (!res.ok) {
            throw new Error(`HTTP Error! Status: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Simpan ke memori global (jika data null, jadikan objek kosong)
        MEMORI_WARGA_GLOBAL = data || {}; 
        
        const list = document.getElementById('listWarga');
        if (!list) return;
        
        list.innerHTML = ""; // Bersihkan kontainer sebelum memuat ulang
        
        // Panggil fungsi pembantu jika ada (jalankan jika fungsi tersebut didefinisikan)
        if (typeof saringDropdownWargaBerdasarkanTipe === "function") saringDropdownWargaBerdasarkanTipe();
        if (typeof perbaruiDropdownSampahOperasional === "function") perbaruiDropdownSampahOperasional();

        // Jika data dari Firebase ternyata kosong/belum ada sama sekali
        if (!data || Object.keys(data).length === 0) {
            list.innerHTML = `
                <div class="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-wide">
                    Belum ada data warga aktif di database.
                </div>`;
            return;
        }
        
        // Looping dan render data warga ke dalam HTML
        Object.keys(data).forEach(key => {
            const w = data[key];
            const namaWarga = w.nama ? w.nama.toUpperCase() : "TANPA NAMA";
            const tipeLabel = (w.tipe || 'tetap').toUpperCase();
            const usernameWa = w.username || w.hp || '-';
            const gabungBulan = w.bulan_bergabung || '-';
            const passWarga = w.password || '-';

            list.insertAdjacentHTML('beforeend', `
                <div class="p-3.5 flex justify-between items-center bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2">
                            <p class="font-extrabold text-slate-800 uppercase tracking-wide text-xs">${namaWarga}</p>
                            <span class="text-[7px] font-black px-1.5 py-0.5 rounded ${tipeLabel === 'PON' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}">${tipeLabel}</span>
                        </div>
                        <p class="text-[10px] text-slate-400 font-semibold">WA: ${usernameWa} | Pass: ${passWarga}</p>
                        <p class="text-[9px] text-slate-500 font-medium">Gabung: ${gabungBulan}</p>
                    </div>
                    <div class="flex gap-1.5">
                        <button type="button" onclick="bukaModalEditWarga('${key}')" class="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center hover:bg-teal-100 transition-all active:scale-95">
                            <i class="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button type="button" onclick="hapusWarga('${key}')" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all active:scale-95">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            `);
        });
    } catch (e) { 
        // Log error asli ke console browser untuk mempermudah debugging
        console.error("Detail Error Firebase:", e);
        
        const list = document.getElementById('listWarga');
        if (list) {
            list.innerHTML = `
                <div class="p-4 text-center text-xs text-rose-600 font-bold uppercase tracking-wide">
                    Gagal memuat koneksi database!<br>
                    <span class="text-[10px] text-slate-400 font-normal lowercase block mt-1">
                        Kemungkinan Firebase Rules masih dikunci atau koneksi internet bermasalah.
                    </span>
                </div>`;
        }
    }
}

// ==========================================
// 3. JALANKAN FUNGSI SAAT HALAMAN SELESAI DIMUAT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    muatSistemWarga();
});
