const SUPABASE_URL='https://doovdbzqlbwxckkydfwg.supabase.co';
const SUPABASE_KEY='sb_publishable_gw4WQtfPZ4xtbcduTfAlSA_qLDPVTNK';
const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const EXEC=['Terlaksana Offline','Terlaksana Online','Digantikan Tatsqif','Tidak Terlaksana'];
const NAQIB=['Hadir Offline','Hadir Online','Tidak Hadir','Terlambat lebih dari 15 menit'];
const WEEKLY=['Iftitah','Tilawah/Setoran Hafalan','Kalimatul Usroh','Membaca MR','Tatsqif Usrah',"Ta'limat",'Qadhaya – Rawa’i','Khatimah & Do’a','Monev Program (opsional)'];
const LU=['Jaulah Tokoh','Riyadhoh','Rihlah',"Silaturahmi ke Rumah A'dho",'Pelatihan/Seminar','Masak Bersama','Yang lain'];
const MONTHLY=['Evaluasi Binaan & Pertumbuhan',"Evaluasi Pencapaian IDP A'dho","Evaluasi Program Kebugaran A'dho",'Tidak Ada Pembahasan Agenda Bulanan'];
const ATT=['Hadir tepat waktu','Hadir terlambat','Tidak hadir dengan ijin Walas','Tidak hadir tanpa kabar','Sudah Mutasi'];
const YOPT={
 tilawah:['Hijau ≥ 7 juz','Kuning ≥ 4 juz','Merah < 4 juz'],
 qiyamul:['Hijau > 2x','Kuning 1–2x','Merah 0'],
 sholat:['Hijau > 20x','Kuning 7–20x','Merah 1–6x'],
 puasa:['Hijau > 1x','Kuning 1x','Merah 0x'],
 olahraga:['Hijau > 1x','Kuning 1x','Merah 0x'],
 ibr:['Lunas','Belum Lunas']
};
let classes=[], memberToken='', secretaryToken='', walasToken='', adminToken='', memberData=null, secretaryData=null, walasClass='';

function status(id,msg,ok=true){const e=document.getElementById(id);e.textContent=msg;e.className='status '+(ok?'ok':'err');}
function clearStatus(id){const e=document.getElementById(id);e.textContent='';e.className='status';}
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||String(error));return data;}
function fillSelect(id,vals,selected=''){const e=document.getElementById(id);e.innerHTML=vals.map(v=>`<option value="${esc(v)}"${v===selected?' selected':''}>${esc(v)}</option>`).join('');}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function setRole(role){
 ['member','secretary','walas','admin'].forEach(r=>{
   document.getElementById('login'+r[0].toUpperCase()+r.slice(1)).classList.toggle('hidden',r!==role);
   document.getElementById('tab'+r[0].toUpperCase()+r.slice(1)).classList.toggle('active',r===role);
 });
}
window.setRole=setRole;

async function init(){
 try{
   classes=await rpc('legacy_public_classes');
   const vals=classes.map(x=>x.kelas);
   ['memberClass','secretaryClass','walasClass','adminSecClass','adminMemberClass'].forEach(id=>fillSelect(id,vals));
   MONTHS.forEach(()=>{});
   ['memberMonth','secMonth','walasMonth','adminMonth'].forEach(id=>fillSelect(id,MONTHS,MONTHS[new Date().getMonth()]));
   const y=new Date().getFullYear();
   ['memberYear','secYear','walasYear','adminYear'].forEach(id=>document.getElementById(id).value=y);
   fillSelect('secExecution',EXEC); fillSelect('secNaqib',NAQIB);
   renderChecks('weeklyAgenda','wa',WEEKLY); renderChecks('luAgenda','lu',LU); renderChecks('monthlyAgenda','ma',MONTHLY);
   fillSelect('yTilawah',YOPT.tilawah);fillSelect('yQiyamul',YOPT.qiyamul);fillSelect('ySholat',YOPT.sholat);
   fillSelect('yPuasa',YOPT.puasa);fillSelect('yOlahraga',YOPT.olahraga);fillSelect('yIbr',YOPT.ibr);
 }catch(e){status('memberLoginStatus',e.message,false)}
}
function renderChecks(holder,prefix,arr){document.getElementById(holder).innerHTML=arr.map((v,i)=>`<label class="check"><input type="checkbox" data-group="${prefix}" value="${esc(v)}"> ${esc(v)}</label>`).join('')}
function checked(group){return [...document.querySelectorAll(`input[data-group="${group}"]:checked`)].map(x=>x.value)}
function setChecks(group,vals){const s=new Set(vals||[]);document.querySelectorAll(`input[data-group="${group}"]`).forEach(x=>x.checked=s.has(x.value));}

window.memberLogin=async function(){
 clearStatus('memberLoginStatus'); try{
  const d=await rpc('member_login_v2',{p_class:document.getElementById('memberClass').value,p_nopung:document.getElementById('memberNopung').value,p_pin:document.getElementById('memberPin').value});
  memberToken=d.token; document.getElementById('loginCard').classList.add('hidden');document.getElementById('memberApp').classList.remove('hidden');
  document.getElementById('memberTitle').textContent='Yaumiyah — '+d.nama;document.getElementById('memberIdentity').textContent=d.kelas+' | '+d.nopung; loadMemberDashboard();
 }catch(e){status('memberLoginStatus',e.message,false)}
}
window.loadMemberDashboard=async function(){
 clearStatus('memberStatus');try{
  memberData=await rpc('member_get_yaumiyah_v2',{p_token:memberToken,p_year:Number(document.getElementById('memberYear').value),p_month:document.getElementById('memberMonth').value});
  const h=['<div class="table-wrap"><table><thead><tr><th>Pekan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'];
  memberData.weeks.forEach(w=>h.push(`<tr><td>Pekan ${w.week}</td><td>${w.done?'✓ Sudah diisi':'Belum diisi'}</td><td><button class="light" onclick="openMemberWeek(${w.week})">${w.done?'Lihat/Edit':'Isi'}</button></td></tr>`));
  h.push('</tbody></table></div>');document.getElementById('memberWeeks').innerHTML=h.join('');
 }catch(e){status('memberStatus',e.message,false)}
}
window.openMemberWeek=function(week){
 const w=memberData.weeks.find(x=>Number(x.week)===Number(week))||{};
 document.getElementById('yWeek').value=week;document.getElementById('memberFormTitle').textContent=`Mutabaah ${memberData.month} ${memberData.year} — Pekan ${week}`;
 const map=[['yTilawah','tilawah'],['yQiyamul','qiyamul'],['ySholat','sholat'],['yPuasa','puasa'],['yOlahraga','olahraga'],['yIbr','ibr']];
 map.forEach(([id,k])=>{if(w[k])document.getElementById(id).value=w[k]});
 document.getElementById('memberForm').classList.remove('hidden');
}
window.closeMemberForm=()=>document.getElementById('memberForm').classList.add('hidden');
window.saveYaumiyah=async function(){
 clearStatus('memberFormStatus');try{
  await rpc('member_save_yaumiyah_v2',{p_token:memberToken,p_payload:{
    year:Number(document.getElementById('memberYear').value),month:document.getElementById('memberMonth').value,week:Number(document.getElementById('yWeek').value),
    tilawah:document.getElementById('yTilawah').value,qiyamul:document.getElementById('yQiyamul').value,sholat:document.getElementById('ySholat').value,
    puasa:document.getElementById('yPuasa').value,olahraga:document.getElementById('yOlahraga').value,ibr:document.getElementById('yIbr').value
  }});
  status('memberFormStatus','Yaumiyah berhasil disimpan.',true);await loadMemberDashboard();
 }catch(e){status('memberFormStatus',e.message,false)}
}

window.secretaryLogin=async function(){
 clearStatus('secretaryLoginStatus');try{
  const d=await rpc('secretary_login_v2',{p_class:document.getElementById('secretaryClass').value,p_pin:document.getElementById('secretaryPin').value});
  secretaryToken=d.token;document.getElementById('loginCard').classList.add('hidden');document.getElementById('secretaryApp').classList.remove('hidden');
  document.getElementById('secretaryTitle').textContent='Sekretaris Kelas '+d.kelas;document.getElementById('secretaryIdentity').textContent=d.nama+(d.nopung?' | '+d.nopung:'');
  loadSecretaryReport();
 }catch(e){status('secretaryLoginStatus',e.message,false)}
}
window.loadSecretaryReport=async function(){
 clearStatus('secretaryStatus');try{
  secretaryData=await rpc('secretary_get_report_v2',{p_token:secretaryToken,p_year:Number(document.getElementById('secYear').value),p_month:document.getElementById('secMonth').value,p_week:Number(document.getElementById('secWeek').value)});
  document.getElementById('secExecution').value=secretaryData.executionType||EXEC[0];document.getElementById('secDate').value=secretaryData.executionDate||'';
  document.getElementById('secStart').value=(secretaryData.startTime||'').slice(0,5);document.getElementById('secEnd').value=(secretaryData.endTime||'').slice(0,5);
  document.getElementById('secNaqib').value=secretaryData.naqibAttendance||NAQIB[0];document.getElementById('secLuOther').value=secretaryData.luOther||'';
  setChecks('wa',secretaryData.weeklyAgendas);setChecks('lu',secretaryData.luWeek4);setChecks('ma',secretaryData.monthlyAgendas);
  document.getElementById('secAttendance').innerHTML=(secretaryData.members||[]).map(m=>`<tr><td>${esc(m.nopung)}</td><td>${esc(m.nama)}</td><td><select data-att="${esc(m.nopung)}">${ATT.map(v=>`<option${v===m.status?' selected':''}>${esc(v)}</option>`).join('')}</select></td></tr>`).join('');
 }catch(e){status('secretaryStatus',e.message,false)}
}
window.saveSecretaryReport=async function(){
 clearStatus('secretaryStatus');try{
  const attendance=[...document.querySelectorAll('[data-att]')].map(x=>({nopung:x.dataset.att,status:x.value}));
  await rpc('secretary_save_report_v2',{p_token:secretaryToken,p_payload:{
   year:Number(document.getElementById('secYear').value),month:document.getElementById('secMonth').value,week:Number(document.getElementById('secWeek').value),
   executionType:document.getElementById('secExecution').value,executionDate:document.getElementById('secDate').value,startTime:document.getElementById('secStart').value,
   endTime:document.getElementById('secEnd').value,naqibAttendance:document.getElementById('secNaqib').value,weeklyAgendas:checked('wa'),luWeek4:checked('lu'),
   luOther:document.getElementById('secLuOther').value,monthlyAgendas:checked('ma'),attendance
  }});
  status('secretaryStatus','Laporan kelas berhasil disimpan.',true);await loadSecretaryReport();
 }catch(e){status('secretaryStatus',e.message,false)}
}

window.walasLogin=async function(){
 clearStatus('walasLoginStatus');try{
  const d=await rpc('legacy_walas_login',{p_class:document.getElementById('walasClass').value,p_pin:document.getElementById('walasPin').value});
  walasToken=d.token;walasClass=d.kelas;document.getElementById('loginCard').classList.add('hidden');document.getElementById('walasApp').classList.remove('hidden');
  document.getElementById('walasTitle').textContent='Walas '+d.kelas+(d.walas?' — '+d.walas:'');loadWalasMonitor();
 }catch(e){status('walasLoginStatus',e.message,false)}
}
window.loadWalasMonitor=async function(){
 clearStatus('walasStatus');try{
  const d=await rpc('walas_integrated_monitor_v2',{p_token:walasToken,p_year:Number(document.getElementById('walasYear').value),p_month:document.getElementById('walasMonth').value});
  document.getElementById('walasReports').innerHTML=(d.classReports||[]).map(r=>`<tr><td>Pekan ${r.week}</td><td>${r.reported?'✓ Sudah':'Belum'}</td><td>${esc(r.executionType||'—')}</td></tr>`).join('');
  document.getElementById('walasMembers').innerHTML=(d.members||[]).map(m=>`<tr><td>${esc(m.nopung)}</td><td>${esc(m.nama)}</td><td>${esc(m.status)}</td><td>${m.account_active?'✓ Aktif':'Belum'}</td><td>${m.yaumiyah_filled}/5</td></tr>`).join('');
 }catch(e){status('walasStatus',e.message,false)}
}

window.adminLogin=async function(){
 clearStatus('adminLoginStatus');try{
  const d=await rpc('legacy_admin_login',{p_admin:document.getElementById('adminId').value,p_pin:document.getElementById('adminPin').value});
  adminToken=d.token;document.getElementById('loginCard').classList.add('hidden');document.getElementById('adminApp').classList.remove('hidden');
  document.getElementById('adminTitle').textContent='Admin — '+(d.nama||d.adminId||'ADMIN');loadAdminDashboard();
 }catch(e){status('adminLoginStatus',e.message,false)}
}
window.loadAdminDashboard=async function(){
 clearStatus('adminStatus');try{
  const d=await rpc('admin_integrated_dashboard_v2',{p_admin_token:adminToken,p_year:Number(document.getElementById('adminYear').value),p_month:document.getElementById('adminMonth').value});
  document.getElementById('adminMatrix').innerHTML=(d.classes||[]).map(r=>`<tr><td><b>${esc(r.kelas)}</b></td><td>${esc(r.walas)}</td><td>${r.anggota_aktif}</td><td>${r.akun_yaumiyah}</td><td>${r.pengisi_yaumiyah}</td><td>${r.laporan_sekretaris}/5</td><td>${r.sekretaris_aktif?'✓ '+esc(r.sekretaris):'Belum'}</td></tr>`).join('');
 }catch(e){status('adminStatus',e.message,false)}
}
window.configureSecretary=async function(){
 clearStatus('adminSecStatus');try{
  const d=await rpc('admin_configure_secretary_v2',{p_admin_token:adminToken,p_class:document.getElementById('adminSecClass').value,p_nopung:document.getElementById('adminSecNopung').value});
  status('adminSecStatus',`Sekretaris ${d.kelas}: ${d.nama}. PIN sementara: ${d.pin}`,true);await loadAdminDashboard();
 }catch(e){status('adminSecStatus',e.message,false)}
}
window.activateMember=async function(){
 clearStatus('adminMemberStatus');try{
  const d=await rpc('admin_activate_member_v2',{p_admin_token:adminToken,p_class:document.getElementById('adminMemberClass').value,p_nopung:document.getElementById('adminMemberNopung').value,p_email:document.getElementById('adminMemberEmail').value||null});
  status('adminMemberStatus',`Akun ${d.kelas}/${d.nopung} — ${d.nama}. PIN sementara: ${d.pin}`,true);await loadAdminDashboard();
 }catch(e){status('adminMemberStatus',e.message,false)}
}
await init();
