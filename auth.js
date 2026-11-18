import { supabase } from './supabase.js';

const WALAS_TOKEN_KEY='walas_v2_token';
const CLASS_KEY='walas_v2_class';
const WALAS_KEY='walas_v2_name';
const ADMIN_TOKEN_KEY='admin_v2_token';
const ADMIN_ID_KEY='admin_v2_id';
const ADMIN_NAME_KEY='admin_v2_name';

export async function listClasses(){
  const {data,error}=await supabase.rpc('list_active_classes');
  if(error) throw error;
  return data||[];
}

export async function loginWalas(classCode,pin){
  const {data,error}=await supabase.rpc('walas_login',{p_class_code:classCode,p_pin:pin});
  if(error) throw error;
  if(!data?.ok||!data?.token) throw new Error('Login gagal.');
  localStorage.setItem(WALAS_TOKEN_KEY,data.token);
  localStorage.setItem(CLASS_KEY,data.class_code||String(classCode).toUpperCase());
  localStorage.setItem(WALAS_KEY,data.walas_name||'');
  clearAdminLocal();
  return data;
}

export function getWalasSession(){
  const token=localStorage.getItem(WALAS_TOKEN_KEY)||'';
  const classCode=localStorage.getItem(CLASS_KEY)||'';
  const walasName=localStorage.getItem(WALAS_KEY)||'';
  return token&&classCode?{token,classCode,walasName}:null;
}

export async function loginAdmin(adminId,pin){
  const {data,error}=await supabase.rpc('admin_login_v2',{p_admin_id:adminId,p_pin:pin});
  if(error) throw error;
  if(!data?.ok||!data?.token) throw new Error('Login Admin gagal.');
  localStorage.setItem(ADMIN_TOKEN_KEY,data.token);
  localStorage.setItem(ADMIN_ID_KEY,data.admin_id||String(adminId).toUpperCase());
  localStorage.setItem(ADMIN_NAME_KEY,data.name||'');
  clearWalasLocal();
  return data;
}

export function getAdminSession(){
  const token=localStorage.getItem(ADMIN_TOKEN_KEY)||'';
  const adminId=localStorage.getItem(ADMIN_ID_KEY)||'';
  const name=localStorage.getItem(ADMIN_NAME_KEY)||'';
  return token&&adminId?{token,adminId,name}:null;
}

function clearWalasLocal(){
  localStorage.removeItem(WALAS_TOKEN_KEY);
  localStorage.removeItem(CLASS_KEY);
  localStorage.removeItem(WALAS_KEY);
}
function clearAdminLocal(){
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_ID_KEY);
  localStorage.removeItem(ADMIN_NAME_KEY);
}

export async function logout(){
  const w=getWalasSession();
  const a=getAdminSession();
  if(w?.token){try{await supabase.rpc('walas_logout',{p_token:w.token})}catch(_){} }
  if(a?.token){try{await supabase.rpc('admin_logout_v2',{p_token:a.token})}catch(_){} }
  clearWalasLocal();
  clearAdminLocal();
}
