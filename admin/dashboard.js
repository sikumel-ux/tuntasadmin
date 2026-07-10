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
    // Membaca sesi login pengurus RT jika ada
    const sesi = JSON.parse(localStorage.getItem("warga_session"));
    if(sesi) {
        document.getElementById('namaAdmin').innerText = `Admin: ${sesi.nama}`;
    }

    // Memuat data secara paralel dari Firebase Realtime DB
    await muatDaftarWarga();
    await muatRiwayatIuran();
    await muatSaranWarga();

    // Event listener interaktif: Sembunyikan bulan jika warga bertipe PON
    document.getElementById('inputPilihWarga').addEventListener('change', (e) => {
        const keyWarga = e.target.value;
        const akun = dataWargaGlobal[keyWarga];
        const rowBulan = document.getElementById('rowFormBulan');
        
        if (akun && akun.tipe === "PON") {
            rowBulan.style.display = 'none';
        } else {
            rowBulan.style.display = 'block';
        }
    });

    // Submit handler form input iuran sampah
    document.getElementById('formInputIuran').addEventListener('submit', prosesInputIuranBaru);
});

// ==========================================
// 1. MODUL WARGA (`warga_rt04`)
// ==========================================
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

            if(warga.tipe === "PON") { 
                totalPon++; 
            } else { 
                totalTetap++; 
            }
        });

        document.getElementById('widgetTotalTetap').innerHTML = `${totalTetap} <span class="text-xs text-slate-400 font-bold">Jiwa</span>`;
        document.getElementById('widgetTotalPon').innerHTML = `${totalPon} <span class="text-xs text-slate-400 font-bold">User</span>`;
    } catch (error) {
        console.error("Gagal memuat basis data warga:", error);
    }
}

// ==========================================
// 2. MODUL KEUANGAN IURAN (`iuran_sampah`)
// ==========================================
async function muatRiwayatIuran() {
    try {
        const res = await fetch(`${DB_URL}/iuran_sampah.json`);
        const data = await res.json();
        const tabel = document.getElementById('tabelRiwayatIuran');
        tabel.innerHTML = '';

        if (!data) {
            tabel.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400 font-bold uppercase tracking-wider">Belum ada riwayat pembayaran.</td></tr>`;
            return;
        }

        let totalKas = 0; 
        let lunasBulanIni = 0;
        const bulanSekarang = "Juni"; 
        const keysTerbalik = Object.keys(data).reverse();

        keysTerbalik.forEach(key => {
            const iuran = data[key];
            const nominal = parseInt(iuran.nominal) || 0;
            totalKas += nominal;

            if (iuran.bulan === bulanSekarang && iuran.tipe_user !== "PON") { 
                lunasBulanIni++; 
            }

            // Routing URL Kuitansi memakai parameter token_kuitansi (T-XXXXXX)
            const tokenKuitansi = iuran.token_kuitansi || "T-000000";
            const urlKuitansi = `${DOMAIN_UTAMA_WARGA}/kuitansi/?id=${tokenKuitansi}`;
            
            // Format encode pesan WhatsApp otomatis
            const teksWA = window.encodeURIComponent(`Halo Bpk/Ibu ${iuran.nama_warga}, berikut adalah bukti pembayaran resmi iuran sampah TUNTAS RT 04 Anda. Silakan lihat kuitansi digital di tautan berikut: ${urlKuitansi}`);

            const tr = document.createElement('tr');
            tr.className = "border-b border-slate-100 hover:bg-slate-50 transition-colors";
            tr.innerHTML = `
                <td class="py-3 px-2">
                    <div class="font-black text-slate-800 uppercase text-[11px]">${iuran.nama_warga}</div>
                    <div class="text-[9px] text-slate-400 font-bold tracking-wider">${iuran.tipe_user === 'PON' ? 'Sektor PON' : 'Warga Tetap'}</div>
                </td>
                <td class="py-3 px-2 text-slate-500 font-bold">${iuran.tipe_user === 'PON' ? '<span class="text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded text-[10px]">Insidental</span>' : iuran.bulan}</td>
                <td class="py-3 px-2 font-black text-[#0A5C36]">Rp ${nominal.toLocaleString('id-ID')}</td>
                <td class="py-3 px-2 text-center flex items-center justify-center gap-1.5 pt-3.5">
                    <a href="${urlKuitansi}" target="_blank" class="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2 py-1 rounded-md text-[10px] font-black transition-all">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Struk
                    </a>
                    <a href="https://api.whatsapp.com/send?text=${teksWA}" target="_blank" class="bg-emerald-50 hover:bg-[#0A5C36] text-[#0A5C36] hover:text-white border border-emerald-200 px-2 py-1 rounded-md text-[10px] font-black transition-all">
                        <i class="fa-brands fa-whatsapp"></i> Bagikan
                    </a>
                </td>
            `;
            tabel.appendChild(tr);
        });

        document.getElementById('widgetTotalKas').innerText = `Rp ${totalKas.toLocaleString('id-ID')}`;
        document.getElementById('widgetWargaLunas').innerHTML = `${lunasBulanIni} <span class="text-xs text-slate-400 font-bold">Warga</span>`;
    } catch (error) {
        console.error("Gagal memuat riwayat pembayaran:", error);
    }
}

async function prosesInputIuranBaru(e) {
    e.preventDefault();
    const keyWargaSelected = document.getElementById('inputPilihWarga').value;
    const nominalInput = document.getElementById('inputNominalIuran').value.trim();
    const bulanInput = document.getElementById('inputBulanIuran').value;
    
    if(!keyWargaSelected) return;
    
    const warga = dataWargaGlobal[keyWargaSelected];
    const infoSesiAdmin = JSON.parse(localStorage.getItem("warga_session")) || { nama: "APRIYANO" };
    const opsiTanggal = { year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalHariIni = new Date().toLocaleDateString('id-ID', opsiTanggal);

    // Generate kode token_kuitansi acak 6 angka sesuai struktur (T-XXXXXX)
    const angkaRandom = Math.floor(100000 + Math.random() * 900000);
    const tokenAcak = `T-${angkaRandom}`;

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
            document.getElementById('rowFormBulan').style.display = 'block';
            await muatRiwayatIuran();
        }
    } catch (error) {
        alert("Gagal mengamankan data ke Realtime DB Server.");
    }
}

// ==========================================
// 3. MODUL KOTAK SARAN & KRITIK (`saran_warga`)
// ==========================================
async function muatSaranWarga() {
    try {
        const res = await fetch(`${DB_URL}/saran_warga.json`);
        const data = await res.json();
        const container = document.getElementById('containerSaranWarga');
        container.innerHTML = '';

        if (!data) {
            container.innerHTML = `<div class="col-span-2 py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">Kotak saran masih kosong, bro.</div>`;
            return;
        }

        Object.keys(data).reverse().forEach(key => {
            const item = data[key];
            const div = document.createElement('div');
            div.className = "bg-white border border-slate-200/70 p-5 rounded-2xl space-y-3 flex flex-col justify-between shadow-sm";
            
            div.innerHTML = `
                <div class="space-y-1.5">
                    <div class="flex justify-between items-start">
                        <h4 class="font-black text-xs text-slate-800 uppercase tracking-tight">${item.nama_warga || 'Warga Anonim'}</h4>
                        <span class="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">${item.tanggal || '-'}</span>
                    </div>
                    <p class="text-xs text-slate-600 font-medium leading-relaxed italic">"${item.isi_saran || '-'}"</p>
                </div>
                <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span class="text-[8px] font-black uppercase text-amber-700 tracking-wider bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                        <i class="fa-solid fa-envelope"></i> Aspirasi Masuk
                    </span>
                    <button onclick="hapusSaranWarga('${key}')" class="text-slate-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-wider transition-colors">
                        <i class="fa-solid fa-trash-can mr-1"></i> Hapus
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Gagal mengambil data saran:", error);
    }
}

async function hapusSaranWarga(key) {
    if(!confirm("Hapus aspirasi warga ini dari panel kontrol?")) return;
    try {
        const res = await fetch(`${DB_URL}/saran_warga/${key}.json`, { method: 'DELETE' });
        if(res.ok) {
            tampilkanToast("Saran Berhasil Dihapus");
            await muatSaranWarga();
        }
    } catch (error) {
        alert("Gagal memproses penghapusan.");
    }
}

// ==========================================
// 4. UTILITAS INTERFASI (Toast & Tab Switcher)
// ==========================================
function switchTabAdmin(targetTab) {
    // Sembunyikan seluruh tab content
    document.querySelectorAll('.tab-content-admin').forEach(el => el.classList.add('hidden'));
    
    // Ubah semua tombol nav kembali ke gaya unselected (Light Mode)
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('bg-[#0A5C36]', 'text-white', 'shadow-sm');
        btn.classList.add('bg-white', 'text-slate-500', 'border', 'border-slate-200');
    });

    // Nyalakan tab target & beri warna hijau utama
    document.getElementById(`contentTab-${targetTab}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`btnTab-${targetTab}`);
    activeBtn.classList.remove('bg-white', 'text-slate-500', 'border', 'border-slate-200');
    activeBtn.classList.add('bg-[#0A5C36]', 'text-white', 'shadow-sm');
}

function tampilkanToast(pesan) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastText').innerText = pesan;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

function prosesLogoutAdmin() {
    localStorage.removeItem("warga_session");
    alert("Sesi admin telah berakhir.");
    window.location.reload();
}
