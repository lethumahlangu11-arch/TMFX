# TMFX – Professional Forex Market Analysis

Next.js 14 + TypeScript. TradingView charts, indicator-based signals from Twelve Data candles, AI screenshot analysis through the Anthropic vision API. All keys stay on the server.

## Run locally
1. Install Node.js 18.17+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in `TWELVE_DATA_API_KEY` and `ANTHROPIC_API_KEY`.
3. `npm run dev` and open http://localhost:3000.

## Deploy (Vercel)
1. Push this folder to a GitHub repository.
2. On vercel.com choose Add New Project, pick the repo, and add the four variables from `.env.example` under Environment Variables. Deploy.
3. Domain: Project Settings > Domains > add your domain and set the DNS records Vercel shows. HTTPS is automatic. Set `NEXT_PUBLIC_SITE_URL` to the final https URL and redeploy.
4. Google: add the site in Search Console, verify it, and submit `/sitemap.xml`.

## Things to know
- Twelve Data's free plan allows about 8 requests a minute, and each refresh requests all 10 instruments. Use a paid plan for the 60-second cycle. Some indices (US30 as DJI, NAS100 as NDX), and crypto, may need a higher plan; failed instruments are listed in the dashboard.
- TradingView symbols are in `lib/symbols.ts`; change the broker prefix if a symbol is blank for you. TradingView's free widget is used; Advanced Charts and its datafeed need a separate TradingView licence.
- Signals are a transparent points system in `lib/analysis.ts`. Data older than two candles (plus 2 minutes) is marked delayed, never live.
- Not financial advice. No signal is guaranteed.
