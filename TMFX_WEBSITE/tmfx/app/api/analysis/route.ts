import {NextRequest,NextResponse} from 'next/server';
import {SYMBOLS,TFS} from '@/lib/symbols';
import {analyse,Candle} from '@/lib/analysis';
export const dynamic='force-dynamic';

async function candles(td:string,interval:string):Promise<Candle[]>{
 const u=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(td)}&interval=${interval}&outputsize=300&timezone=UTC&apikey=${process.env.TWELVE_DATA_API_KEY}`;
 const r=await fetch(u,{cache:'no-store'});const j=await r.json();
 if(j.status==='error'||!j.values)throw new Error(j.message||'No data returned');
 return (j.values as any[]).reverse().map(v=>{const d:string=v.datetime;
  return{t:Date.parse(d.length>10?d.replace(' ','T')+'Z':d+'T00:00:00Z'),o:+v.open,h:+v.high,l:+v.low,c:+v.close,v:v.volume!=null&&+v.volume>0?+v.volume:null}});
}
export async function GET(req:NextRequest){
 const tf=req.nextUrl.searchParams.get('tf')||'H1',T=TFS[tf];
 if(!T)return NextResponse.json({error:'Unknown timeframe'},{status:400});
 if(!process.env.TWELVE_DATA_API_KEY)return NextResponse.json({error:'Market data is not configured: set TWELVE_DATA_API_KEY on the server.'},{status:503});
 const out=await Promise.allSettled(SYMBOLS.map(async s=>{const cs=await candles(s.td,T.td);if(cs.length<210)throw new Error('Not enough history');return analyse(s.id,tf,cs,T.s)}));
 const results=out.flatMap(o=>o.status==='fulfilled'?[o.value]:[]);
 const errors=out.flatMap((o,i)=>o.status==='rejected'?[{id:SYMBOLS[i].id,error:String(o.reason?.message||o.reason)}]:[]);
 if(!results.length)return NextResponse.json({error:errors[0]?.error||'Market data unavailable',errors},{status:502});
 return NextResponse.json({tf,fetchedAt:Date.now(),results,errors});
}
