Build a paid membership feature for a web app.

Free users:
- Can download raw outputs (JSON/CSV)

Paid users:
- Can download professionally formatted files (PDF, Excel)

Requirements:
- Stripe integration for payments
- Membership stored on user (free/paid)
- API endpoint: /generate-download
- Conditional logic based on membership
- PDF/Excel generation with clean formatting
- Secure access (no direct file URL leaks)

Also:
- Modular code
- Reusable formatting functions
- Scalable for multiple report types

Output full implementation (backend + key frontend hooks).