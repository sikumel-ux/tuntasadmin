// =========================================================================
// 1. KONFIGURASI UTAMA DATABASE FIREBASE
// =========================================================================
// URL Firebase Realtime Database sesuai dengan region asia-southeast1 proyek tuntas-04
const DB_URL = "https://tuntas-04-default-rtdb.asia-southeast1.firebasedatabase.app";

// Variabel penampung data warga secara global di memori aplikasi
let MEMORI_WARGA_GLOBAL = {};

// =========================================================================
// 2. FUNGSI UTAMA: MEMUAT DATA WARGA DARI FIREBASE
// =========================================================================
async function muatSistemWarga() {
    try {
        // Melakukan request GET ke node warga_rt04.json dengan header standar
        const res = await fetch(`${DB_URL}/warga_rt04.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Cek jika status HTTP bukan 200-299 (misal 404 atau 500)
        if (!res.ok) {
            throw new Error(`Respon server bermasalah (HTTP ${res.status})`);
        }
        
        const data = await res.json();
        
        // Masukkan ke memori global, jika null pasang objek kosong agar tidak crash
        MEMORI_WARGA_GLOBAL = data || {}; 
        
        const list = document.getElementById('listWarga');
        if (!list) return;
        
        // Bersihkan area list sebelum data baru dimasukkan
        list.innerHTML = ""; 
        
        // Cek pengaman jika fungsi dropdown opsional Anda ada di file lain
        if (typeof saringDropdownWargaBerdasarkanTipe === "function") saringDropdownWargaBerdasarkanTipe();
        if (typeof perbaruiDropdownSampahOperasional === "function") perbaruiDropdownSampahOperasional();

        // Jika data di Firebase kosong/belum ada isinya sama sekali
        if (!data || Object.keys(data).length === 0) {
            list.innerHTML = `
                <div class="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-wide">
                    Belum ada data warga aktif di database.
                </div>`;
            return;
        }
        
        // Looping data warga dan masukkan ke struktur HTML secara dinamis
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
        // Mencetak log lengkap di console F12 browser
        console.error("Detail Eror Sistem:", e);
        
        const list = document.getElementById('listWarga');
        if (list) {
            list.innerHTML = `
                <div class="p-5 text-center bg-rose-50 rounded-xl border border-rose-100">
                    <p class="text-xs text-rose-700 font-black uppercase tracking-wide flex items-center justify-center gap-1">
                        <i class="fa-solid fa-circle-exclamation"></i> Gagal memuat koneksi database!
                    </p>
                    <span class="text-[10px] text-slate-500 font-mono block mt-2 p-1.5 bg-white rounded border border-slate-200 text-left overflow-x-auto break-all">
                        <strong>Log Eror:</strong> ${e.message}
                    </span>
                    <span class="text-[9px] text-slate-400 block mt-2">
                        Solusi: Cek koneksi internet atau buka via server lokal (Live Server).
                    </span>
                </div>`;
        }
    }
}

// =========================================================================
// 3. EVENT LISTENER: JALANKAN OTOMATIS SAAT HALAMAN SELESAI DI-LOAD
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    muatSistemWarga();
});
