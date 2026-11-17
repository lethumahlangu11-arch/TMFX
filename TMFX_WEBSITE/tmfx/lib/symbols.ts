// tv = TradingView symbol (chart). td = Twelve Data symbol (analysis candles).
export const SYMBOLS=[
 {id:'XAUUSD',name:'Gold / US Dollar',tv:'OANDA:XAUUSD',td:'XAU/USD'},
 {id:'EURUSD',name:'Euro / US Dollar',tv:'FX:EURUSD',td:'EUR/USD'},
 {id:'GBPUSD',name:'Pound / US Dollar',tv:'FX:GBPUSD',td:'GBP/USD'},
 {id:'USDJPY',name:'US Dollar / Yen',tv:'FX:USDJPY',td:'USD/JPY'},
 {id:'AUDUSD',name:'Aussie / US Dollar',tv:'FX:AUDUSD',td:'AUD/USD'},
 {id:'US30',name:'Dow Jones 30',tv:'OANDA:US30USD',td:'DJI'},
 {id:'NAS100',name:'Nasdaq 100',tv:'OANDA:NAS100USD',td:'NDX'},
 {id:'BTCUSD',name:'Bitcoin / US Dollar',tv:'BITSTAMP:BTCUSD',td:'BTC/USD'},
 {id:'AUDCAD',name:'Aussie / Canadian Dollar',tv:'FX:AUDCAD',td:'AUD/CAD'},
 {id:'AUDSEK',name:'Aussie / Swedish Krona',tv:'FX_IDC:AUDSEK',td:'AUD/SEK'},
];
// tvi = TradingView interval, td = Twelve Data interval, s = seconds per candle
export const TFS:Record<string,{tvi:string;td:string;s:number}>={
 M1:{tvi:'1',td:'1min',s:60},M5:{tvi:'5',td:'5min',s:300},M15:{tvi:'15',td:'15min',s:900},M30:{tvi:'30',td:'30min',s:1800},
 H1:{tvi:'60',td:'1h',s:3600},H4:{tvi:'240',td:'4h',s:14400},D1:{tvi:'D',td:'1day',s:86400},W1:{tvi:'W',td:'1week',s:604800},
};
