// =================================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// =================================================================
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
let DATA_KAS_TERFILTER = []; 
let ACTION_HAPUS_CALLBACK = null; 
let BULAN_TERPILIH_ARRAY = [];

// ==========================================
// DOM INITIALIZATION EVENTS
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const hariIni = new Date();
    const y = hariIni.getFullYear();
    const m = String(hariIni.getMonth() + 1).padStart(2, '0');
    
    document.getElementById('filterMulai').value = `${y}-${m}-01`;
    document.getElementById('filterSelesai').value = hariIni.toISOString().split('T')[0];
    document.getElementById('iuranTgl').value = hariIni.toISOString().split('T')[0];
    document.getElementById('smphTgl').value = hariIni.toISOString().split('T')[0];

    pilihStatusSampah('diambil');

    document.getElementById('btnBatalHapus').addEventListener('click', () => closeModal('mKonfirmasiHapus'));
    document.getElementById('btnYakinHapus').addEventListener('click', () => {
        if(typeof ACTION_HAPUS_CALLBACK === 'function') ACTION_HAPUS_CALLBACK();
        closeModal('mKonfirmasiHapus');
    });

    sinkronUlangData();
});

// ==========================================
// HELPERS & DYNAMIC UI CONTEXT
// ==========================================

function generateKodePON() {
    return `T-${Math.floor(100000 + Math.random() * 900000)}`;
}

function dapatkanKeteranganHariTanggal(tanggalString) {
    if (!tanggalString) return "";
    const daftarHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const daftarBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const dateObj = new Date(tanggalString);
    return `${daftarHari[dateObj.getDay()]}, ${dateObj.getDate()} ${daftarBulan[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

// SARING DROPDOWN INPUT IURAN (BERDASARKAN TIPE)
function saringDropdownWargaBerdasarkanTipe() {
    const tipeTerpilih = document.getElementById('iuranTipeAnggota').value; 
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
        const tipeWarga = warga.tipe || 'tetap'; 
        
        if (tipeWarga === tipeTerpilih) {
            dropdownWarga.insertAdjacentHTML('beforeend', `<option value="${key}">${warga.nama.toUpperCase()}</option>`);
        }
    });
}

// PERBAIKAN: DROPDOWN LAPORAN SAMPAH OPERASIONAL JUGA IKUT DISARING AUTOMATIS
function perbaruiDropdownSampahOperasional() {
    const d2 = document.getElementById('smphWarga');
    d2.innerHTML = '<option value="">-- PILIH NAMA WARGA --</option>';
    
    Object.keys(MEMORI_WARGA_GLOBAL).forEach(key => {
        const w = MEMORI_WARGA_GLOBAL[key];
        // Menampilkan label [PON] atau [TETAP] di dropdown sampah biar admin tidak bingung
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

function resetPilihanBulan() {
    BULAN_TERPILIH_ARRAY = [];
    document.querySelectorAll('.month-chip').forEach(el => el.classList.remove('selected'));
    document.getElementById('iuranBulan').value = "";
}

function pilihStatusSampah(statusCode) {
    document.querySelectorAll('.status-card').forEach(card => card.classList.remove('selected'));
    document.getElementById(`status-${statusCode}`).classList.add('selected');
    document.getElementById('smphStatus').value = statusCode;
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

// ==========================================
// CORE DATA OPERATIONS
// ==========================================

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
    const body = { jenis: document.getElementById('kasJenis').value, nominal: parseInt(document.getElementById('kasNominal').value)||0, keterangan: document.getElementById('kasKet').value.trim().toUpperCase(), tanggal: new Date().toISOString().split('T')[0] };
    fetch(`${DB_URL}/kas_rt04.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => { closeModal('mInputKas'); document.getElementById('formKasUmum').reset(); showNotif('Kas Berhasil Dicatat', 'sukses'); muatSistemKas(); });
}

function hapusKas(key) {
    document.getElementById('textKonfirmasiHapus').innerText = 'Hapus data transaksi mutasi kas ini dari pembukuan?';
    ACTION_HAPUS_CALLBACK = () => {
        fetch(`${DB_URL}/kas_rt04/${key}.json`, { method: 'DELETE' }).then(() => { showNotif('Transaksi berhasil dihapus', 'sukses'); muatSistemKas(); });
    };
    openModal('mKonfirmasiHapus');
}

// =================================================================
// PENERBITAN IURAN & STRUKTUR KUITANSI BARU (FIXED)
// =================================================================
function simpanIuran(e) {
    e.preventDefault();
    
    const tipe = document.getElementById('iuranTipeAnggota').value;
    const drop = document.getElementById('iuranWarga');
    const nWarga = drop.options[drop.selectedIndex].text;
    const noPon = document.getElementById('iuranPon').value.trim().toUpperCase();
    const tglInput = document.getElementById('iuranTgl').value;
    const nominalTerbayar = parseInt(document.getElementById('iuranNominal').value) || 0;
    
    if (!drop.value) { showNotif('Silakan pilih nama warga terlebih dahulu!', 'gagal'); return; }

    let bPeriode = "";
    let formatKasHistori = ""; 
    let narasiKuitansiLengkap = ""; 
    let pesanWA = "";
    let linkKuitansi = "";

    if (tipe === 'pon') {
        const hariTanggalIndo = dapatkanKeteranganHariTanggal(tglInput);
        bPeriode = hariTanggalIndo.toUpperCase();
        
        // Poin 2: Histori Kas dibuat ringkas (Murni PON - NAMA)
        formatKasHistori = `PON - ${nWarga}`;
        
        // Poin 3: Narasi lengkap disimpan khusus untuk dibaca file pon.html
        narasiKuitansiLengkap = `Diterima dari Bapak/Ibu ${nWarga}, untuk pembayaran pembakaran sampah hari ${hariTanggalIndo}, sebesar:`;
        pesanWA = `Terima+kasih+Bapak%2FIbu+${encodeURIComponent(nWarga)},+pembayaran+pembakaran+sampah+hari+${encodeURIComponent(hariTanggalIndo)}+sudah+diterima.+Kuitansi+digital+PON:+`;
        
        // Poin 3: Nama file diganti ke pon.html
        linkKuitansi = `https://tuntas.web.id/pon.html?id=${noPon}`;
        document.getElementById('textJenisKuitansiHeader').innerText = "Kuitansi Digital PON Siap!";
    } else {
        bPeriode = document.getElementById('iuranBulan').value.trim().toUpperCase();
        if (!bPeriode) { showNotif('Silakan pilih bulan iuran terlebih dahulu!', 'gagal'); return; }
        
        // Narasi Histori Kas Anggota Tetap
        formatKasHistori = `${nWarga} - ${bPeriode}`;
        
        // Narasi lengkap disimpan khusus untuk dibaca file kuitansi.html
        narasiKuitansiLengkap = `Diterima dari Bapak/Ibu ${nWarga}, untuk iuran sampah periode bulan ${bPeriode}, sebesar:`;
        pesanWA = `Terima+kasih+Bapak%2FIbu+${encodeURIComponent(nWarga)},+pembayaran+iuran+TUNTAS+periode+${encodeURIComponent(bPeriode)}+sudah+diterima.+Kuitansi+digital:+`;
        
        // Poin 3: Nama file diganti ke kuitansi.html
        linkKuitansi = `https://tuntas.web.id/kuitansi.html?id=${noPon}`;
        document.getElementById('textJenisKuitansiHeader').innerText = "Kuitansi Anggota Tetap Siap!";
    }

    // Mengirim payload lengkap ke Firebase Realtime Database
    const body = { 
        tanggal: tglInput, 
        tipe_anggota: tipe, 
        warga_key: drop.value, 
        nama_warga: nWarga, 
        pon: noPon, 
        bulan: bPeriode, 
        nominal: nominalTerbayar, 
        token_kuitansi: noPon,
        narasi_kuitansi: narasiKuitansiLengkap // Akan dibaca oleh kuitansi.html / pon.html
    };

    fetch(`${DB_URL}/iuran_sampah.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => {
        const kasKredit = { jenis: 'masuk', nominal: body.nominal, keterangan: formatKasHistori, tanggal: body.tanggal };
        fetch(`${DB_URL}/kas_rt04.json`, { method: 'POST', body: JSON.stringify(kasKredit) }).then(() => { muatSistemKas(); muatRiwayatIuran(); });

        document.getElementById('textKodeKuitansi').innerText = `TOKEN KUITANSI: ${noPon}\nURL: ${linkKuitansi}`;
        document.getElementById('boxKuitansiLink').classList.remove('hidden');

        document.getElementById('btnSalinKuitansi').onclick = () => { navigator.clipboard.writeText(linkKuitansi); showNotif('Link disalin!', 'sukses'); };
        document.getElementById('btnKirimWA').onclick = () => { window.open(`https://api.whatsapp.com/send?text=${pesanWA}${encodeURIComponent(linkKuitansi)}`, '_blank'); };
        
        closeModal('mInputIuran'); 
        document.getElementById('formIuran').reset(); 
        resetPilihanBulan();
        showNotif('Iuran Sukses Dicatat', 'sukses');
    });
}

async function muatSistemWarga() {
    try {
        const res = await fetch(`${DB_URL}/warga_rt04.json`);
        const data = await res.json();
        MEMORI_WARGA_GLOBAL = data || {}; 
        
        const list = document.getElementById('listWarga');
        list.innerHTML = ""; 
        
        // Saring dropdown iuran & operasional sampah secara terpisah
        saringDropdownWargaBerdasarkanTipe();
        perbaruiDropdownSampahOperasional();

        if(!data) return;
        Object.keys(data).forEach(key => {
            const w = data[key];
            const tipeLabel = (w.tipe || 'tetap').toUpperCase();
            list.insertAdjacentHTML('beforeend', `
                <div class="p-3 flex justify-between items-center bg-white my-1 rounded-xl border border-slate-100">
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="font-extrabold text-slate-700 uppercase tracking-wide">${w.nama}</p>
                            <span class="text-[7px] font-black px-1.5 py-0.5 rounded ${tipeLabel==='PON'?'bg-amber-50 text-amber-800':'bg-emerald-50 text-emerald-800'}">${tipeLabel}</span>
                        </div>
                        <p class="text-[9px] text-slate-400 font-mono">WA: ${w.username} | Reg: ${w.bulan_bergabung}</p>
                    </div>
                    <button onclick="hapusWarga('${key}')" class="text-slate-200 hover:text-rose-600 p-1"><i class="fa-solid fa-user-xmark text-xs"></i></button>
                </div>
            `);
        });
    } catch (e) { console.error(e); }
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
        const list = document.getElementById('listRiwayatIuranWarga');
        list.innerHTML = ""; if(!data) { list.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 font-bold uppercase">Riwayat Kosong.</div>`; return; }
        Object.keys(data).forEach(key => {
            const i = data[key];
            const tipeText = i.tipe_anggota || 'tetap';
            list.insertAdjacentHTML('afterbegin', `
                <div class="p-4 flex justify-between items-center bg-white border border-slate-100/80 rounded-2xl my-2 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100"><i class="fa-solid fa-receipt text-xs"></i></div>
                        <div>
                            <h4 class="text-xs font-extrabold text-slate-800 uppercase tracking-wide">${i.nama_warga}</h4>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="text-[9px] text-slate-400 font-bold">${i.bulan}</span>
                                <span class="inline-block w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span class="text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${tipeText==='pon'?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700'}">${tipeText}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3.5">
                        <div class="text-right">
                            <span class="text-xs font-black text-slate-900 block">Rp ${i.nominal.toLocaleString('id-ID')}</span>
                            <span class="text-[8px] font-mono text-slate-400 block">ID: ${i.token_kuitansi}</span>
                        </div>
                        <button onclick="hapusIuran('${key}')" class="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg"><i class="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                </div>
            `);
        });
    } catch (e) { console.error(e); }
}

function hapusIuran(key) {
    document.getElementById('textKonfirmasiHapus').innerText = 'Hapus arsip data riwayat iuran sampah ini dari database?';
    ACTION_HAPUS_CALLBACK = () => {
        document.getElementById('loadingOverlay').style.display = 'flex';
        fetch(`${DB_URL}/iuran_sampah/${key}.json`, { method: 'DELETE' })
        .then(() => { showNotif('Riwayat iuran berhasil dihapus', 'sukses'); muatRiwayatIuran(); })
        .finally(() => document.getElementById('loadingOverlay').style.display = 'none');
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

function logoutAdmin() { localStorage.clear(); window.location.href = '../index.html'; }
