// ==========================================
// CONFIG & CONSTANTS
// ==========================================
const DB_URL = "https://tuntas-04-default-rtdb.asia-southeast1.firebasedatabase.app";
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
    
    // Set default standard dates values
    document.getElementById('filterMulai').value = `${y}-${m}-01`;
    document.getElementById('filterSelesai').value = hariIni.toISOString().split('T')[0];
    document.getElementById('iuranTgl').value = hariIni.toISOString().split('T')[0];
    document.getElementById('smphTgl').value = hariIni.toISOString().split('T')[0];

    pilihStatusSampah('diambil');

    // Bind custom alert confirmation dialog
    document.getElementById('btnBatalHapus').addEventListener('click', () => closeModal('mKonfirmasiHapus'));
    document.getElementById('btnYakinHapus').addEventListener('click', () => {
        if(typeof ACTION_HAPUS_CALLBACK === 'function') {
            ACTION_HAPUS_CALLBACK();
        }
        closeModal('mKonfirmasiHapus');
    });

    // Initial Data Synchronization
    sinkronUlangData().then(() => {
        jalankanPopupInfoOtomatis();
        muatFotoProfilAdmin(); 
    });
});

// ==========================================
// HELPERS & DYNAMIC UI CONTEXTS
// ==========================================

function generateKodePON() {
    const angkaAcak = Math.floor(100000 + Math.random() * 900000); 
    return `T-${angkaAcak}`;
}

function dapatkanKeteranganHariTanggal(tanggalString) {
    if (!tanggalString) return "";
    const daftarHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const daftarBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const dateObj = new Date(tanggalString);
    const hari = daftarHari[dateObj.getDay()];
    const tanggal = dateObj.getDate();
    const bulan = daftarBulan[dateObj.getMonth()];
    const tahun = dateObj.getFullYear();
    
    return `${hari}, ${tanggal} ${bulan} ${tahun}`;
}

function tanganiPerubahanWarga(selectElement) {
    const tipe = document.getElementById('iuranTipeAnggota').value;
    const inputPon = document.getElementById('iuranPon');
    const boxBulan = document.getElementById('boxPilihanBulanWrapper');
    
    // Toggle UI filter bulan based on member class
    if (tipe === 'pon') {
        boxBulan.classList.add('hidden');
    } else {
        boxBulan.classList.remove('hidden');
    }

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

function panggilKonfirmasiKustom(pesanText, callbackAksi) {
    document.getElementById('textKonfirmasiHapus').innerText = pesanText;
    ACTION_HAPUS_CALLBACK = callbackAksi;
    openModal('mKonfirmasiHapus');
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
    box.classList.remove('hidden'); 
    setTimeout(() => box.classList.add('hidden'), 3000);
}

function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('btn-top-modul').classList.remove('bg-emerald-950', 'text-white');
    document.getElementById('btn-top-modul').classList.add('bg-emerald-50', 'text-emerald-800');

    document.getElementById(id).classList.add('active');

    if (id === 'scr-kas') document.getElementById('nav-btn-kas').classList.add('active');
    else if (id === 'scr-warga') document.getElementById('nav-btn-warga').classList.add('active');
    else if (id === 'scr-sampah') document.getElementById('nav-btn-sampah').classList.add('active');
    else if (id === 'scr-riwayat') document.getElementById('nav-btn-riwayat').classList.add('active');
    else if (id === 'scr-modul') {
        document.getElementById('btn-top-modul').classList.remove('bg-emerald-50', 'text-emerald-800');
        document.getElementById('btn-top-modul').classList.add('bg-emerald-950', 'text-white');
    }
}

// ==========================================
// DATABASE ENGINE OPERATIONS (AJAX / FETCH)
// ==========================================

async function sinkronUlangData() {
    document.getElementById('loadingOverlay').style.display = 'flex';
    try {
        await Promise.all([
            muatSistemKas(), 
            muatSistemWarga(), 
            muatRiwayatIuran(), 
            muatBeritaAdmin(), 
            muatSaranAdmin()
        ]);
    } catch (err) {
        console.error("Sinkronisasi database mengalami kendala:", err);
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

async function muatFotoProfilAdmin() {
    try {
        const res = await fetch(`${DB_URL}/admin_account/foto_profil.json`);
        const base64Image = await res.json();
        if (base64Image) document.getElementById('profFoto').src = base64Image;
    } catch (error) { console.log("Gagal memuat foto profil:", error); }
}

function prosesUploadFoto(input) {
    if (input.files && input.files[0]) {
        document.getElementById('loadingOverlay').style.display = 'flex';
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = async function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 400; const MAX_HEIGHT = 400;
                let width = img.width; let height = img.height;
                
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                const stringBase64 = canvas.toDataURL('image/jpeg', 0.7);
                
                try {
                    await fetch(`${DB_URL}/admin_account/foto_profil.json`, { method: 'PUT', body: JSON.stringify(stringBase64) });
                    document.getElementById('profFoto').src = stringBase64;
                    showNotif('Foto Profil Berhasil Diperbarui!', 'sukses');
                } catch (err) { showNotif('Gagal mengunggah gambar', 'gagal'); }
                finally { document.getElementById('loadingOverlay').style.display = 'none'; }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
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
            list.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-bold uppercase">Buku Kas Kosong.</div>`;
            updateTampilanCardKas(0, 0, 0, 0); return;
        }

        Object.keys(data).forEach(key => {
            const v = data[key];
            const nom = parseInt(v.nominal) || 0;
            const tglItem = new Date(v.tanggal);

            if(v.jenis === 'masuk') { saldoKeseluruhan += nom; } else { saldoKeseluruhan -= nom; }

            if(tglItem >= start && tglItem <= end) {
                if(v.jenis === 'masuk') { mskTerapit += nom; } else { klrTerapit += nom; }
                sldTerapit = mskTerapit - klrTerapit;

                DATA_KAS_TERFILTER.push({ tanggal: v.tanggal, keterangan: v.keterangan, jenis: v.jenis, nominal: nom });

                list.insertAdjacentHTML('afterbegin', `
                    <div class="p-4 flex justify-between items-center bg-white">
                        <div>
                            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide">${v.keterangan}</h4>
                            <p class="text-[9px] font-mono text-slate-400 mt-0.5">${v.tanggal}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-black ${v.jenis==='masuk'?'text-emerald-600':'text-rose-600'}">
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
    panggilKonfirmasiKustom('Hapus data transaksi mutasi kas ini dari pembukuan?', () => {
        fetch(`${DB_URL}/kas_rt04/${key}.json`, { method: 'DELETE' }).then(() => { showNotif('Transaksi berhasil dihapus', 'sukses'); muatSistemKas(); });
    });
}

// SIMPAN IURAN (DIVERSIFIKASI LOGIKA PON VS TETAP)
function simpanIuran(e) {
    e.preventDefault();
    
    const tipe = document.getElementById('iuranTipeAnggota').value;
    const drop = document.getElementById('iuranWarga');
    const nWarga = drop.options[drop.selectedIndex].text;
    const noPon = document.getElementById('iuranPon').value.trim().toUpperCase();
    const tglInput = document.getElementById('iuranTgl').value;
    const nominalTerbayar = parseInt(document.getElementById('iuranNominal').value) || 0;
    
    if (!drop.value) { showNotif('Silakan pilih nama warga terlebih dahulu!', 'gagal'); return; }
    if (!noPon) { showNotif('Token Kuitansi Kosong, Silakan pilih ulang warga!', 'gagal'); return; }

    let bPeriode = "";
    let formatKeteranganIuran = "";
    let pesanWA = "";

    if (tipe === 'pon') {
        const hariTanggalIndo = dapatkanKeteranganHariTanggal(tglInput);
        bPeriode = `HARIAN (${hariTanggalIndo})`;
        formatKeteranganIuran = `Diterima dari Bapak/Ibu ${nWarga}, untuk pembayaran pembakaran sampah hari ${hariTanggalIndo}, sebesar: Rp ${nominalTerbayar.toLocaleString('id-ID')}`;
        pesanWA = `Terima+kasih+Bapak%2FIbu+${encodeURIComponent(nWarga)},+pembayaran+pembakaran+sampah+hari+${encodeURIComponent(hariTanggalIndo)}+sudah+diterima.+Kuitansi+digital:+`;
    } else {
        bPeriode = document.getElementById('iuranBulan').value.trim();
        if (!bPeriode) { showNotif('Silakan pilih bulan iuran terlebih dahulu!', 'gagal'); return; }
        formatKeteranganIuran = `${nWarga} - ${bPeriode.toUpperCase()} (PO: ${noPon})`;
        pesanWA = `Terima+kasih+Bapak%2FIbu+${encodeURIComponent(nWarga)},+pembayaran+iuran+TUNTAS+periode+${encodeURIComponent(bPeriode)}+sudah+diterima.+Kuitansi+digital:+`;
    }

    const body = { tanggal: tglInput, warga_key: drop.value, nama_warga: nWarga, pon: noPon, bulan: bPeriode.toUpperCase(), nominal: nominalTerbayar, token_kuitansi: noPon };

    fetch(`${DB_URL}/iuran_sampah.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => {
        const kasKredit = { jenis: 'masuk', nominal: body.nominal, keterangan: formatKeteranganIuran, tanggal: body.tanggal };
        fetch(`${DB_URL}/kas_rt04.json`, { method: 'POST', body: JSON.stringify(kasKredit) }).then(() => { muatSistemKas(); muatRiwayatIuran(); });

        const linkKuitansi = `https://tuntas.web.id/bukti.html?id=${noPon}`;
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

function simpanInfoPopup(e) {
    e.preventDefault();
    const body = { judul: document.getElementById('popJudul').value.trim().toUpperCase(), isi: document.getElementById('popIsi').value.trim(), tanggal: new Date().toISOString().split('T')[0] };
    fetch(`${DB_URL}/informasi_popup.json`, { method: 'PUT', body: JSON.stringify(body) }).then(() => { showNotif('Info Pop-Up Diperbarui', 'sukses'); jalankanPopupInfoOtomatis(); });
}

async function jalankanPopupInfoOtomatis() {
    try {
        const res = await fetch(`${DB_URL}/informasi_popup.json`);
        const data = await res.json();
        if(data && data.judul) {
            document.getElementById('popupInfoJudul').innerText = data.judul;
            document.getElementById('popupInfoIsi').innerText = data.isi;
            openModal('mInfoLoginPopup');
        }
    } catch (err) { console.error(err); }
}

function simpanBerita(e) {
    e.preventDefault();
    const body = { judul: document.getElementById('newsJudul').value.trim().toUpperCase(), isi: document.getElementById('newsIsi').value.trim(), tanggal: new Date().toISOString().split('T')[0] };
    fetch(`${DB_URL}/pengumuman.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => { document.getElementById('formBerita').reset(); showNotif('Rilis Blog Disiarkan', 'sukses'); muatBeritaAdmin(); });
}

async function muatBeritaAdmin() {
    try {
        const res = await fetch(`${DB_URL}/pengumuman.json`);
        const data = await res.json();
        const list = document.getElementById('listBeritaAdmin');
        list.innerHTML = ""; if(!data) return;
        Object.keys(data).forEach(key => {
            list.insertAdjacentHTML('afterbegin', `
                <div class="p-2 bg-white rounded-lg border border-slate-100 mt-1">
                    <div class="flex justify-between items-center"><h5 class="text-[11px] font-black text-slate-800">${data[key].judul}</h5><button onclick="hapusBerita('${key}')" class="text-slate-300 hover:text-rose-500 text-[10px]"><i class="fa-solid fa-trash-can"></i></button></div>
                    <p class="text-[11px] text-slate-500 mt-0.5 leading-tight">${data[key].isi}</p>
                </div>
            `);
        });
    } catch (e) { console.error(e); }
}

function hapusBerita(key) {
    panggilKonfirmasiKustom('Hapus postingan rilis blog pengumuman ini?', () => {
        fetch(`${DB_URL}/pengumuman/${key}.json`, { method: 'DELETE' }).then(() => { showNotif('Berita berhasil dihapus', 'sukses'); muatBeritaAdmin(); });
    });
}

async function muatSaranAdmin() {
    try {
        const res = await fetch(`${DB_URL}/saran_warga.json`);
        const data = await res.json();
        const list = document.getElementById('listSaranWargaAdmin');
        list.innerHTML = ""; if(!data) { list.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-bold uppercase">Belum ada saran masuk.</div>`; return; }
        Object.keys(data).forEach(key => {
            list.insertAdjacentHTML('afterbegin', `
                <div class="p-2.5 my-1 bg-slate-50 rounded-xl border border-slate-100">
                    <div class="flex justify-between items-center text-[9px] font-black"><span class="text-emerald-800 uppercase">${data[key].nama_warga}</span><span class="text-slate-400">${data[key].tanggal}</span></div>
                    <p class="text-[11px] text-slate-600 italic mt-0.5">"${data[key].isi_saran}"</p>
                </div>
            `);
        });
    } catch (e) { console.error(e); }
}

async function muatSistemWarga() {
    try {
        const res = await fetch(`${DB_URL}/warga_rt04.json`);
        const data = await res.json();
        const list = document.getElementById('listWarga');
        const d1 = document.getElementById('iuranWarga');
        const d2 = document.getElementById('smphWarga');

        list.innerHTML = ""; d1.innerHTML = '<option value="">-- PILIH NAMA WARGA --</option>'; d2.innerHTML = '<option value="">-- PILIH NAMA WARGA --</option>';
        if(!data) return;
        Object.keys(data).forEach(key => {
            const w = data[key];
            d1.insertAdjacentHTML('beforeend', `<option value="${key}">${w.nama.toUpperCase()}</option>`);
            d2.insertAdjacentHTML('beforeend', `<option value="${key}">${w.nama.toUpperCase()}</option>`);
            list.insertAdjacentHTML('beforeend', `
                <div class="p-3 flex justify-between items-center bg-white my-1 rounded-xl border border-slate-100">
                    <div>
                        <p class="font-extrabold text-slate-700 uppercase tracking-wide">${w.nama}</p>
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
    const body = { nama: document.getElementById('addNama').value.trim().toUpperCase(), username: document.getElementById('addHp').value.trim(), password: document.getElementById('addPass').value.trim(), bulan_bergabung: document.getElementById('addBulan').value.trim(), foto: "default.png" };
    fetch(`${DB_URL}/warga_rt04.json`, { method: 'POST', body: JSON.stringify(body) }).then(() => { document.getElementById('formWarga').reset(); showNotif('Warga Berhasil Didaftarkan', 'sukses'); muatSistemWarga(); });
}

function hapusWarga(key) {
    panggilKonfirmasiKustom('Hapus akun data warga ini secara permanen dari basis data?', () => {
        fetch(`${DB_URL}/warga_rt04/${key}.json`, { method: 'DELETE' }).then(() => { showNotif('Data warga terhapus', 'sukses'); muatSistemWarga(); });
    });
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
            list.insertAdjacentHTML('afterbegin', `
                <div class="p-4 flex justify-between items-center bg-white border border-slate-100/80 rounded-2xl my-2 shadow-sm hover:border-slate-200 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
                            <i class="fa-solid fa-receipt text-xs"></i>
                        </div>
                        <div>
                            <h4 class="text-xs font-extrabold text-slate-800 uppercase tracking-wide">${i.nama_warga}</h4>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="text-[9px] text-slate-400 font-bold">${i.bulan}</span>
                                <span class="inline-block w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span class="text-[8px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Lunas</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3.5">
                        <div class="text-right">
                            <span class="text-xs font-black text-slate-900 block">Rp ${i.nominal.toLocaleString('id-ID')}</span>
                            <span class="text-[8px] font-mono text-slate-400 block tracking-tighter">ID: ${i.token_kuitansi}</span>
                        </div>
                        <button onclick="hapusIuran('${key}')" class="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors" title="Hapus Riwayat">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </div>
            `);
        });
    } catch (e) { console.error(e); }
}

function hapusIuran(key) {
    panggilKonfirmasiKustom('Hapus arsip data riwayat iuran sampah ini dari database?', () => {
        document.getElementById('loadingOverlay').style.display = 'flex';
        fetch(`${DB_URL}/iuran_sampah/${key}.json`, { method: 'DELETE' })
        .then(() => { showNotif('Riwayat iuran berhasil dihapus', 'sukses'); muatRiwayatIuran(); })
        .catch(err => { console.error(err); showNotif('Gagal menghapus data', 'gagal'); })
        .finally(() => { document.getElementById('loadingOverlay').style.display = 'none'; });
    });
}

function unduhLaporanPDF() {
    if(DATA_KAS_TERFILTER.length === 0) { showNotif('Tidak ada transaksi pada rentang tanggal ini!', 'gagal'); return; }
    const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'mm', 'a4'); 
    
    doc.setFont("Helvetica", "bold"); doc.setFontSize(14);
    doc.text("LAPORAN OPERASIONAL KAS TUNTAS RT 04", 14, 15);
    
    doc.setFontSize(9); doc.setFont("Helvetica", "normal");
    doc.text(`Periode: ${document.getElementById('filterMulai').value} s/d ${document.getElementById('filterSelesai').value}`, 14, 21);
    
    const rows = [];
    DATA_KAS_TERFILTER.forEach((item, idx) => { 
        rows.push([idx + 1, item.tanggal, item.keterangan, item.jenis.toUpperCase(), item.nominal.toLocaleString('id-ID')]); 
    });
    
    doc.autoTable({ 
        startY: 26, head: [['No', 'Tanggal', 'Keterangan', 'Jenis', 'Nominal']], body: rows, 
        headStyles: { fillColor: [6, 78, 59], fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 }, margin: { left: 14, right: 14, bottom: 15 }, pageBreak: 'auto'
    });
    doc.save(`Kas_Tuntas_RT04_${document.getElementById('filterMulai').value}.pdf`);
}

function ubahPasswordAdmin(e) {
    e.preventDefault();
    fetch(`${DB_URL}/admin_account/password.json`, { method: 'PUT', body: JSON.stringify(document.getElementById('newPass').value.trim()) }).then(() => { document.getElementById('formPass').reset(); showNotif('Password Admin Diperbarui', 'sukses'); });
}

function logoutAdmin() { localStorage.clear(); window.location.href = '../index.html'; }
