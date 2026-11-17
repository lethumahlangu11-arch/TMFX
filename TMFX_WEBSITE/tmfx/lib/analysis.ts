export type Candle={t:number;o:number;h:number;l:number;c:number;v:number|null};
export type Signal='STRONG BUY'|'BUY'|'HOLD'|'SELL'|'STRONG SELL';
export type Result={id:string;tf:string;price:number;signal:Signal;strength:number;score:number;trend:'Bullish'|'Bearish'|'Sideways';
 entry:[number,number]|null;sl:number|null;tp:number|null;rr:number|null;support:number|null;resistance:number|null;
 rsi:number;macdHist:number;emas:Record<string,number>;atr:number;volatility:string;reasons:string[];asOf:number;ageSec:number;fresh:boolean};

export const ema=(a:number[],p:number)=>{const k=2/(p+1),r:number[]=[];a.forEach((x,i)=>r.push(i?x*k+r[i-1]*(1-k):x));return r};
export function rsi(c:number[],p=14){let g=0,l=0;for(let i=1;i<=p;i++){const d=c[i]-c[i-1];d>0?g+=d:l-=d}g/=p;l/=p;
 for(let i=p+1;i<c.length;i++){const d=c[i]-c[i-1];g=(g*(p-1)+Math.max(d,0))/p;l=(l*(p-1)+Math.max(-d,0))/p}return l===0?100:100-100/(1+g/l)}
export function atr(cs:Candle[],p=14){const tr=cs.map((x,i)=>i?Math.max(x.h-x.l,Math.abs(x.h-cs[i-1].c),Math.abs(x.l-cs[i-1].c)):x.h-x.l);
 let a=tr.slice(1,p+1).reduce((s,x)=>s+x,0)/p;for(let i=p+1;i<tr.length;i++)a=(a*(p-1)+tr[i])/p;return a}

export function analyse(id:string,tf:string,cs:Candle[],tfSec:number):Result{
 const c=cs.map(x=>x.c),n=cs.length-1,price=c[n],a=atr(cs),R=rsi(c);
 const e9=ema(c,9),e21=ema(c,21),e50=ema(c,50),e200=ema(c,200);
 const e12=ema(c,12),e26=ema(c,26),ml=e12.map((x,i)=>x-e26[i]),sg=ema(ml,9),h=ml.map((x,i)=>x-sg[i]);
 let s=0;const why:string[]=[];const add=(v:number,t:string)=>{s+=v;why.push(t)};
 const [E9,E21,E50,E200]=[e9[n],e21[n],e50[n],e200[n]];
 if(E9>E21&&E21>E50&&E50>E200)add(2,'EMA 9 > 21 > 50 > 200: full bullish alignment');
 else if(E9<E21&&E21<E50&&E50<E200)add(-2,'EMA 9 < 21 < 50 < 200: full bearish alignment');
 else if(E9>E21&&E21>E50)add(1,'Short EMAs aligned bullish (9 > 21 > 50)');
 else if(E9<E21&&E21<E50)add(-1,'Short EMAs aligned bearish (9 < 21 < 50)');
 else why.push('EMAs are mixed: no clean trend alignment');
 price>E200?add(1,'Price is above the EMA 200'):add(-1,'Price is below the EMA 200');
 if(R>=75)add(-0.5,`RSI ${R.toFixed(0)}: overbought`);else if(R<=25)add(0.5,`RSI ${R.toFixed(0)}: oversold`);
 else if(R>=55)add(0.5,`RSI ${R.toFixed(0)}: bullish momentum`);else if(R<=45)add(-0.5,`RSI ${R.toFixed(0)}: bearish momentum`);else why.push(`RSI ${R.toFixed(0)}: neutral`);
 if(h[n]>0)add(h[n]>h[n-1]?1.5:1,`MACD histogram positive${h[n]>h[n-1]?' and rising':''}`);else add(h[n]<h[n-1]?-1.5:-1,`MACD histogram negative${h[n]<h[n-1]?' and falling':''}`);
 // swing pivots (3 bars each side) for structure, support/resistance, supply/demand zones
 const hi:number[]=[],lo:number[]=[];
 for(let i=Math.max(3,n-200);i<=n-3;i++){const w=cs.slice(i-3,i+4);
  if(cs[i].h>=Math.max(...w.map(x=>x.h)))hi.push(i);if(cs[i].l<=Math.min(...w.map(x=>x.l)))lo.push(i)}
 const H=hi.slice(-2).map(i=>cs[i].h),L=lo.slice(-2).map(i=>cs[i].l);
 if(H.length==2&&L.length==2){
  if(H[1]>H[0]&&L[1]>L[0])add(1.5,'Market structure: higher highs and higher lows');
  else if(H[1]<H[0]&&L[1]<L[0])add(-1.5,'Market structure: lower highs and lower lows');
  else why.push('Market structure: mixed swings (range or transition)')}
 const sup=Math.max(-Infinity,...lo.map(i=>cs[i].l).filter(x=>x<price)),res=Math.min(Infinity,...hi.map(i=>cs[i].h).filter(x=>x>price));
 const support=isFinite(sup)?sup:null,resistance=isFinite(res)?res:null;
 if(support!=null&&price-support<0.75*a)add(0.5,'Price is at a demand zone (swing-low support)');
 if(resistance!=null&&resistance-price<0.75*a)add(-0.5,'Price is at a supply zone (swing-high resistance)');
 // candlestick patterns on the last bars
 const p=cs[n-1],q=cs[n],body=Math.abs(q.c-q.o),rng=q.h-q.l||1e-9;
 if(q.c>q.o&&p.c<p.o&&q.c>=p.o&&q.o<=p.c)add(1,'Bullish engulfing candle');
 if(q.c<q.o&&p.c>p.o&&q.c<=p.o&&q.o>=p.c)add(-1,'Bearish engulfing candle');
 if(body<rng*0.35&&Math.min(q.o,q.c)-q.l>rng*0.6)add(0.5,'Hammer / bullish pin bar');
 if(body<rng*0.35&&q.h-Math.max(q.o,q.c)>rng*0.6)add(-0.5,'Shooting star / bearish pin bar');
 // breakout of the prior 20-bar range
 const prior=cs.slice(n-21,n-1),ph=Math.max(...prior.map(x=>x.h)),pl=Math.min(...prior.map(x=>x.l));
 if(price>ph)add(1,'Breakout above the 20-bar high');else if(price<pl)add(-1,'Breakdown below the 20-bar low');
 // volume, only where the provider supplies it
 const vols=cs.slice(-21).map(x=>x.v);
 if(vols.every(v=>v!=null&&v>0)){const v=vols as number[],avg=v.slice(0,-1).reduce((x,y)=>x+y,0)/20;
  if(v[20]>1.5*avg)add(q.c>=q.o?0.5:-0.5,'Volume spike confirms the last candle')}else why.push('Volume not provided for this instrument');
 const signal:Signal=s>=5?'STRONG BUY':s>=2?'BUY':s<=-5?'STRONG SELL':s<=-2?'SELL':'HOLD';
 const dir=s>=2?1:s<=-2?-1:0;
 let entry:Result['entry']=null,sl:number|null=null,tp:number|null=null,rr:number|null=null;
 if(dir){const z=price-dir*0.5*a,mid=price-dir*0.25*a;entry=[Math.min(z,price),Math.max(z,price)];
  sl=dir>0?Math.max(price-3*a,Math.min(price-1.5*a,(support??price)-0.2*a)):Math.min(price+3*a,Math.max(price+1.5*a,(resistance??price)+0.2*a));
  const risk=Math.abs(mid-sl),lvl=dir>0?resistance:support;
  tp=lvl!=null&&Math.abs(lvl-mid)>=1.2*risk&&Math.abs(lvl-mid)<=4*risk?lvl:mid+dir*2*risk;rr=Math.abs(tp-mid)/risk}
 const age=(Date.now()-cs[n].t)/1000,pct=a/price*100;
 return{id,tf,price,signal,strength:Math.min(100,Math.round(Math.abs(s)/9*100)),score:s,trend:s>=2?'Bullish':s<=-2?'Bearish':'Sideways',entry,sl,tp,rr,support,resistance,
  rsi:R,macdHist:h[n],emas:{9:E9,21:E21,50:E50,200:E200},atr:a,volatility:`ATR ${a.toPrecision(3)} (${pct.toFixed(2)}% of price)`,reasons:why,
  asOf:cs[n].t,ageSec:age,fresh:age<tfSec*2+120};
}
