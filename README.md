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
