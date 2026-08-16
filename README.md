ROXTAM GRAPHIX — Web App (connected to your Google Sheet)
A professional web app for the existing Roxtam Graphix Google Sheets system. The Google Sheet remains the single source of truth — the app only reads and writes it. Use it from the browser, from your phone, and from inside Reddit (Devvit app).

        Browser / Phone / Reddit (Devvit)
                      │
                      ▼
            Apps Script API (Code.gs)     ← paste into the spreadsheet once
                      │
                      ▼
              YOUR GOOGLE SHEET
        (Orders, Attendance, Worker Payments, Settings, …)
                      │
                      ▼
        Existing formulas, reports & calculations
One entry → everything updates. Create an order in the app and it appears in the sheet; the sheet's formulas (Total, Balance, Payment Status, Worker Share, monthly Worker Payments) all update; dashboard/reports/invoices reflect it.

Folder layout
webapp/
├── backend/Code.gs        Apps Script API — paste into Extensions → Apps Script
├── frontend/              The web app (plain HTML/CSS/JS, no build step)
│   ├── index.html
│   ├── styles.css
│   ├── config.js          ← your API URL can go here (or use the in-app Connect screen)
│   └── app.js
├── devvit/                Reddit app wrapper (embeds the same frontend)
│   ├── devvit.yaml
│   ├── src/main.tsx
│   ├── scripts/copy_webview.sh
│   └── webview/           (copy of frontend — created by the script)
└── dev/mock-server.js     OPTIONAL — fake API to try the UI without the sheet
STEP 1 — Connect the API to your Google Sheet (one time)
Open your Roxtam Graphix spreadsheet (the one built from Roxtam_Graphix_Management.xlsx) → Extensions → Apps Script.
Delete any code there and paste the entire content of backend/Code.gs. Save.
Deploy → New deployment → Web app
Execute as: Me
Who has access: Anyone
Copy the Web app URL (ends with /exec). That is your API URL.
Optional security (recommended): Apps Script → ⚙ Project Settings → Script Properties → add ROXTAM_API_KEY = a long secret you invent. Then type the same secret in the app's Connect screen. Without it, anyone with the URL can use the API — so keep the URL private.

The backend never deletes sheets or formulas: it writes only the input columns, archives deleted orders to a helper sheet called Archive, and creates helper sheets only when needed.

Sheet mapping (documented per the original structure)
The API uses these sheet names and column positions (1-based, headers in row 3). If your sheet differs, edit the CONFIG block at the top of Code.gs.

Sheet	Columns used
Orders	A ID · B Date · C Customer · D Phone · E Email · F Service · G Description · H Qty · I Unit Price · J Discount · K Total · L Paid · M Balance · N Pay Status · O Order Status · P Direct Expense · Q Commission · R Eligible Profit · S Worker Share · T Worker Share Rate · U Notes
Attendance	A Date · B Reported? ("Yes") · C Notes
Worker Payments	A Name · B Month · C Days · D Transport · E Share · F Total Due · G Paid · H Balance · I Status · J Due Date
Expenses	A ID · B Date · C Category · D Description · E Amount · F Method · G Notes
Commissions	A ID · B Date · C Order ID · D Referrer · E Phone · F Type · G Rate · H Total · I Amount · J Paid · K Notes
Settings	B5–B10 business info · B16 present rate · B17 absent rate · B19 transport fee · services A23+ · statuses D23+ · payment methods H23+ · worker share types F60–F62 (rates G60–G62)
STEP 2 (optional) — Try the UI with the MOCK server
No Google connection needed; data is fake and lost on restart.

cd webapp/dev
node mock-server.js
# open http://localhost:8787
# in the Connect screen use: http://localhost:8787/api
STEP 3 — Put the web app online (browser + phone)
Host the frontend/ folder anywhere static. Easiest free option — GitHub Pages:

Create a GitHub account, then a new public repository (e.g. roxtam).
Upload the 4 files from frontend/ (GitHub web: Add file → Upload files).
Repo → Settings → Pages → Source: Deploy from a branch → branch main → folder / (root) → Save.
Your app is live at https://<your-username>.github.io/<repo>/.
Open it → paste your API URL in the Connect screen → done. Works on your phone too — bookmark it or "Add to Home Screen".
(Netlify drag-and-drop works the same way if you prefer.)

STEP 4 — Use it inside REDDIT (Devvit app)
The same app becomes an interactive post in a subreddit you moderate. In the Reddit phone app you open that post and run your whole business from it.

4.1 Requirements
A Reddit account with Developer Mode on (Reddit Settings → Advanced).
A subreddit you moderate (private is fine — only you see it).
Node.js 18+ installed on your computer.
4.2 Build & upload
cd webapp/devvit
npm install                    # installs @devvit/public-api + devvit CLI
sh scripts/copy_webview.sh     # copies ../frontend into webview/
npx devvit login               # sign in to Reddit (browser opens)
npx devvit upload              # bundles the webview and uploads the app
npx devvit install <your-subreddit>
4.3 Open it
In Reddit (app or website), go to your subreddit.
Create a post → choose post type "Roxtam Graphix App".
Open the post → the full business app loads inside Reddit.
First time: tap the connection status in the sidebar → paste your API URL.
Pin the post so it's always on top. Every time you open Reddit → open the post → manage orders, attendance, worker payments — no Google Sheets needed.
The webview runs the exact same files as the website (Step 3), so any fix you make applies to both. After changing frontend/, re-run sh scripts/copy_webview.sh && npx devvit upload and re-open the post.

4.4 If <webview> is not supported by your installed Devvit version
Newer Devvit uses the <webview> block element (as in src/main.tsx). If your version expects the older useWebView hook, replace src/main.tsx with:

import { Devvit, useWebView } from '@devvit/public-api';

Devvit.addCustomPostType({
  name: 'Roxtam Graphix App',
  height: 'tall',
  render: () => {
    const { mount } = useWebView({ url: 'index.html' });
    return (
      <vstack height="100%" width="100%" alignment="center middle" gap="small" padding="medium">
        <text size="large" weight="bold">Roxtam Graphix</text>
        <text size="small" color="secondary">Open your business system</text>
        <button appearance="primary" onPress={mount}>Open Roxtam Graphix</button>
      </vstack>
    );
  },
});
export default Devvit;
If the Devvit-hosted webview ever blocks external API calls on your account, fall back to the browser version (Step 3) on the phone — the data and business rules stay identical.

Worker rules built into the app (never violated)
Rule	Behaviour
One worker	Julieth Johnson — pre-filled everywhere, never typed
Share base	% of the Order Total, NOT profit
Rates	2% (you were present) / 4% (absent) / None (you did the work) — chosen per order, required
Monthly share	Only Completed orders count
Transport	Days Reported × configured fee (1,600 TZS default), from Attendance ticks
Total Due	Worker Share + Transport
Due date	1st of the following month (auto)
Costs	Worker share & transport are costs in profit calculations
Currency	TZS everywhere
Rates and transport fee are edited in one place: Settings (stored in the sheet's Settings cells B16/B17/B19). New orders use the new rates; existing orders keep their stored choice and their share is computed from the live rate lookup — historical months are not silently recalculated.

Acceptance tests
Run these after connecting the real sheet (expected values in TZS):

Create order — Test Customer, Qty 2, Unit Price 50,000, Discount 0, Paid 50,000, Rate 2%, Status Completed → Total 100,000 · Balance 50,000 · Worker Share 2,000 · Payment Status "Partial". Row appears in the sheet.
Edit order — change Paid to 100,000 → Balance 0 · Status "Paid" · Worker Share still 2,000. Same row updated, no duplicate.
Worker payment — that month's Worker Payments row now includes 2,000 share; with 10 attendance days: Transport 16,000 → Total Due 18,000.
Pending order — a Pending order shows its share on the order, but the monthly share does not include it until status = Completed.
Rate change — Settings: Present 2% → 3%. A new order shows 3%. Old orders keep their stored choice/label.
Attendance — mark 5 days → Transport = 5 × fee.
Invoice — pick an Order ID → all fields auto-fill → Print.
Customer — 2 orders for one customer → one row: aggregated orders, sales, paid, balance.
Troubleshooting
Problem	Fix
Connect screen says connection failed	Check the URL ends with /exec; deployment access is "Anyone"; no space copied at the end
Invalid key error	You set ROXTAM_API_KEY in Script Properties — enter the same value in the app
Orders appear in sheet but not in app	The sheet's column layout must match the CONFIG table (headers in row 3)
Reddit post shows blank webview	Re-run sh scripts/copy_webview.sh && npx devvit upload; reopen the post (pull to refresh)
Data safety	Deleted orders go to the Archive helper sheet; nothing else is removed
