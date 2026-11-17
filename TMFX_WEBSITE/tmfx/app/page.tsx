'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {SYMBOLS,TFS} from '@/lib/symbols';
import type {Result,Signal} from '@/lib/analysis';

const SIG:Record<Signal,{bg:string;fg:string}>={'STRONG BUY':{bg:'#00ff88',fg:'#000'},BUY:{bg:'#22c55e',fg:'#000'},HOLD:{bg:'#facc15',fg:'#000'},SELL:{bg:'#ef4444',fg:'#fff'},'STRONG SELL':{bg:'#7f1d1d',fg:'#fff'}};
const fx=(n:number|null)=>n==null?'–':n.toFixed(n>=1000?2:n>=20?3:5);
const Badge=({s}:{s:Signal})=><span className="badge" style={{background:SIG[s]?.bg??'#444',color:SIG[s]?.fg??'#fff'}}>{s}</span>;
type Hist={t:number;id:string;tf:string;signal:Signal;price:number};

function Chart({tv,interval}:{tv:string;interval:string}){
 const [fail,setFail]=useState(false);
 useEffect(()=>{
  const mount=()=>{const W=(window as any).TradingView;const el=document.getElementById('tv');if(!W||!el)return;el.innerHTML='';
   new W.widget({autosize:true,symbol:tv,interval,timezone:'Etc/UTC',theme:'dark',style:'1',locale:'en',backgroundColor:'#000000',gridColor:'#1c1810',
    enable_publishing:false,allow_symbol_change:false,container_id:'tv'})};
  if((window as any).TradingView)return mount();
  let s=document.getElementById('tvjs') as HTMLScriptElement|null;
  if(!s){s=document.createElement('script');s.id='tvjs';s.src='https://s3.tradingview.com/tv.js';s.async=true;document.head.appendChild(s)}
  s.addEventListener('load',mount);s.addEventListener('error',()=>setFail(true));
  return()=>s!.removeEventListener('load',mount);
 },[tv,interval]);
 return<>{fail&&<p className="err">TradingView failed to load. Check your connection or ad-blocker.</p>}<div id="tv"/></>;
}

function Shot(){
 const [file,setFile]=useState<File|null>(null),[url,setUrl]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[out,setOut]=useState<any>(null),[on,setOn]=useState(false);
 const pick=(f?:File|null)=>{setOut(null);setErr('');if(!f)return;
  if(!['image/png','image/jpeg'].includes(f.type)){setErr('Use a PNG, JPG or JPEG image.');return}
  if(f.size>5*1024*1024){setErr('Image is larger than 5 MB.');return}
  setFile(f);setUrl(URL.createObjectURL(f))};
 const go=async()=>{if(!file||busy)return;setBusy(true);setErr('');setOut(null);
  try{const fd=new FormData();fd.append('file',file);const r=await fetch('/api/screenshot',{method:'POST',body:fd});const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Analysis failed');setOut(j.analysis)}catch(e:any){setErr(e.message||'Network error')}finally{setBusy(false)}};
 const L=(t:string,v?:string[]|string|null)=>v&&(Array.isArray(v)?v.length:v)?<p><b>{t}: </b>{Array.isArray(v)?v.join(', '):v}</p>:null;
 return<section className="card" aria-label="Screenshot analysis"><h2>Screenshot analysis</h2>
  <label className={'drop'+(on?' on':'')} onDragOver={e=>{e.preventDefault();setOn(true)}} onDragLeave={()=>setOn(false)} onDrop={e=>{e.preventDefault();setOn(false);pick(e.dataTransfer.files[0])}}>
   Drop a chart screenshot here, or tap to choose one (PNG, JPG, JPEG, max 5 MB)
   <input type="file" accept="image/png,image/jpeg" hidden onChange={e=>pick(e.target.files?.[0])}/></label>
  {url&&<img className="prev" src={url} alt="Uploaded chart preview"/>}
  <p><button className="btn" disabled={!file||busy} onClick={go}>{busy?'Analysing image…':'Analyse screenshot'}</button></p>
  {err&&<p className="err" role="alert">{err}</p>}
  {out&&<div><p className="fine">Screenshot analysis: based only on the uploaded image, not live market data.</p>
   <Badge s={out.signal}/> <span className="mut"> strength {out.strength}% · {out.instrument||'instrument unknown'} · {out.timeframe||'timeframe unknown'}</span>
   {L('Trend',out.trend)}{L('Patterns',out.patterns)}{L('Support',out.support)}{L('Resistance',out.resistance)}{L('Setup',out.setup)}
   {L('Entry zone',out.entryZone)}{L('Stop loss',out.stopLoss)}{L('Take profit',out.takeProfit)}<p>{out.explanation}</p><p className="fine">{out.caveats}</p></div>}
 </section>;
}

export default function Home(){
 const [sym,setSym]=useState('XAUUSD'),[tf,setTf]=useState('H1'),[res,setRes]=useState<Record<string,Result>>({});
 const [err,setErr]=useState<string|null>(null),[left,setLeft]=useState(60),[busy,setBusy]=useState(false),[at,setAt]=useState<number|null>(null);
 const [hist,setHist]=useState<Hist[]>([]),[online,setOnline]=useState(true);
 const inflight=useRef(false),ctrl=useRef<AbortController|null>(null),tfRef=useRef(tf),fails=useRef(0),last=useRef<Record<string,Signal>>({});

 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('tmfx')||'{}');if(s.sym)setSym(s.sym);if(s.tf&&TFS[s.tf])setTf(s.tf);setHist(s.hist||[])}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem('tmfx',JSON.stringify({sym,tf,hist}))}catch{}},[sym,tf,hist]);

 const refresh=useCallback(async(force=false)=>{
  if(inflight.current){if(!force)return;ctrl.current?.abort()}
  const my=new AbortController();ctrl.current=my;inflight.current=true;setBusy(true);setLeft(60);
  try{
   if(!navigator.onLine)throw new Error('You are offline');
   const r=await fetch('/api/analysis?tf='+tfRef.current,{cache:'no-store',signal:my.signal});const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Request failed');
   if(j.tf!==tfRef.current)return;
   const m:Record<string,Result>={};const add:Hist[]=[];
   for(const x of j.results as Result[]){m[x.id]=x;const k=x.id+x.tf;if(last.current[k]!==x.signal){last.current[k]=x.signal;if(x.fresh)add.push({t:j.fetchedAt,id:x.id,tf:x.tf,signal:x.signal,price:x.price})}}
   setRes(m);setAt(j.fetchedAt);fails.current=0;
   setErr(j.errors?.length?`${j.errors.length} instrument(s) unavailable: ${j.errors.map((e:any)=>e.id).join(', ')}`:null);
   if(add.length)setHist(h=>[...add,...h].slice(0,60));
  }catch(e:any){if(my.signal.aborted)return;fails.current++;setErr(e.message||'Network error');setLeft(Math.min(60,5*2**fails.current))}
  finally{if(ctrl.current===my){inflight.current=false;setBusy(false)}}
 },[]);

 useEffect(()=>{tfRef.current=tf;last.current={};refresh(true)},[tf,refresh]);
 useEffect(()=>{const i=setInterval(()=>{if(!inflight.current)setLeft(l=>Math.max(0,l-1))},1000);return()=>clearInterval(i)},[]);
 useEffect(()=>{if(left<=0&&!inflight.current)refresh()},[left,refresh]);
 useEffect(()=>{const u=()=>{setOnline(navigator.onLine);if(navigator.onLine)refresh()};setOnline(navigator.onLine);
  addEventListener('online',u);addEventListener('offline',u);return()=>{removeEventListener('online',u);removeEventListener('offline',u)}},[refresh]);

 const cur=res[sym],S=SYMBOLS.find(s=>s.id===sym)!,all=Object.values(res);
 const bulls=all.filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4),bears=all.filter(x=>x.score<0).sort((a,b)=>a.score-b.score).slice(0,4);
 const status=!online?['bad','Offline: showing last data, not current']:err&&!cur?['bad','Data unavailable']:!cur?['warn','Loading…']:err&&at?['warn','Update failed: showing older data']:cur.fresh?['ok','Data current']:['warn',`Delayed or market closed: last candle ${Math.round(cur.ageSec/60)} min old`];
 const List=({xs,t}:{xs:Result[];t:string})=><section className="card"><h2>{t}</h2>{xs.length?xs.map(x=><button key={x.id} className="row" onClick={()=>setSym(x.id)}><span>{x.id}</span><Badge s={x.signal}/><span className="mut">{x.strength}%</span></button>):<p className="mut">No setups on {tf} right now.</p>}</section>;

 return<>
  <header className="top"><div className="logo"><svg viewBox="0 0 64 64" aria-hidden><g fill="#d4a72c"><rect x="8" y="30" width="12" height="22"/><rect x="26" y="18" width="12" height="34"/><rect x="44" y="6" width="12" height="46"/></g></svg>TMFX</div>
   <span className="mut">Professional forex market analysis</span><span className="sp"/>
   <span className={'chip '+status[0]} role="status">{status[1]}</span>
   <div className="ring" aria-label={`Next refresh in ${left} seconds`}><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" stroke="#2b2518"/><circle cx="24" cy="24" r="20" stroke="#d4a72c" strokeDasharray="125.7" strokeDashoffset={125.7*(1-left/60)}/></svg>{left}</div>
   <button className="btn" disabled={busy} onClick={()=>refresh()}>{busy?'REFRESHING…':'REFRESH ANALYSIS'}</button></header>
  <main className="wrap"><div>
   <section className="card"><div className="pills" role="group" aria-label="Instrument">{SYMBOLS.map(s=><button key={s.id} className="pill" aria-pressed={s.id===sym} onClick={()=>setSym(s.id)}>{s.id}</button>)}</div>
    <div className="pills" role="group" aria-label="Timeframe">{Object.keys(TFS).map(t=><button key={t} className="pill" aria-pressed={t===tf} onClick={()=>setTf(t)}>{t}</button>)}</div>
    <Chart tv={S.tv} interval={TFS[tf].tvi}/><p className="fine">Chart: TradingView ({S.tv}); TradingView may delay some exchange data. The analysis below uses a separate licensed data feed, since embedded TradingView widgets do not expose their data.</p></section>
   <section className="card" aria-live="polite"><h2>AI market analysis · {sym} · {tf}</h2>
    {err&&<p className="err" role="alert">{err}{fails.current?` · retrying in ${left}s`:''}</p>}
    {cur?<><Badge s={cur.signal}/> <span className="mut"> {cur.trend} · strength {cur.strength}%</span>
     <div className="bar" style={{margin:'8px 0'}}><i style={{width:cur.strength+'%',background:SIG[cur.signal].bg}}/></div>
     <div className="kv"><div><small>Price</small><b>{fx(cur.price)}</b></div><div><small>Entry zone</small><b>{cur.entry?`${fx(cur.entry[0])} – ${fx(cur.entry[1])}`:'No trade setup'}</b></div>
      <div><small>Stop loss</small><b>{fx(cur.sl)}</b></div><div><small>Take profit</small><b>{fx(cur.tp)}</b></div><div><small>Risk : reward</small><b>{cur.rr?`1 : ${cur.rr.toFixed(2)}`:'–'}</b></div>
      <div><small>Support / resistance</small><b>{fx(cur.support)} / {fx(cur.resistance)}</b></div><div><small>RSI · MACD hist</small><b>{cur.rsi.toFixed(1)} · {cur.macdHist.toPrecision(2)}</b></div><div><small>Volatility</small><b>{cur.volatility}</b></div></div>
     <p className="fine">EMA 9 {fx(cur.emas[9])} · 21 {fx(cur.emas[21])} · 50 {fx(cur.emas[50])} · 200 {fx(cur.emas[200])}. Last candle {new Date(cur.asOf).toUTCString()}; fetched {at?new Date(at).toLocaleTimeString():'–'}.</p>
     <ul className="why">{cur.reasons.map(r=><li key={r}>{r}</li>)}</ul></>:<p className="mut">{err?'No analysis available for this instrument.':'Loading market data…'}</p>}
    <p className="fine">Rule-based signals from real market candles. They are not financial advice and do not guarantee any result.</p></section>
   <Shot/></div>
   <aside><List xs={bulls} t={`Strongest bullish · ${tf}`}/><List xs={bears} t={`Strongest bearish · ${tf}`}/>
    <section className="card"><h2>Recent signals</h2>{hist.length?hist.slice(0,12).map((h,i)=><div className="row" key={i}><span>{h.id}</span><Badge s={h.signal}/><span className="mut">{h.tf} · {new Date(h.t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div>):<p className="mut">Signal changes will appear here.</p>}
     {hist.length>0&&<p><button className="btn ghost" onClick={()=>setHist([])}>Clear history</button></p>}</section></aside></main></>;
}
