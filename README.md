# Textile ERP Frontend

Separate Next.js frontend for ERPNext using React, Ant Design, and Redux Toolkit.

## Requirements

- Node.js 20+
- ERPNext / Frappe bench running locally or remotely

## Environment

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_APP_NAME=Textile ERP
ERPNEXT_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_ERPNEXT_LOGIN_URL=http://127.0.0.1:8000/login
```

`ERPNEXT_BASE_URL` is used by the Next.js proxy route to forward requests to ERPNext while preserving the existing ERPNext session.

## Development

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current module

The first implemented module is `Stock > Item Master`:

- `/stock/items`
- `/stock/items/new`
- `/stock/items/[itemCode]`

The frontend uses:

- custom proxy route: `/api/frappe/*`
- helper ERP endpoints in `textile_erp.api`
- standard ERPNext resource APIs for `Item` create/update/read
