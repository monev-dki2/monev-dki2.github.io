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
let classes=[], memberToken='', secretaryToken='', walasToken='', adminToken='', memberData=null, secretaryData=null, walasClass='', accountRequestIds={member:null,secretary:null};

function status(id,msg,ok=true){const e=document.getElementById(id);e.textContent=msg;e.className='status '+(ok?'ok':'err');}
function clearStatus(id){const e=document.getElementById(id);e.textContent='';e.className='status';}
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw new Error(error.message||String(error));if(data&&data.ok===false)throw new Error(data.error||'Akses ditolak.');return data;}
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
   ['memberClass','secretaryClass','walasClass','memberReqClass','secretaryReqClass'].forEach(id=>fillSelect(id,vals));
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


window.toggleAccountRequest=function(type){
 const box=document.getElementById(type==='member'?'memberRequestBox':'secretaryRequestBox');
 box.classList.toggle('hidden');
}

async function callEdge(name,payload){
 const res=await fetch(`${SUPABASE_URL}/functions/v1/${name}`,{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify(payload)
 });
 let data={};
 try{data=await res.json()}catch(_){}
 if(!res.ok||data.ok===false) throw new Error(data.error||`Permintaan gagal (${res.status}).`);
 return data;
}

window.requestAccount=async function(type){
 const isMember=type==='member';
 const prefix=isMember?'member':'secretary';
 const statusId=isMember?'memberReqStatus':'secretaryReqStatus';
 clearStatus(statusId);
 try{
   const d=await callEdge('request-account-access',{
     request_type:type,
     class_code:document.getElementById(prefix+'ReqClass').value,
     nopung:document.getElementById(prefix+'ReqNopung').value,
     email:document.getElementById(prefix+'ReqEmail').value.trim()
   });
   accountRequestIds[type]=d.request_id;
   document.getElementById(prefix+'VerifyBox').classList.remove('hidden');
   status(statusId,d.message||'Kode verifikasi telah dikirim ke email.',true);
 }catch(e){status(statusId,e.message,false)}
}

window.verifyAccountRequest=async function(type){
 const isMember=type==='member';
 const prefix=isMember?'member':'secretary';
 const statusId=isMember?'memberReqStatus':'secretaryReqStatus';
 clearStatus(statusId);
 try{
   const requestId=accountRequestIds[type];
   if(!requestId) throw new Error('Kirim kode verifikasi terlebih dahulu.');
   const d=await rpc('verify_account_request_v2',{
     p_request_id:requestId,
     p_code:document.getElementById(prefix+'ReqCode').value.trim()
   });
   status(statusId,d.message||'Email berhasil diverifikasi dan menunggu persetujuan Admin.',true);
   document.getElementById(prefix+'VerifyBox').classList.add('hidden');
 }catch(e){status(statusId,e.message,false)}
}

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
  const h=['<div class="table-wrap"><table><thead><tr><th>Pekan</th><th>Rentang</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'];
  memberData.weeks.forEach(w=>{
    let stateText='';
    if(w.done) stateText='✓ Sudah diisi';
    else if(w.state==='current') stateText='Pekan berjalan';
    else if(w.state==='future') stateText='Belum berjalan';
    else if(w.state==='past') stateText='Periode lampau — dapat diisi/edit';
    else stateText='Belum diisi';
    const badge=w.state==='current'?' <span class="pill">Pekan berjalan</span>':'';
    let action='—';
    if(w.done) action=`<button class="light" onclick="openMemberWeek(${w.week})">${w.canEdit?'Lihat/Edit':'Lihat'}</button>`;
    else if(w.canEdit) action=`<button class="light" onclick="openMemberWeek(${w.week})">Isi</button>`;
    h.push(`<tr><td><b>Pekan ${w.week}</b>${badge}</td><td>${esc(w.label||'')}</td><td>${esc(stateText)}</td><td>${action}</td></tr>`);
  });
  h.push('</tbody></table></div>');document.getElementById('memberWeeks').innerHTML=h.join('');
  if(memberData.isCurrentPeriod){
    const cw=memberData.currentWeek?`Pekan berjalan: P${memberData.currentWeek}. `:'';
    status('memberStatus',`${cw}Pekan yang belum dimulai terkunci otomatis.`,true);
  }else{
    status('memberStatus','Periode lampau: pengisian dan perbaikan backdate diperbolehkan.',true);
  }
 }catch(e){status('memberStatus',e.message,false)}
}
window.openMemberWeek=function(week){
 const w=memberData.weeks.find(x=>Number(x.week)===Number(week))||{};
 if(!w.done && !w.canEdit) return;
 document.getElementById('yWeek').value=week;
 document.getElementById('memberFormTitle').textContent=`Mutabaah ${memberData.month} ${memberData.year} — Pekan ${week} (${w.label||''})`;
 const map=[['yTilawah','tilawah'],['yQiyamul','qiyamul'],['ySholat','sholat'],['yPuasa','puasa'],['yOlahraga','olahraga'],['yIbr','ibr']];
 map.forEach(([id,k])=>{
   const el=document.getElementById(id);
   if(w[k]) el.value=w[k];
   el.disabled=!w.canEdit;
 });
 const saveBtn=document.querySelector('#memberForm button[onclick="saveYaumiyah()"]');
 if(saveBtn) saveBtn.classList.toggle('hidden',!w.canEdit);
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
  secretaryData=await rpc('secretary_get_report_v2',{
    p_token:secretaryToken,
    p_year:Number(document.getElementById('secYear').value),
    p_month:document.getElementById('secMonth').value,
    p_week:Number(document.getElementById('secWeek').value)
  });
  const secWeek=document.getElementById('secWeek');
  if(Array.isArray(secretaryData.ranges)){
    secWeek.innerHTML=secretaryData.ranges.map(r=>{
      const label=`Pekan ${r.week} — ${r.label}`;
      return `<option value="${r.week}"${Number(r.week)===Number(secretaryData.week)?' selected':''}>${esc(label)}</option>`;
    }).join('');
  }
  const info=document.getElementById('secretaryPeriodInfo');
  let stateText='';
  if(secretaryData.state==='current') stateText='Pekan berjalan';
  else if(secretaryData.state==='future') stateText='Belum berjalan — terkunci';
  else if(secretaryData.state==='past') stateText='Periode lampau — dapat diisi/edit';
  else stateText='Pekan sudah berjalan';
  info.textContent=`Pekan ${secretaryData.week}: ${secretaryData.weekLabel||''} • ${stateText}`;

  document.getElementById('secExecution').value=secretaryData.executionType||EXEC[0];
  document.getElementById('secDate').value=secretaryData.executionDate||'';
  document.getElementById('secStart').value=(secretaryData.startTime||'').slice(0,5);
  document.getElementById('secEnd').value=(secretaryData.endTime||'').slice(0,5);
  document.getElementById('secNaqib').value=secretaryData.naqibAttendance||NAQIB[0];
  document.getElementById('secLuOther').value=secretaryData.luOther||'';
  setChecks('wa',secretaryData.weeklyAgendas);
  setChecks('lu',secretaryData.luWeek4);
  setChecks('ma',secretaryData.monthlyAgendas);

  const editable=!!secretaryData.canEdit;
  ['secExecution','secDate','secStart','secEnd','secNaqib','secLuOther'].forEach(id=>document.getElementById(id).disabled=!editable);
  document.querySelectorAll('#weeklyAgenda input,#luAgenda input,#monthlyAgenda input').forEach(x=>x.disabled=!editable);

  document.getElementById('secAttendance').innerHTML=(secretaryData.members||[]).map(m=>
    `<tr><td>${esc(m.nopung)}</td><td>${esc(m.nama)}</td><td><select data-att="${esc(m.nopung)}" ${editable?'':'disabled'}>${ATT.map(v=>`<option${v===m.status?' selected':''}>${esc(v)}</option>`).join('')}</select></td></tr>`
  ).join('');
  const saveBtn=document.querySelector('#secretaryApp button[onclick="saveSecretaryReport()"]');
  if(saveBtn) saveBtn.classList.toggle('hidden',!editable);
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
  const d=await rpc('walas_integrated_monitor_v2',{
    p_token:walasToken,
    p_year:Number(document.getElementById('walasYear').value),
    p_month:document.getElementById('walasMonth').value
  });
  document.getElementById('walasReports').innerHTML=(d.classReports||[]).map(r=>{
    let st=r.reported?'✓ Sudah dilaporkan':'Belum dilaporkan';
    if(r.state==='current') st+=' • Pekan berjalan';
    else if(r.state==='future') st+=' • Belum berjalan';
    else if(r.state==='past') st+=' • Periode lampau';
    return `<tr>
      <td><b>Pekan ${r.week}</b><br><span class="muted">${esc(r.label||'')}</span></td>
      <td>${esc(st)}</td>
      <td>${esc(r.executionType||'—')}</td>
    </tr>`;
  }).join('');
  document.getElementById('walasMembers').innerHTML=(d.members||[]).map(m=>
    `<tr><td>${esc(m.nopung)}</td><td>${esc(m.nama)}</td><td>${esc(m.status)}</td>
     <td>${m.account_active?'✓ Aktif':'Belum'}</td><td>${m.yaumiyah_filled}/5</td></tr>`
  ).join('');
 }catch(e){status('walasStatus',e.message,false)}
}

window.adminLogin=async function(){
 clearStatus('adminLoginStatus');try{
  const d=await rpc('legacy_admin_login',{p_admin:document.getElementById('adminId').value,p_pin:document.getElementById('adminPin').value});
  adminToken=d.token;document.getElementById('loginCard').classList.add('hidden');document.getElementById('adminApp').classList.remove('hidden');
  document.getElementById('adminTitle').textContent='Admin — '+(d.nama||d.adminId||'ADMIN');loadAdminDashboard();loadAccountRequests();
 }catch(e){status('adminLoginStatus',e.message,false)}
}
window.loadAdminDashboard=async function(){
 clearStatus('adminStatus');try{
  const d=await rpc('admin_integrated_dashboard_v2',{p_admin_token:adminToken,p_year:Number(document.getElementById('adminYear').value),p_month:document.getElementById('adminMonth').value});
  document.getElementById('adminMatrix').innerHTML=(d.classes||[]).map(r=>`<tr><td><b>${esc(r.kelas)}</b></td><td>${esc(r.walas)}</td><td>${r.anggota_aktif}</td><td>${r.akun_yaumiyah}</td><td>${r.pengisi_yaumiyah}</td><td>${r.laporan_sekretaris}/5</td><td>${r.sekretaris_aktif?'✓ '+esc(r.sekretaris):'Belum'}</td></tr>`).join('');
 }catch(e){status('adminStatus',e.message,false)}
}


window.loadAccountRequests=async function(){
 clearStatus('adminRequestStatus');
 try{
   const d=await rpc('admin_account_requests_v2',{p_admin_token:adminToken});
   const rows=d.requests||[];
   document.getElementById('adminRequestRows').innerHTML=rows.length?rows.map(r=>{
     const jenis=r.requestType==='secretary'?'Sekretaris':'Anggota';
     const st=r.status==='delivery_failed'?'Email PIN gagal — kirim ulang':'Menunggu persetujuan';
     const when=r.verifiedAt?new Date(r.verifiedAt).toLocaleString('id-ID'):new Date(r.requestedAt).toLocaleString('id-ID');
     return `<tr>
       <td>${esc(jenis)}</td><td>${esc(r.nama)}</td><td>${esc(r.kelas)}</td><td>${esc(r.nopung)}</td>
       <td>${esc(r.emailMasked)}</td><td>${esc(when)}</td><td>${esc(st)}</td>
       <td>
         <button onclick="approveAccountRequest('${r.id}')">${r.status==='delivery_failed'?'Kirim Ulang':'Setujui'}</button>
         <button class="light" onclick="rejectAccountRequest('${r.id}')">Tolak</button>
       </td>
     </tr>`;
   }).join(''):`<tr><td colspan="8" class="muted">Tidak ada permintaan yang menunggu persetujuan.</td></tr>`;
 }catch(e){status('adminRequestStatus',e.message,false)}
}

window.approveAccountRequest=async function(id){
 clearStatus('adminRequestStatus');
 try{
   const d=await callEdge('approve-account-request',{admin_token:adminToken,request_id:id});
   status('adminRequestStatus',d.message||'Permintaan disetujui dan PIN dikirim ke email.',true);
   await loadAccountRequests(); await loadAdminDashboard();
 }catch(e){status('adminRequestStatus',e.message,false);await loadAccountRequests()}
}

window.rejectAccountRequest=async function(id){
 clearStatus('adminRequestStatus');
 try{
   const d=await rpc('admin_reject_account_request_v2',{
     p_admin_token:adminToken,p_request_id:id,p_note:'Ditolak Admin'
   });
   status('adminRequestStatus',d.message||'Permintaan ditolak.',true);
   await loadAccountRequests();
 }catch(e){status('adminRequestStatus',e.message,false)}
}

await init();
