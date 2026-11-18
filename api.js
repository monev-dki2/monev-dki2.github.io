import { supabase } from './supabase.js';
import { getWalasSession, getAdminSession } from './auth.js';

const rpc=async(name,args={})=>{const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data};
const walasToken=()=>{const s=getWalasSession();if(!s?.token)throw new Error('Sesi Walas berakhir. Silakan login kembali.');return s.token};
const adminToken=()=>{const s=getAdminSession();if(!s?.token)throw new Error('Sesi Admin berakhir. Silakan login kembali.');return s.token};

export const walasDashboard=(_,p)=>rpc('walas_dashboard',{p_token:walasToken(),p_period:p});
export const saveEvaluations=(_,p,rows)=>rpc('walas_save',{p_token:walasToken(),p_period:p,p_rows:rows});
export const promotionDashboard=(_,p)=>rpc('walas_promotion_dashboard',{p_token:walasToken(),p_period:p});
export const promotionAssessment=(_,p,n)=>rpc('walas_promotion_assessment',{p_token:walasToken(),p_period:p,p_nopung:n});
export const savePromotion=(_,p,n,items,cancel,note,finalize)=>rpc('walas_promotion_save',{
  p_token:walasToken(),p_period:p,p_nopung:n,p_items:items,p_cancel_factors:cancel,p_final_note:note,p_finalize:finalize
});

export const adminRecap=p=>rpc('admin_recap_v2',{p_token:adminToken(),p_period:p});
export const adminMembers=()=>rpc('admin_members_v2',{p_token:adminToken()});
export const adminPromotion=p=>rpc('admin_promotion_dashboard_v2',{p_token:adminToken(),p_period:p});
