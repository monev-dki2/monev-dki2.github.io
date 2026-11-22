const SUPABASE_URL='https://doovdbzqlbwxckkydfwg.supabase.co';
const SUPABASE_KEY='sb_publishable_gw4WQtfPZ4xtbcduTfAlSA_qLDPVTNK';
const ALLOWED_ORIGINS=new Set([
  'https://monev-dki2.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
]);

function cors(req,res){
  const origin=req.headers.origin||'';
  if(ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Cache-Control','no-store');
}

export default async function handler(req,res){
  cors(req,res);
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed'});

  const origin=req.headers.origin||'';
  if(origin && !ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ok:false,error:'Origin not allowed'});

  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const kind=String(body.kind||'rpc');
    const name=String(body.name||'').trim();
    const payload=body.payload||{};
    if(!name || !/^[a-zA-Z0-9_-]+$/.test(name)) return res.status(400).json({ok:false,error:'Invalid endpoint name'});

    let url;
    const headers={'Content-Type':'application/json'};
    if(kind==='rpc'){
      url=`${SUPABASE_URL}/rest/v1/rpc/${name}`;
      headers['apikey']=SUPABASE_KEY;
      headers['Authorization']=`Bearer ${SUPABASE_KEY}`;
    }else if(kind==='edge'){
      url=`${SUPABASE_URL}/functions/v1/${name}`;
    }else{
      return res.status(400).json({ok:false,error:'Invalid proxy kind'});
    }

    const upstream=await fetch(url,{method:'POST',headers,body:JSON.stringify(payload)});
    const text=await upstream.text();
    res.status(upstream.status);
    const ct=upstream.headers.get('content-type')||'application/json';
    res.setHeader('Content-Type',ct);
    return res.send(text);
  }catch(e){
    return res.status(502).json({ok:false,error:e?.message||'Proxy request failed'});
  }
}
