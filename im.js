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
let MEMORI_WARGA_GLOBAL = {}; 
let MEMORI_IURAN_GLOBAL = {}; 
let DATA_KAS_TERFILTER = []; 
let ACTION_HAPUS_CALLBACK = null; 
let BULAN_TERPILIH_ARRAY = [];

window.addEventListener('DOMContentLoaded', () => {
    const hariIni = new Date();
    const y = hariIni.getFullYear();
    const m = String(hariIni.getMonth() + 1).padStart(2, '0');
    const d = String(hariIni.getDate()).padStart(2, '0');
    
    document.getElementById('filterMulai').value = `${y}-${m}-01`;
    document.getElementById('filterSelesai').value = `${y}-${m}-${d}`;
    document.getElementById('iuranTgl').value = `${y}-${m}-${d}`;
    document.getElementById('smphTgl').value = `${y}-${m}-${d}`;
    
    if(document.getElementById('kasTgl')) {
        document.getElementById('kasTgl').value = `${y}-${m}-${d}`;
    }

    if(document.getElementById('calFilterBulan')) document.getElementById('calFilterBulan').value = hariIni.getMonth();
    if(document.getElementById('calFilterTahun')) document.getElementById('calFilterTahun').value = y;

    pilihStatusSampah('diambil');

    document.getElementById('btnBatalHapus').addEventListener('click', () => closeModal('mKonfirmasiHapus'));
    document.getElementById('btnYakinHapus').addEventListener('click', () => {
        if(typeof ACTION_HAPUS_CALLBACK === 'function') ACTION_HAPUS_CALLBACK();
        closeModal('mKonfirmasiHapus');
    });

    sinkronUlangData();
});

function generateKodePON() {
    return `T-${Math.floor(100000 + Math.random() * 900000)}`;
}

function dapatkanKeteranganHariTanggal(tanggalString) {
    if (!tanggalString) return "";
    const daftarHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const daftarBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const dateObj = new Date(tanggalString);
    return `${daftarHari[dateObj.getDay()]} , ${dateObj.getDate()} ${daftarBulan[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function saringDropdownWargaBerdasarkanTipe() {
    const tipeTerpilih = document.getElementById('iuranTipeAnggota').value.toLowerCase(); 
    const dropdownWarga = document.getElementById('iuranWarga');
    const boxBulan = document.getElementById('boxPilihanBulanWrapper');
    
    dropdownWarga.innerHTML = '<option value="">-- PILIH NAMA WARGA --</option>';
    resetPilihanBulan();
    document.getElementById('iuranPon').value = "";

    if (tipeTerpilih === 'pon') {
        boxBulan.classList.add('hidden');
    } else {
        boxBulan.classList.remove('hidden');
    }

    Object.keys(MEMORI_WARGA_GLOBAL).forEach(key => {
        const warga = MEMORI_WARGA_GLOBAL[key];
        const tipeWarga = (warga.tipe || 'tetap').toLowerCase(); 
        
        if (tipeWarga === tipeTerpilih) {
            dropdownWarga.insertAdjacentHTML('beforeend', `<option value="${key}">${warga.nama.toUpperCase()}</option>`);
        }
    });
}

function perbaruiDropdownSampahOperasional() {
    const d2 = document.getElementById('smphWarga');
    d2.innerHTML = '<option value="">-- PILIH NAMA WARGA --</option>';
    
    Object.keys(MEMORI_WARGA_GLOBAL).forEach(key => {
        const w = MEMORI_WARGA_GLOBAL[key];
        const label = (w.tipe || 'tetap').toUpperCase();
        d2.insertAdjacentHTML('beforeend', `<option value="${key}">[${label}] ${w.nama.toUpperCase()}</option>`);
    });
}

function tanganiPerubahanWarga(selectElement) {
    const inputPon = document.getElementById('iuranPon');
    if (selectElement.value !== "") {
        inputPon.value = generateKodePON();
    } else {
        inputPon.value = "";
    }
}

function pilihBalanIuran(bulanCode) {
    const el = document.querySelector(`.month-chip[data-month="${bulanCode}"]`);
    const index = BULAN_TERPILIH_ARRAY.indexOf(bulanCode);
    
    if (index > -1) {
        BULAN_TERPILIH_ARRAY.splice(index, 1);
        el.classList.remove('selected');
    } else {
        BULAN_TERPILIH_ARRAY.push(bulanCode);
        el.classList.add('selected');
    }
    
    const tahunAktif = new Date(document.getElementById('iuranTgl').value).getFullYear() || 2026;
    if(BULAN_TERPILIH_ARRAY.length > 0) {
        document.getElementById('iuranBulan').value = `${BULAN_TERPILIH_ARRAY.join(', ')} ${tahunAktif}`;
    } else {
        document.getElementById('iuranBulan').value = "";
    }
}

function pilihStatusSampah(statusCode) {
    document.querySelectorAll('.status-card').forEach(card => card.classList.remove('selected'));
    document.getElementById(`status-${statusCode}`).classList.add('selected');
    document.getElementById('smphStatus').value = statusCode;
}

function resetPilihanBulan() {
    BULAN_TERPILIH_ARRAY = [];
    document.querySelectorAll('.month-chip').forEach(el => el.classList.remove('selected'));
    document.getElementById('iuranBulan').value = "";
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function showNotif(msg, type) {
    const box = document.getElementById('notificationAlert'); 
    const icon = document.getElementById('notifIcon'); 
    const text = document.getElementById('notifText'); 
    text.innerText = msg;
    box.className = `fixed top-4 left-1/2 -translate-x-1/2 w-11/12 max-w-sm z-[99999] p-4 rounded-2xl shadow-lg border text-xs font-black uppercase tracking-wide flex items-center gap-2.5 transition-all duration-300 ${type==='sukses'?'bg-emerald-50 border-emerald-200 text-emerald-800':'bg-rose-50 border-rose-200 text-rose-800'}`;
    icon.className = `fa-solid ${type==='sukses'?'fa-circle-check text-emerald-600':'fa-circle-xmark text-rose-600'} text-base`;
    box.classList.remove('hidden'); setTimeout(() => box.classList.add('hidden'), 3000);
}

function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('btn-top-modul').className = "w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all";
    document.getElementById(id).classList.add('active');
    if (id === 'scr-kas') document.getElementById('nav-btn-kas').classList.add('active');
    else if (id === 'scr-warga') document.getElementById('nav-btn-warga').classList.add('active');
    else if (id === 'scr-sampah') document.getElementById('nav-btn-sampah').classList.add('active');
    else if (id === 'scr-riwayat') document.getElementById('nav-btn-riwayat').classList.add('active');
    else if (id === 'scr-modul') document.getElementById('btn-top-modul').className = "w-8 h-8 rounded-lg bg-emerald-950 text-white flex items-center justify-center transition-all";
}

async function sinkronUlangData() {
    document.getElementById('loadingOverlay').style.display = 'flex';
    try {
        await Promise.all([muatSistemKas(), muatSistemWarga(), muatRiwayatIuran()]);
    } catch (err) { console.error(err); }
    finally { document.getElementById('loadingOverlay').style.display = 'none'; }
}

async function muatSistemKas() {
    try {
        const res = await fetch(`${DB_URL}/kas_rt04.json`);
        const data = await res.json();
        const list = document.getElementById('listMutasiKasMasyarakat');
        list.innerHTML = "";

        let start = new Date(document.getElementById('filterMulai').value);
        let end = new Date(document.getElementById('filterSelesai').value);
        end.setHours(23,59,59,999);

        let saldoKeseluruhan = 0; let sldTerapit = 0, mskTerapit = 0, klrTerapit = 0;
        DATA_KAS_TERFILTER = [];

        if(!data) {
            updateTampilanCardKas(0, 0, 0, 0);
            list.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-bold uppercase">Buku Kas Kosong.</div>`;
            return;
        }

        Object.keys(data).forEach(key => {
            const v = data[key]; const nom = parseInt(v.nominal) || 0; const tglItem = new Date(v.tanggal);
            if(v.jenis === 'masuk') saldoKeseluruhan += nom; else saldoKeseluruhan -= nom;

            if(tglItem >= start && tglItem <= end) {
                if(v.jenis === 'masuk') mskTerapit += nom; else klrTerapit += nom;
                sldTerapit = mskTerapit - klrTerapit;
                DATA_KAS_TERFILTER.push({ tanggal: v.tanggal, keterangan: v.keterangan, jenis: v.jenis, nominal: nom });

                list.insertAdjacentHTML('afterbegin', `
                    <div class="p-4 flex justify-between items-center bg-white">
                        <div class="pr-2 flex-1">
                            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide leading-tight">${v.keterangan}</h4>
                            <p class="text-[9px] font-mono text-slate-400 mt-0.5">${v.tanggal}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-black ${v.jenis==='masuk'?'text-emerald-600':'text-rose-600'} whitespace-nowrap">
                                ${v.jenis==='masuk'?'+':'-'} ${nom.toLocaleString('id-ID')}
                            </span>
                            <button onclick="hapusKas('${key}')" class="text-slate-200 hover:text-rose-600 p-1"><i class="fa-solid fa-trash-can text-xs"></i></button>
                        </div>
                    </div>
                `);
            }
        });
        updateTampilanCardKas(saldoKeseluruhan, sldTerapit, mskTerapit, klrTerapit);
    } catch (e) { console.error(e); }
}

function updateTampilanCardKas(sk, sf, m, k) {
    document.getElementById('totalSaldoKeseluruhan').innerText = "Rp " + sk.toLocaleString('id-ID');
    document.getElementById('totalSaldo').innerText = sf.toLocaleString('id-ID');
    document.getElementById('textMasuk').innerText = m.toLocaleString('id-ID');
    document.getElementById('textKeluar').innerText = k.toLocaleString('id-ID');
}

function simpanKasUmum(e) {
    e.preventDefault();
    let tglKas = document.getElementById('kasTgl') ? document.getElementById('kasTgl').value : "";
    if(!tglKas) {
        tglKas = new Date().toISOString().split('T')[0];
    }

    const body = { 
        jenis: document.getElementById('kasJenis').value, 
        nominal: parseInt(document.getElementById('kasNominal').value)||0, 
        keterangan: document.getElementById('kasKet').value.trim().toUpperCase(), 
        tanggal: tglKas 
    };

    fetch(`${DB_URL}/kas_rt04.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => { 
        closeModal('mInputKas'); 
        document.getElementById('formKasUmum').reset(); 
        if(document.getElementById('kasTgl')) {
            document.getElementById('kasTgl').value = new Date().toISOString().split('T')[0];
        }
        showNotif('Kas Berhasil Dicatat', 'sukses'); 
        muatSistemKas(); 
    });
}

function hapusKas(key) {
    document.getElementById('textKonfirmasiHapus').innerText = 'Hapus data transaksi mutasi kas ini dari pembukuan?';
    ACTION_HAPUS_CALLBACK = () => {
        fetch(`${DB_URL}/kas_rt04/${key}.json`, { method: 'DELETE' }).then(() => { showNotif('Transaksi berhasil dihapus', 'sukses'); muatSistemKas(); });
    };
    openModal('mKonfirmasiHapus');
}

function simpanIuran(e) {
    e.preventDefault();
    const tipe = document.getElementById('iuranTipeAnggota').value;
    const drop = document.getElementById('iuranWarga');
    const wargaKey = drop.value;
    const nWarga = drop.options[drop.selectedIndex].text;
    const noPon = document.getElementById('iuranPon').value.trim().toUpperCase();
    const tglInput = document.getElementById('iuranTgl').value;
    const nominalTerbayar = parseInt(document.getElementById('iuranNominal').value) || 0;
    
    if (!wargaKey) { showNotif('Silakan pilih nama warga terlebih dahulu!', 'gagal'); return; }

    const dataWargaObj = MEMORI_WARGA_GLOBAL[wargaKey] || {};
    let nomorHpWarga = dataWargaObj.username || ""; 

    if (nomorHpWarga.startsWith('0')) {
        nomorHpWarga = '62' + nomorHpWarga.slice(1);
    }
    nomorHpWarga = nomorHpWarga.replace(/\D/g, '');

    let bPeriode = "";
    let formatKasHistori = ""; 
    let narasiKuitansiLengkap = ""; 
    let pesanWA = "";

    const linkKuitansi = `https://m.tuntas.web.id/kuitansi.html?id=${noPon}`;

    if (tipe === 'pon') {
        const hariTanggalIndo = dapatkanKeteranganHariTanggal(tglInput);
        bPeriode = hariTanggalIndo.toUpperCase();
        formatKasHistori = `PON - ${nWarga}`;
        narasiKuitansiLengkap = `Diterima dari Bapak ${nWarga}, untuk pembayaran pembakaran sampah hari ${hariTanggalIndo}, sebesar:`;
        pesanWA = `Terima+kasih+Bapak%2FIbu+${encodeURIComponent(nWarga)},+pembayaran+pembakaran+sampah+hari+${encodeURIComponent(hariTanggalIndo)}+sudah+diterima.+Kuitansi+digital+TUNTAS:+`;
        document.getElementById('textJenisKuitansiHeader').innerText = "Kuitansi Digital PON Siap!";
    } else {
        bPeriode = document.getElementById('iuranBulan').value.trim().toUpperCase();
        if (!bPeriode) { showNotif('Silakan pilih bulan iuran terlebih dahulu!', 'gagal'); return; }
        formatKasHistori = `${nWarga} - ${bPeriode}`;
        narasiKuitansiLengkap = `Diterima dari Bapak/Ibu ${nWarga}, untuk iuran sampah periode bulan ${bPeriode}, sebesar:`;
        pesanWA = `Terima+kasih+Bapak%2FIbu+${encodeURIComponent(nWarga)},+pembayaran+iuran+TUNTAS+periode+${encodeURIComponent(bPeriode)}+sudah+diterima.+Kuitansi+digital:+`;
        document.getElementById('textJenisKuitansiHeader').innerText = "Kuitansi Anggota Tetap Siap!";
    }

    const body = { 
        tanggal: tglInput, 
        tipe_anggota: tipe, 
        warga_key: wargaKey, 
        nama_warga: nWarga, 
        pon: noPon, 
        bulan: bPeriode, 
        nominal: nominalTerbayar, 
        token_kuitansi: noPon,
        narasi_kuitansi: narasiKuitansiLengkap
    };

    fetch(`${DB_URL}/iuran_sampah.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => {
        const kasKredit = { jenis: 'masuk', nominal: body.nominal, keterangan: formatKasHistori, tanggal: body.tanggal };
        fetch(`${DB_URL}/kas_rt04.json`, { method: 'POST', body: JSON.stringify(kasKredit) }).then(() => { muatSistemKas(); muatRiwayatIuran(); });

        document.getElementById('textKodeKuitansi').innerText = `TOKEN KUITANSI: ${noPon}\nURL: ${linkKuitansi}`;
        document.getElementById('boxKuitansiLink').classList.remove('hidden');

        document.getElementById('btnSalinKuitansi').onclick = () => { navigator.clipboard.writeText(linkKuitansi); showNotif('Link disalin!', 'sukses'); };
        
        document.getElementById('btnKirimWA').onclick = () => { 
            const targetWaUrl = `https://api.whatsapp.com/send?phone=${nomorHpWarga}&text=${pesanWA}${encodeURIComponent(linkKuitansi)}`;
            window.open(targetWaUrl, '_blank'); 
        };
        
        closeModal('mInputIuran'); 
        document.getElementById('formIuran').reset(); 
        resetPilihanBulan();
        showNotif('Iuran Sukses Dicatat', 'sukses');
    });
}

async function muatSistemWarga() {
    const list = document.getElementById('listWarga');
    if (!list) return;

    try {
        const res = await fetch(`${DB_URL}/warga_rt04.json`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) throw new Error(`Koneksi Gagal (HTTP Status: ${res.status})`);
        
        const data = await res.json();
        MEMORI_WARGA_GLOBAL = data || {}; 
        
        list.innerHTML = ""; 
        
        if (typeof saringDropdownWargaBerdasarkanTipe === "function") saringDropdownWargaBerdasarkanTipe();
        if (typeof perbaruiDropdownSampahOperasional === "function") perbaruiDropdownSampahOperasional();

        if(!data || Object.keys(data).length === 0) {
            list.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-wide">Belum ada data warga aktif.</div>`;
            return;
        }

        Object.keys(data).forEach(key => {
            const w = data[key];
            const tipeLabel = (w.tipe || 'tetap').toUpperCase();
            list.insertAdjacentHTML('beforeend', `
                <div class="p-3 flex justify-between items-center bg-white my-1 rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="font-extrabold text-slate-700 uppercase tracking-wide text-xs">${w.nama}</p>
                            <span class="text-[7px] font-black px-1.5 py-0.5 rounded ${tipeLabel==='PON'?'bg-amber-50 text-amber-800':'bg-emerald-50 text-emerald-700'}">${tipeLabel}</span>
                        </div>
                        <p class="text-[9px] text-slate-400 font-mono mt-0.5">WA: ${w.username || '-'} | Reg: ${w.bulan_bergabung || '-'}</p>
                    </div>
                    <button onclick="hapusWarga('${key}')" class="text-slate-300 hover:text-rose-600 p-2 transition-colors">
                        <i class="fa-solid fa-user-xmark text-xs"></i>
                    </button>
                </div>
            `);
        });

        renderBukuKalender();
    } catch (e) { 
        console.error("Gagal memuat warga:", e);
        list.innerHTML = `
            <div class="p-4 text-center bg-rose-50 rounded-xl border border-rose-100">
                <p class="text-[11px] text-rose-700 font-black uppercase tracking-wide">
                    <i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat data warga!
                </p>
                <p class="text-[9px] text-slate-500 font-mono mt-1 p-1 bg-white rounded border border-slate-200 break-all text-left">
                    <b>Sebab:</b> ${e.message || 'Network Error / CORS Blocked'}
                </p>
            </div>`;
    }
}

function simpanWarga(e) {
    e.preventDefault();
    const body = { 
        tipe: document.getElementById('addTipe').value, 
        nama: document.getElementById('addNama').value.trim().toUpperCase(), 
        username: document.getElementById('addHp').value.trim(), 
        password: document.getElementById('addPass').value.trim(), 
        bulan_bergabung: document.getElementById('addBulan').value.trim(), 
        foto: "default.png" 
    };
    fetch(`${DB_URL}/warga_rt04.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => { document.getElementById('formWarga').reset(); showNotif('Warga Berhasil Didaftarkan', 'sukses'); muatSistemWarga(); });
}

function hapusWarga(key) {
    document.getElementById('textKonfirmasiHapus').innerText = 'Hapus akun data warga ini secara permanen?';
    ACTION_HAPUS_CALLBACK = () => {
        fetch(`${DB_URL}/warga_rt04/${key}.json`, { method: 'DELETE' }).then(() => { showNotif('Data warga terhapus', 'sukses'); muatSistemWarga(); });
    };
    openModal('mKonfirmasiHapus');
}

function simpanSampah(e) {
    e.preventDefault();
    const drop = document.getElementById('smphWarga');
    const body = { tanggal: document.getElementById('smphTgl').value, warga_key: drop.value, nama_warga: drop.options[drop.selectedIndex].text, status: document.getElementById('smphStatus').value, jam_diambil: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB" };
    fetch(`${DB_URL}/laporan_sampah.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => { document.getElementById('formSampah').reset(); pilihStatusSampah('diambil'); showNotif('Log Sampah Tersimpan', 'sukses'); });
}

async function muatRiwayatIuran() {
    try {
        const res = await fetch(`${DB_URL}/iuran_sampah.json`);
        const data = await res.json();
        MEMORI_IURAN_GLOBAL = data || {};
        renderBukuKalender();
    } catch (e) { console.error(e); }
}

function renderBukuKalender() {
    const filterBulanEl = document.getElementById('calFilterBulan');
    const filterTahunEl = document.getElementById('calFilterTahun');
    if(!filterBulanEl || !filterTahunEl) return;

    const bulan = parseInt(filterBulanEl.value);
    const tahun = parseInt(filterTahunEl.value);
    
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
    
    const thHeader = document.getElementById('tabelCalHeader');
    const tbBody = document.getElementById('tabelCalBody');
    if (!thHeader || !tbBody) return;
    
    let headerHTML = `<th class="p-3 sticky left-0 bg-slate-50 z-10 min-w-[130px] border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-slate-800">Nama Anggota</th>`;
    for (let i = 1; i <= jumlahHari; i++) {
        headerHTML += `<th class="p-2 text-center min-w-[36px] border-r border-slate-100">${i}</th>`;
    }
    headerHTML += `<th class="p-3 text-center bg-emerald-50 text-emerald-900 min-w-[75px] font-black uppercase tracking-wider">Total</th>`;
    thHeader.innerHTML = headerHTML;
    
    const listWargaKeys = Object.keys(MEMORI_WARGA_GLOBAL);
    
    if (listWargaKeys.length === 0) {
        tbBody.innerHTML = `<tr><td colspan="${jumlahHari + 2}" class="p-4 text-center text-slate-400 font-bold uppercase tracking-wide">Belum ada data warga aktif.</td></tr>`;
        return;
    }
    
    let bodyHTML = '';
    
    listWargaKeys.forEach(wKey => {
        const warga = MEMORI_WARGA_GLOBAL[wKey];
        const tipeText = (warga.tipe || 'tetap').toLowerCase();
        
        const badgeTipe = tipeText === 'tetap' 
            ? `<span class="px-1 py-0.5 text-[7px] font-black uppercase bg-emerald-50 text-emerald-700 rounded ml-1">TTP</span>`
            : `<span class="px-1 py-0.5 text-[7px] font-black uppercase bg-amber-50 text-amber-700 rounded ml-1">PON</span>`;

        bodyHTML += `<tr class="hover:bg-slate-50/60 transition-colors">`;
        bodyHTML += `<td class="p-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 flex items-center justify-between">
                        <span class="truncate block max-w-[85px]">${warga.nama}</span>
                        ${badgeTipe}
                     </td>`;
        
        let totalAkumulasiIuranBulanIni = 0;
        
        for (let tanggal = 1; tanggal <= jumlahHari; tanggal++) {
            const formatTglCari = `${tahun}-${String(bulan + 1).padStart(2, '0')}-${String(tanggal).padStart(2, '0')}`;
            
            let totalBayarHariIni = 0;
            let iuranKeysHariIni = []; 
            
            Object.keys(MEMORI_IURAN_GLOBAL).forEach(iKey => {
                const itemIuran = MEMORI_IURAN_GLOBAL[iKey];
                if (itemIuran.warga_key === wKey && itemIuran.tanggal === formatTglCari) {
                    totalBayarHariIni += parseInt(itemIuran.nominal) || 0;
                    iuranKeysHariIni.push(iKey);
                }
            });
            
            if (totalBayarHariIni > 0) {
                totalAkumulasiIuranBulanIni += totalBayarHariIni;
                const nominalRingkas = totalBayarHariIni >= 1000 ? `${Math.floor(totalBayarHariIni / 1000)}k` : totalBayarHariIni;
                
                const paramKeys = JSON.stringify(iuranKeysHariIni).replace(/"/g, '&quot;');
                
                bodyHTML += `<td class="p-1 text-center border-r border-slate-100/60 text-[9px]">
                                <button onclick="hapusIuranMatriks('${paramKeys}', '${warga.nama}', '${formatTglCari}')" class="w-full min-h-[24px] font-black text-emerald-600 bg-emerald-50/60 hover:bg-rose-50 hover:text-rose-600 rounded transition-all shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)] hover:shadow-[inset_0_0_0_1px_rgba(225,29,72,0.2)]">
                                    ${nominalRingkas}
                                </button>
                             </td>`;
            } else {
                bodyHTML += `<td class="p-1 text-center text-slate-300 border-r border-slate-100/40 font-normal text-[9px]">-</td>`;
            }
        }
        
        const cetakTotal = totalAkumulasiIuranBulanIni > 0 
            ? totalAkumulasiIuranBulanIni.toLocaleString('id-ID') 
            : '0';
            
        bodyHTML += `<td class="p-3 text-center font-black bg-slate-50/70 text-slate-800 border-b border-slate-100">${cetakTotal}</td>`;
        bodyHTML += `</tr>`;
    });
    
    tbBody.innerHTML = bodyHTML;
}

async function hapusIuranMatriks(strKeys, namaWarga, tanggalPilihan) {
    const keysAkanDihapus = JSON.parse(strKeys);
    if (!keysAkanDihapus || keysAkanDihapus.length === 0) return;

    document.getElementById('textKonfirmasiHapus').innerText = `Hapus semua data input iuran atas nama ${namaWarga} pada tanggal ${tanggalPilihan}? Langkah ini juga akan menghapus riwayat kas terkait.`;
    
    ACTION_HAPUS_CALLBACK = async () => {
        document.getElementById('loadingOverlay').style.display = 'flex';
        try {
            const resKas = await fetch(`${DB_URL}/kas_rt04.json`);
            const dataKas = await resKas.json() || {};

            for (const iKey of keysAkanDihapus) {
                const itemIuran = MEMORI_IURAN_GLOBAL[iKey];
                if (!itemIuran) continue;

                const tokenPon = itemIuran.pon; 

                await fetch(`${DB_URL}/iuran_sampah/${iKey}.json`, { method: 'DELETE' });

                const kasKeyKetemu = Object.keys(dataKas).find(kKey => {
                    const kasItem = dataKas[kKey];
                    return kasItem.tanggal === itemIuran.tanggal && 
                           (kasItem.keterangan.includes(tokenPon) || kasItem.keterangan.includes(itemIuran.bulan));
                });

                if (kasKeyKetemu) {
                    await fetch(`${DB_URL}/kas_rt04/${kasKeyKetemu}.json`, { method: 'DELETE' });
                }
            }

            showNotif('Data iuran dan riwayat kas berhasil dibersihkan', 'sukses');
            await sinkronUlangData();

        } catch (error) {
            console.error(error);
            showNotif('Gagal menghapus data iuran', 'gagal');
        } finally {
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    };
    
    openModal('mKonfirmasiHapus');
}

function unduhLaporanPDF() {
    if(DATA_KAS_TERFILTER.length === 0) { showNotif('Tidak ada transaksi pada rentang tanggal ini!', 'gagal'); return; }
    const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'mm', 'a4'); 
    doc.setFont("Helvetica", "bold"); doc.setFontSize(14);
    doc.text("LAPORAN OPERASIONAL KAS TUNTAS RT 04", 14, 15);
    doc.setFontSize(9); doc.setFont("Helvetica", "normal");
    doc.text(`Periode: ${document.getElementById('filterMulai').value} s/d ${document.getElementById('filterSelesai').value}`, 14, 21);
    
    const rows = [];
    DATA_KAS_TERFILTER.forEach((item, idx) => { rows.push([idx + 1, item.tanggal, item.keterangan, item.jenis.toUpperCase(), item.nominal.toLocaleString('id-ID')]); });
    doc.autoTable({ startY: 26, head: [['No', 'Tanggal', 'Keterangan', 'Jenis', 'Nominal']], body: rows, headStyles: { fillColor: [6, 78, 59], fontSize: 9 }, styles: { fontSize: 8.5 }, margin: { left: 14, right: 14 } });
    doc.save(`Kas_Tuntas_RT04_${document.getElementById('filterMulai').value}.pdf`);
}

function ubahPasswordAdmin(e) {
    e.preventDefault();
    fetch(`${DB_URL}/admin_account/password.json`, { method: 'PUT', body: JSON.stringify(document.getElementById('newPass').value.trim()) }).then(() => { document.getElementById('formPass').reset(); showNotif('Password Admin Diperbarui', 'sukses'); });
}

function logoutAdmin() { 
    localStorage.clear(); 
    window.location.href = '../index.html'; 
}
