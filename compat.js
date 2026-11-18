(function(){
  const SUPABASE_URL='https://doovdbzqlbwxckkydfwg.supabase.co';
  const SUPABASE_KEY='sb_publishable_gw4WQtfPZ4xtbcduTfAlSA_qLDPVTNK';
  const clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    .then(m=>m.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}));

  const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const periodDate=(year,month)=>`${year}-${String(MONTHS.indexOf(month)+1).padStart(2,'0')}-01`;
  const fmtDateTime=(v)=>{ if(!v) return ''; const d=new Date(v); if(Number.isNaN(d.getTime())) return String(v); return d.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',', ''); };

  async function rpc(name,args={}){
    const c=await clientPromise;
    const {data,error}=await c.rpc(name,args);
    if(error) throw new Error(error.message||String(error));
    if(data && data.ok === false) throw new Error(data.error || 'Akses ditolak.');
    return data;
  }

  const adaptAssessment=(a)=>{
    if(!a) return a;
    const rubric=(a.rubric||[]).map(r=>({
      no:r.no ?? r.indicator_no,
      dimensi:r.dimensi ?? r.dimension,
      kode:r.kode ?? r.code,
      indikator:r.indikator ?? r.indicator,
      s1:r.s1 ?? r.score_1,
      s2:r.s2 ?? r.score_2,
      s3:r.s3 ?? r.score_3,
      s4:r.s4 ?? r.score_4,
      score:r.score,
      comment:r.comment||''
    }));
    const cancel=(a.cancelFactors ?? a.cancel_factors ?? []).map(String);
    return {
      assessmentId:a.assessmentId ?? a.assessment_id ?? null,
      period:a.period,
      kelas:a.kelas ?? a.class_code,
      nopung:a.nopung,
      nama:a.nama,
      status:a.status||'Belum Dimulai',
      progress:Number(a.progress||0),
      total:a.total ?? a.total_score ?? '',
      percent:a.percent ?? a.percentage ?? '',
      result:a.result||'',
      cancelFactors:cancel,
      finalNote:a.finalNote ?? a.final_note ?? '',
      needsRevision:Boolean(a.needsRevision ?? a.needs_revision),
      revisionReason:a.revisionReason ?? a.revision_reason ?? '',
      locked:Boolean(a.locked ?? a.status==='Dikunci'),
      rubric,
      cancelRules:a.cancelRules||[
        'Mempercayai dan melakukan kemusyrikan',
        'Tidak memiliki kontribusi nyata',
        'Sering merasa kecewa dengan kebijakan dan pimpinan',
        'Berakhlak buruk dalam muamalah'
      ]
    };
  };

  async function call(method,args){
    switch(method){
      case 'publicGetActiveClasses': return rpc('legacy_public_classes');
      case 'login': return rpc('legacy_walas_login',{p_class:args[0],p_pin:args[1]});
      case 'walasRecordLoginAudit': return {ok:true};
      case 'walasGetPeriodDashboard': return rpc('legacy_walas_dashboard',{p_token:args[0],p_year:Number(args[1]),p_month:args[2]});
      case 'walasGetSupportingData': return rpc('legacy_walas_support',{p_token:args[0]});
      case 'walasChangeOwnPin': return rpc('legacy_walas_change_pin',{p_token:args[0],p_old:args[1],p_new:args[2],p_confirm:args[3]});
      case 'saveEvaluationsForPeriod': return rpc('legacy_save_evaluations',{p_token:args[0],p_year:Number(args[1]),p_month:args[2],p_rows:args[3]});

      case 'walasGetPromotionDashboard': {
        const d=await rpc('walas_promotion_dashboard',{p_token:args[0],p_period:periodDate(Number(args[1]),args[2])});
        const rows=(d.rows||[]).map(r=>({
          nopung:r.nopung,nama:r.nama,umurTarbawi:r.tahun_pelantikan?Math.max(0,Number(args[1])-Number(r.tahun_pelantikan)):'',
          potensi:r.potensi_promosi||'Belum',assessmentId:r.assessment_id||'',status:r.status||'Belum Dimulai',progress:Number(r.progress||0),
          total:r.total_score??'',percent:r.percentage??'',result:r.result||'',needsRevision:Boolean(r.needs_revision),updatedAt:fmtDateTime(r.updated_at)
        }));
        const s={totalMembers:rows.length,priority:0,notStarted:0,draft:0,final:0,locked:0,revision:0};
        rows.forEach(r=>{if(r.potensi==='Sudah'||r.potensi==='Perlu Pembahasan')s.priority++; if(r.status==='Belum Dimulai')s.notStarted++; else if(r.status==='Draft')s.draft++; else if(r.status==='Final')s.final++; else if(r.status==='Dikunci')s.locked++; else if(r.status==='Perlu Revisi')s.revision++;});
        return {period:d.period?String(d.period):`${args[2]} ${args[1]}`,kelas:d.class_code,rows,summary:s,cancelRules:[]};
      }
      case 'walasGetPromotionAssessment': {
        const d=await rpc('legacy_walas_promo_assessment',{p_token:args[0],p_year:Number(args[1]),p_month:args[2],p_nopung:args[3]});
        return adaptAssessment(d);
      }
      case 'walasSavePromotionAssessment': {
        const payload=args[3]||{};
        const items=(payload.items||[]).map(x=>({indicator_no:Number(x.no),score:Number(x.score)||null,comment:x.comment||''}));
        await rpc('walas_promotion_save',{
          p_token:args[0],p_period:periodDate(Number(args[1]),args[2]),p_nopung:payload.nopung,
          p_items:items,p_cancel_factors:(payload.cancelFactors||[]).map(Number),p_final_note:payload.finalNote||'',p_finalize:Boolean(args[4])
        });
        const d=await rpc('legacy_walas_promo_assessment',{p_token:args[0],p_year:Number(args[1]),p_month:args[2],p_nopung:payload.nopung});
        return {ok:true,message:args[4]?'Penilaian promosi berhasil difinalisasi.':'Draft penilaian promosi berhasil disimpan.',assessment:adaptAssessment(d)};
      }

      case 'adminLogin': return rpc('legacy_admin_login',{p_admin:args[0],p_pin:args[1]});
      case 'adminGetInitialOverview': return rpc('legacy_admin_overview',{p_token:args[0]});
      case 'adminGetActivePeriodRecap': return rpc('legacy_admin_recap',{p_token:args[0],p_period:null});
      case 'adminSetActivePeriod': return rpc('legacy_admin_set_period',{p_token:args[0],p_year:Number(args[2]),p_month:args[1]});
      case 'adminGetClassAccess': return rpc('legacy_admin_class_access',{p_token:args[0]});
      case 'adminAddClass': return rpc('legacy_admin_add_class',{p_token:args[0],p_data:args[1]});
      case 'adminUpdateClass': return rpc('legacy_admin_update_class',{p_token:args[0],p_class:args[1],p_walas:args[2],p_email:args[3],p_active:Boolean(args[4])});
      case 'adminGenerateClassPin': return rpc('legacy_admin_generate_pin',{p_token:args[0],p_class:args[1]});
      case 'adminOpenAsWalas': return rpc('legacy_admin_open_walas',{p_token:args[0],p_class:args[1]});
      case 'adminChangeOwnPin': return rpc('legacy_admin_change_pin',{p_token:args[0],p_old:args[1],p_new:args[2],p_confirm:args[3]});
      case 'adminListMembers': return rpc('legacy_admin_list_members',{p_token:args[0]});
      case 'adminAddMember': return rpc('legacy_admin_add_member',{p_token:args[0],p_member:args[1]});
      case 'adminUpdateMember': return rpc('legacy_admin_update_member',{p_token:args[0],p_original:args[1],p_member:args[2]});
      case 'adminSetMemberStatus': return rpc('legacy_admin_set_member_status',{p_token:args[0],p_nopung:args[1],p_status:args[2]});
      case 'adminDeleteMember': return rpc('legacy_admin_delete_member',{p_token:args[0],p_nopung:args[1]});
      case 'adminGetEvaluationResults': return rpc('legacy_admin_eval_results',{p_token:args[0],p_class:args[1]||''});

      case 'adminGetPromotionDashboard': {
        const d=await rpc('admin_promotion_dashboard_v2',{p_token:args[0],p_period:periodDate(Number(args[1]),args[2])});
        const kf=(args[3]||'').toUpperCase(), sf=args[4]||'';
        let rows=(d.rows||[]).filter(r=>r.member_status!=='Tidak Aktif').map(r=>({
          kelas:r.class_code,walas:r.walas_name||'',nopung:r.nopung,nama:r.nama,potensi:r.potensi_promosi||'Belum',status:r.status||'Belum Dimulai',
          progress:Number(r.progress||0),total:r.total_score??'',percent:r.percentage??'',result:r.result||'',hasCancel:Array.isArray(r.cancel_factors)&&r.cancel_factors.length>0,assessmentId:r.assessment_id||'',updatedAt:fmtDateTime(r.updated_at)
        }));
        if(kf) rows=rows.filter(r=>r.kelas===kf); if(sf) rows=rows.filter(r=>r.status===sf);
        const by={}; rows.forEach(r=>{const x=by[r.kelas]||(by[r.kelas]={kelas:r.kelas,walas:r.walas,members:0,priority:0,notStarted:0,draft:0,final:0,locked:0,revision:0});x.members++;if(r.potensi==='Sudah'||r.potensi==='Perlu Pembahasan')x.priority++;if(r.status==='Belum Dimulai')x.notStarted++;else if(r.status==='Draft')x.draft++;else if(r.status==='Final')x.final++;else if(r.status==='Dikunci')x.locked++;else if(r.status==='Perlu Revisi')x.revision++;});
        const classRows=Object.values(by); const summary={classes:classRows.length,members:0,priority:0,notStarted:0,draft:0,final:0,locked:0,revision:0}; classRows.forEach(x=>Object.keys(summary).forEach(k=>{if(k!=='classes')summary[k]+=Number(x[k]||0)}));
        return {period:`${args[2]} ${args[1]}`,summary,classRows,rows,statusOptions:['','Belum Dimulai','Draft','Final','Perlu Revisi','Dikunci']};
      }
      case 'adminGetPromotionAssessment': return adaptAssessment(await rpc('legacy_admin_promo_assessment',{p_token:args[0],p_year:Number(args[1]),p_month:args[2],p_class:args[3],p_nopung:args[4]}));
      case 'adminReopenPromotion': return rpc('legacy_admin_reopen_promo',{p_token:args[0],p_assessment:args[1],p_reason:args[2]});
      case 'adminLockPromotion': return rpc('legacy_admin_lock_promo',{p_token:args[0],p_assessment:args[1]});
      default: throw new Error('Fungsi Web v2 belum dipetakan: '+method);
    }
  }

  function makeRunner(success,failure){
    return new Proxy({}, {
      get(_,prop){
        if(prop==='withSuccessHandler') return fn=>makeRunner(fn,failure);
        if(prop==='withFailureHandler') return fn=>makeRunner(success,fn);
        return (...args)=>{ Promise.resolve().then(()=>call(prop,args)).then(v=>success&&success(v)).catch(e=>failure?failure(e):console.error(e)); };
      }
    });
  }
  window.google={script:{get run(){return makeRunner(null,null);}}};
})();
