import type {Metadata,Viewport} from 'next';
import {Big_Shoulders_Display,Manrope} from 'next/font/google';
import './globals.css';
const disp=Big_Shoulders_Display({subsets:['latin'],variable:'--font-disp',weight:['600','800']});
const body=Manrope({subsets:['latin'],variable:'--font-body'});
const site=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
export const metadata:Metadata={metadataBase:new URL(site),title:'TMFX – Professional Forex Market Analysis',
 description:'TMFX is a professional forex market analysis terminal: TradingView charts, indicator-based signals for gold, forex, indices and crypto, and AI chart screenshot analysis.',
 keywords:['TMFX','forex analysis','XAUUSD','market signals','TradingView'],alternates:{canonical:'/'},robots:{index:true,follow:true},
 openGraph:{title:'TMFX – Professional Forex Market Analysis',description:'Professional forex market analysis terminal.',type:'website',siteName:'TMFX'}};
export const viewport:Viewport={themeColor:'#050505',width:'device-width',initialScale:1};
export default function Root({children}:{children:React.ReactNode}){return<html lang="en"><body className={`${disp.variable} ${body.variable}`}>{children}</body></html>}
