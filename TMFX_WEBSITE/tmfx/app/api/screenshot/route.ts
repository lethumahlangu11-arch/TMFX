import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
const OK=['image/png','image/jpeg','image/jpg'];
const PROMPT=`You are a professional chart analyst. The attached image is a screenshot of a trading chart. Analyse ONLY what is visible. Never invent prices that are not readable on the chart.
Reply with a single JSON object, no markdown, with keys:
chartRecognised (boolean), instrument (string|null), timeframe (string|null), signal (one of "STRONG BUY","BUY","HOLD","SELL","STRONG SELL"), strength (0-100),
trend (string), patterns (string[] candlestick/chart patterns seen), support (string[]), resistance (string[]), setup (string: bullish/bearish setup, breakout or retest if any),
entryZone (string|null), stopLoss (string|null), takeProfit (string|null), explanation (string), caveats (string).
If it is not a trading chart, set chartRecognised=false, signal="HOLD", strength=0 and explain. Give entry/stop/target only when the visible levels justify them, otherwise null. Never promise outcomes.`;
export async function POST(req:NextRequest){
 if(!process.env.ANTHROPIC_API_KEY)return NextResponse.json({error:'Screenshot analysis is not configured: set ANTHROPIC_API_KEY on the server.'},{status:503});
 let f:File|null=null;try{f=(await req.formData()).get('file') as File|null}catch{}
 if(!f||!OK.includes(f.type))return NextResponse.json({error:'Upload a PNG, JPG or JPEG image.'},{status:400});
 if(f.size>5*1024*1024)return NextResponse.json({error:'Image is larger than 5 MB.'},{status:413});
 const data=Buffer.from(await f.arrayBuffer()).toString('base64');
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
  headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
  body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5-5',max_tokens:1500,
   messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:f.type==='image/png'?'image/png':'image/jpeg',data}},{type:'text',text:PROMPT}]}]})});
 const j=await r.json();
 if(!r.ok)return NextResponse.json({error:j.error?.message||'The vision service returned an error.'},{status:502});
 const txt:string=(j.content||[]).map((b:any)=>b.text||'').join('');const m=txt.match(/\{[\s\S]*\}/);
 try{return NextResponse.json({analysis:JSON.parse(m![0]),source:'screenshot'})}
 catch{return NextResponse.json({error:'The AI reply could not be read. Try again.'},{status:502})}
}
