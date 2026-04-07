# Textile Trading ERP Plan - Detailed Module Documentation

## 1. Document Purpose

This document is the full implementation-oriented functional and technical specification for the Textile Trading ERP application. It expands the high-level plan in [Textile Trading ERP Plan - Final Application.md](/home/vins/frappe-bench/Textile%20Trading%20ERP%20Plan%20-%20Final%20Application.md) into a build-ready reference covering modules, architecture, backend ownership, frontend ownership, Redux store structure, API boundaries, workflows, reporting, security, and rollout.

This documentation is written for:

- product owners defining application scope
- ERPNext/Frappe backend developers
- frontend developers building the web application
- QA engineers validating workflows
- implementation leads planning phases and responsibilities

The target application is a **textile trading ERP**, not a manufacturing ERP.

## 2. Business Context

The business purchases finished textile products from vendors and sells them to retail and wholesale customers. It needs end-to-end control over:

- products and variants
- supplier procurement
- receiving and inventory
- branch/store stock visibility
- retail POS and direct billing
- wholesale sales process
- customer returns and supplier returns
- payments, receivables, and payables
- business operating expenses
- taxes, profit, and control reporting

Manufacturing-related requirements are excluded:

- no BOMs
- no work orders
- no production planning
- no raw material issue
- no factory consumption
- no conversion costing

## 3. Solution Strategy

The application should be built with a strict ownership split.

### 3.1 ERPNext ownership

ERPNext should remain the source of truth for:

- masters
- transactional documents
- accounting postings
- taxes
- stock ledger
- pricing rules
- loyalty base
- payment entries
- standard workflow conversion
- standard reports

### 3.2 `textile_erp` ownership

The `textile_erp` app should provide only:

- textile-specific APIs
- dashboard aggregation endpoints
- custom validations
- defaulting logic
- lightweight orchestration for frontend flows
- custom reports not already available in ERPNext

### 3.3 Frontend ownership

The frontend should provide:

- role-based business UI
- dashboard screens
- POS/cart UX if desk UI is not used
- wholesale and retail workflow screens
- stock visibility screens
- expense and management dashboards
- user-friendly return and collection flows

## 4. Recommended Application Architecture

### 4.1 High-level architecture

The recommended architecture is:

- **ERPNext + Frappe**
  - system of record
  - standard business transactions
  - standard finance and stock engine
- **Custom app: `textile_erp`**
  - custom whitelisted APIs
  - report endpoints
  - validations
  - custom business services
- **Frontend: Next.js**
  - application UI
  - dashboard UI
  - POS UI if required
  - role-based navigation and flows
- **Redux Toolkit**
  - global client state for auth/session context, UI filters, cart state, dashboard state, notifications, and cross-page business state

### 4.2 Request flow

The standard request flow should be:

1. user logs into frontend
2. frontend authenticates against Frappe session or token mechanism
3. frontend loads profile, permissions, branch/store context
4. frontend calls:
   - ERPNext standard APIs for regular CRUD and standard document access
   - `textile_erp` APIs for dashboard, aggregation, custom stock visibility, and custom business UX helpers
5. ERPNext handles transaction posting, stock movement, accounting, and taxes
6. frontend refreshes related slices and dashboards

### 4.3 Data ownership rule

Use this rule consistently:

- if it is a standard business document, ERPNext owns it
- if it is a custom summarized view or frontend helper, `textile_erp` owns it
- if it is temporary UI state, Redux owns it

## 5. Recommended Repository Structure

There is currently no frontend app in this bench. The recommended layout is:

```text
/home/vins/frappe-bench
├── apps/
│   ├── frappe/
│   ├── erpnext/
│   └── textile_erp/
│       ├── textile_erp/
│       │   ├── api/
│       │   ├── services/
│       │   ├── reports/
│       │   ├── hooks.py
│       │   ├── modules.txt
│       │   └── ...


This keeps the frontend independent and makes the backend and frontend deployable as separate concerns.

## 6. Frontend Technical Architecture

### 6.1 Framework recommendation

Recommended frontend stack:

- Next.js with App Router
- TypeScript
- Redux Toolkit
- RTK Query or a service layer wrapping fetch/axios
- React Hook Form for forms if required
- Zod for schema validation where the frontend needs typed request/response safety

### 6.2 Why Redux is needed here

This application has many cross-module states that should not be handled as scattered local state:

- authenticated user context
- branch/store selection
- POS cart
- currently active warehouse
- selected filters for dashboards
- item search caches
- pending notifications and toasts
- UI preferences
- return/refund workflow state
- customer collection follow-up context

Redux Toolkit is appropriate because these states cross route boundaries and need predictable updates.

## 7. Where The Redux Store Should Live

The Redux store should live in the frontend app, not inside ERPNext and not inside the `textile_erp` backend app.

### 7.1 Recommended location

```text
frontend/src/store/
├── index.ts
├── provider.tsx
├── hooks.ts
├── root-reducer.ts
└── middleware.ts
```

### 7.2 Store file responsibilities

- `index.ts`
  - create and export the Redux store
  - register reducers
  - register middleware
- `provider.tsx`
  - wrap the Next.js app with Redux Provider
- `hooks.ts`
  - typed hooks like `useAppDispatch` and `useAppSelector`
- `root-reducer.ts`
  - optional reducer composition
- `middleware.ts`
  - logging, listener middleware, auth/session refresh handling, or custom side effects

### 7.3 Recommended basic store code shape

```ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import appReducer from "@/features/app/appSlice";
import posReducer from "@/features/pos/posSlice";
import catalogReducer from "@/features/catalog/catalogSlice";
import stockReducer from "@/features/stock/stockSlice";
import salesReducer from "@/features/sales/salesSlice";
import purchaseReducer from "@/features/purchase/purchaseSlice";
import returnsReducer from "@/features/returns/returnsSlice";
import expensesReducer from "@/features/expenses/expensesSlice";
import dashboardsReducer from "@/features/dashboards/dashboardsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    pos: posReducer,
    catalog: catalogReducer,
    stock: stockReducer,
    sales: salesReducer,
    purchase: purchaseReducer,
    returns: returnsReducer,
    expenses: expensesReducer,
    dashboards: dashboardsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 8. Where The Redux Slices Should Live

The Redux slices should be grouped by business domain under `src/features`.

### 8.1 Recommended location

```text
frontend/src/features/
├── app/
├── auth/
├── catalog/
├── customers/
├── suppliers/
├── purchase/
├── stock/
├── pos/
├── sales/
├── returns/
├── payments/
├── expenses/
├── dashboards/
└── settings/
```

### 8.2 Recommended slice files by module

Example structure:

```text
frontend/src/features/pos/
├── posSlice.ts
├── posSelectors.ts
├── posThunks.ts
├── posTypes.ts
├── components/
└── services/
```

This structure keeps domain state and domain UI together.

### 8.3 Which slices should exist

Recommended slices:

- `authSlice`
  - session
  - user
  - roles
  - permissions
- `appSlice`
  - selected company
  - selected branch
  - selected store
  - selected warehouse
  - app-level UI settings
- `catalogSlice`
  - active item search
  - filters for category, collection, brand
  - cached item summaries
- `stockSlice`
  - active stock filters
  - warehouse/section views
  - low stock and aging view state
- `purchaseSlice`
  - current PO filters
  - supplier filters
  - procurement dashboard state
- `salesSlice`
  - sales dashboard filters
  - retail vs wholesale mode state
  - invoice search context
- `posSlice`
  - cart
  - scanned item state
  - selected customer
  - payment lines
  - tendered amount
  - draft hold/resume logic
- `returnsSlice`
  - active return lookup
  - original invoice context
  - refund mode state
- `paymentsSlice`
  - collection filter state
  - outstanding selection
  - collection dashboard state
- `expensesSlice`
  - expense filters
  - branch/store/category grouping state
- `dashboardsSlice`
  - KPI filters
  - cached cards and chart state

### 8.4 What should not go into Redux

Do not store these in Redux unless truly cross-page:

- simple form input state
- table sorting inside a single screen
- modal open/close local state
- ephemeral hover state
- uncontrolled field-level state

Use local component state for those.

## 9. Recommended Frontend App Structure

### 9.1 App Router structure

Recommended route structure:

```text
frontend/src/app/
├── login/
├── dashboard/
├── catalog/
│   ├── items/
│   ├── variants/
│   └── pricing/
├── customers/
├── suppliers/
├── purchase/
│   ├── rfq/
│   ├── quotations/
│   ├── orders/
│   ├── receipts/
│   └── invoices/
├── stock/
│   ├── overview/
│   ├── transfers/
│   ├── batches/
│   ├── aging/
│   └── locations/
├── sales/
│   ├── quotations/
│   ├── orders/
│   ├── deliveries/
│   ├── invoices/
│   └── wholesale/
├── pos/
├── returns/
│   ├── sales/
│   └── purchase/
├── collections/
├── expenses/
├── reports/
└── settings/
```

### 9.2 Shared layer

Recommended shared locations:

```text
frontend/src/components/
frontend/src/lib/
frontend/src/services/
frontend/src/types/
frontend/src/utils/
```

Use these for:

- shared UI widgets
- API client
- date/number formatting
- validation
- domain types
- shared hooks

## 10. Backend Structure Inside `textile_erp`

The custom backend app should remain modular and grouped by domain.

### 10.1 Recommended backend layout

```text
apps/textile_erp/textile_erp/
├── api/
│   ├── __init__.py
│   ├── auth.py
│   ├── catalog.py
│   ├── stock.py
│   ├── sales.py
│   ├── purchase.py
│   ├── returns.py
│   ├── expenses.py
│   ├── dashboards.py
│   └── collections.py
├── services/
│   ├── catalog_service.py
│   ├── stock_service.py
│   ├── sales_service.py
│   ├── purchase_service.py
│   ├── returns_service.py
│   ├── expense_service.py
│   ├── dashboard_service.py
│   └── collection_service.py
├── reports/
├── overrides/
├── validations/
└── hooks.py
```

### 10.2 Layering rule

- API layer: request/response only
- service layer: business logic and aggregation
- report layer: query/report outputs
- validation layer: reusable validation rules

This prevents whitelisted methods from becoming overly large.

## 11. Module Documentation Standards

Each business module in the application should be documented with:

- business purpose
- actors
- ERPNext ownership
- `textile_erp` custom ownership
- frontend pages
- Redux state
- major APIs
- key workflows
- validations
- reports and dashboards
- test scenarios

The following sections apply that pattern.

## 12. Module: Authentication And Session

### 12.1 Purpose

Provide secure user access, branch/store-aware session context, role-based navigation, and access-controlled business actions.

### 12.2 Actors

- Administrator
- Sales User
- POS Cashier
- Inventory Manager
- Purchase User
- Accountant
- Branch Manager

### 12.3 ERPNext ownership

ERPNext manages:

- users
- roles
- permissions
- session or token authentication
- password policy
- 2FA if enabled

### 12.4 Frontend responsibilities

Frontend manages:

- login page
- session check
- route guards
- role-based menu rendering
- branch/store context loading

### 12.5 Redux state

`authSlice` should contain:

- `user`
- `roles`
- `permissions`
- `isAuthenticated`
- `sessionStatus`
- `lastAuthCheck`

`appSlice` should contain:

- `selectedCompany`
- `selectedBranch`
- `selectedStore`
- `selectedWarehouse`

### 12.6 APIs

- standard Frappe login/session endpoints
- current user profile endpoint
- optional `textile_erp` profile bootstrap endpoint returning:
  - user
  - roles
  - branch
  - allowed stores
  - allowed warehouses

### 12.7 Validation

- unauthorized roles cannot access hidden routes
- branch/store-sensitive APIs must reject unauthorized access server-side

### 12.8 Test scenarios

- cashier sees only POS and limited views
- purchase user cannot cancel submitted sales invoices
- accountant can view finance and expense modules

## 13. Module: Product Catalog And Variants

### 13.1 Purpose

Maintain all finished textile products in a structured, searchable, sellable form.

### 13.2 Business requirements

- support templates and variants
- support barcode scanning
- support retail and wholesale pricing
- support category and collection-based search
- support images and quick identification

### 13.3 ERPNext ownership

Use standard:

- Item
- Item Variant
- Item Barcode
- Item Group
- Brand
- Item Price

### 13.4 Configuration requirements

Create standard attributes such as:

- Size
- Color
- Pattern
- Fit
- Length
- Sleeve
- Fabric Type
- Collection
- Season

### 13.5 Custom fields

Recommended item custom fields:

- `collection`
- `season`
- `style_code`
- `fabric_type`
- `display_category`
- `shelf_rack_code`
- `primary_store`

### 13.6 Frontend pages

- item list page
- variant list page
- item detail page
- pricing page
- barcode search page

### 13.7 Redux state

`catalogSlice` should store:

- active category filters
- active collection filters
- search term
- selected item summary
- cached lookup results

### 13.8 Custom APIs

`textile_erp.api.catalog` should expose:

- item search summary
- variant detail summary
- barcode lookup summary
- pricing summary by customer type

### 13.9 UI notes

The catalog UI should emphasize:

- category-first navigation
- variant-aware search
- barcode and style-code lookup
- image and size/color quick recognition

### 13.10 Validation

- no sellable item should go live without required textile attributes
- barcode uniqueness must be enforced
- price completeness by selling mode should be validated where required

### 13.11 Test scenarios

- create item template and variants
- scan barcode and retrieve correct variant
- search by collection and color
- fetch correct retail and wholesale rate

## 14. Module: Customer Management

### 14.1 Purpose

Maintain retail and wholesale customer profiles, segment them correctly, and support pricing, loyalty, collections, and returns.

### 14.2 ERPNext ownership

- Customer
- Address
- Contact
- Customer Group
- Loyalty Program link

### 14.3 Configuration

Customer groups:

- Retail Walk-in
- Retail Registered
- Wholesale Regular
- Wholesale Premium
- Distributor

### 14.4 Custom fields

- `customer_type_business`
- `preferred_branch`
- `credit_class`
- `gst_or_tax_id_business`
- `default_sales_channel`

### 14.5 Frontend pages

- customer list
- customer profile
- customer loyalty view
- customer outstanding view

### 14.6 Redux state

`customers` data can mostly be query-driven, but keep in Redux:

- selected customer in POS
- active customer in sales flow
- recent customer lookup cache

### 14.7 Test scenarios

- assign retail customer to loyalty program
- assign wholesale customer to wholesale price list
- fetch customer outstanding and recent purchases

## 15. Module: Supplier Management

### 15.1 Purpose

Maintain supplier records, sourcing relationships, procurement history, and purchase-side defaults.

### 15.2 ERPNext ownership

- Supplier
- Address
- Contact
- Supplier Group

### 15.3 Configuration

Supplier groups:

- Garment Supplier
- Fabric Supplier
- Accessory Supplier
- Import Supplier
- Service Vendor

### 15.4 Custom fields

- `supplier_category`
- `lead_time_days`
- `preferred_branch_supply`
- `source_region`

### 15.5 Frontend pages

- supplier list
- supplier profile
- supplier purchase history
- supplier quotation comparison view

### 15.6 Test scenarios

- create service vendor for freight and logistics
- compare supplier quotations
- show supplier purchase performance

## 16. Module: Procurement

### 16.1 Purpose

Manage the complete buying lifecycle from vendor request to stock receipt and invoice.

### 16.2 ERPNext ownership

- Request for Quotation
- Supplier Quotation
- Purchase Order
- Purchase Receipt
- Purchase Invoice

### 16.3 Frontend pages

- RFQ list/form
- supplier quotation comparison page
- purchase order page
- purchase receipt page
- purchase invoice page

### 16.4 Redux state

`purchaseSlice` should store:

- procurement dashboard filters
- supplier filter state
- active document listing filters
- page-level draft UI state if needed

### 16.5 Custom APIs

Use standard ERPNext APIs for CRUD.

Add `textile_erp` APIs only for:

- procurement dashboard totals
- supplier performance summaries
- replenishment recommendation summaries if needed

### 16.6 Workflow

1. create RFQ or directly create supplier quotation/PO
2. compare vendor quotations
3. issue PO
4. receive stock in Purchase Receipt
5. generate or record Purchase Invoice
6. settle vendor through Payment Entry

### 16.7 Key validations

- warehouse required for stock receipt
- item and variant must be active
- received quantities cannot exceed business rules unless explicitly allowed
- service vendors should not be forced through stock receipt

### 16.8 Test scenarios

- RFQ -> quotation -> PO -> PR -> PI success path
- item receipt updates stock correctly
- supplier invoice links to PO/PR

## 17. Module: Inventory And Warehousing

### 17.1 Purpose

Provide visibility and control over stock across branches, stores, and locations.

### 17.2 ERPNext ownership

- Warehouse
- Stock Entry
- Purchase Receipt stock update
- Delivery Note stock movement
- Batch
- Stock Ledger

### 17.3 Recommended warehouse model

Example hierarchy:

- Company Main Warehouse
- Branch Warehouse
- Retail Store Warehouse
- Rack/Section child warehouses or structured section codes

### 17.4 When to use batches

Batch usage should be optional, not forced on all textiles.

Use batches for:

- imported lots
- grouped purchase lots
- seasonal inventory lots
- expiry-sensitive accessories if any

Do not force batches for:

- regular fast-moving garments where variant-only tracking is enough

### 17.5 Frontend pages

- stock overview
- stock by location
- transfer page
- batch overview
- stock aging page

### 17.6 Redux state

`stockSlice` should hold:

- selected branch/store/warehouse
- active stock filters
- section visibility mode
- low stock and aging dashboard filters

### 17.7 Custom APIs

`textile_erp.api.stock` should expose:

- stock summary by item/variant/warehouse
- section-wise stock view
- stock aging summary
- low stock summary
- dead stock summary

### 17.8 Key validations

- transfers should respect warehouse access rules
- stock issue cannot exceed available stock unless policy allows
- batch-enabled items must select allowed batches

### 17.9 Test scenarios

- receive stock and verify visibility by warehouse
- transfer stock between store and godown
- fetch stock by variant and section
- confirm batch logic works only for batched items

## 18. Module: Pricing And Promotions

### 18.1 Purpose

Provide flexible selling rates for retail and wholesale while keeping pricing centrally controlled.

### 18.2 ERPNext ownership

- Price List
- Item Price
- Pricing Rule
- discounts and margins

### 18.3 Configuration rules

Maintain at least:

- Retail Price List
- Wholesale Price List
- optional branch/store-specific lists if truly required

### 18.4 Frontend pages

- pricing matrix page
- promotion rules page
- item pricing detail page

### 18.5 Redux state

`catalogSlice` or `salesSlice` can store:

- active customer type
- active price list context
- promotion filter state

### 18.6 Test scenarios

- wholesale customer gets wholesale rate
- promotion applies for selected item group
- POS uses correct price based on active rules

## 19. Module: Retail POS

### 19.1 Purpose

Support fast counter billing with barcode-first UX.

### 19.2 ERPNext ownership

- Sales Invoice
- POS Profile
- pricing application
- loyalty integration base
- payment processing basis

### 19.3 Frontend responsibilities

If using custom POS frontend, it must handle:

- barcode scanning
- cart display
- quantity updates
- customer attachment
- loyalty redemption
- payment split
- invoice completion

### 19.4 Redux state

`posSlice` is one of the most important slices and should include:

- `cartItems`
- `selectedCustomer`
- `activeWarehouse`
- `activePosProfile`
- `payments`
- `totals`
- `appliedDiscount`
- `loyaltyState`
- `scanState`
- `heldCartId`
- `notes`

### 19.5 Suggested POS cart item shape

```ts
type PosCartItem = {
  itemCode: string;
  itemName: string;
  variantLabel?: string;
  barcode?: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse?: string;
  batchNo?: string;
  image?: string;
};
```

### 19.6 Custom APIs

Recommended custom endpoints:

- scan barcode and return compact cart payload
- item search for POS
- customer summary for POS
- payment preview

Use ERPNext standard Sales Invoice create/submit for final posting whenever possible.

### 19.7 Key validations

- cashier can only bill from allowed warehouse/store
- stock availability check before final submit
- payment total must satisfy invoice policy
- loyalty redemption must not exceed allowed amount

### 19.8 Test scenarios

- scan barcode adds correct variant
- repeated scan increments quantity
- split payment works
- loyalty redemption applies correctly
- invoice submits and stock reduces

## 20. Module: Wholesale Sales

### 20.1 Purpose

Handle order-based B2B or large-volume customer selling.

### 20.2 ERPNext ownership

- Quotation
- Sales Order
- Delivery Note
- Sales Invoice
- Payment Entry

### 20.3 Frontend pages

- sales quotation page
- sales order page
- delivery page
- invoice page
- wholesale dashboard

### 20.4 Redux state

`salesSlice` should store:

- active sales mode
- listing filters
- selected customer context
- branch/store filters
- dashboard filters

### 20.5 Test scenarios

- quotation converts to order
- order converts to delivery
- delivery converts to invoice
- outstanding collections visible after invoice

## 21. Module: Loyalty

### 21.1 Purpose

Allow registered customers to earn and redeem points in retail selling.

### 21.2 ERPNext ownership

- Loyalty Program
- Loyalty Point Entry
- loyalty calculations and redemption helpers

### 21.3 Frontend behavior

- fetch customer loyalty balance
- show points before billing
- apply redemption if allowed
- show earned points after invoice

### 21.4 Redux state

`posSlice` can carry active loyalty state:

- available points
- applied redemption
- redemption amount
- loyalty program name

### 21.5 Test scenarios

- registered customer sees balance
- redemption applies correct amount
- post-invoice earned points update

## 22. Module: Returns And Refunds

### 22.1 Purpose

Provide efficient and controlled customer return and supplier return operations.

### 22.2 ERPNext ownership

- Sales return pattern
- Purchase return pattern
- linked credit note/debit note behavior

### 22.3 Frontend pages

- sales return search and intake
- purchase return page
- refund page

### 22.4 Redux state

`returnsSlice` should include:

- original document lookup
- selected return items
- refund mode
- return reason
- branch/store context

### 22.5 Custom APIs

Recommended support endpoints:

- return lookup summary by invoice/order
- original item and payment context for refund UI

### 22.6 Test scenarios

- customer return against sales invoice
- refund to original or selected payment mode
- supplier return reduces stock correctly

## 23. Module: Payments And Collections

### 23.1 Purpose

Manage customer collections, supplier payments, due tracking, partial settlement, and advances.

### 23.2 ERPNext ownership

- Payment Entry
- advances
- payment schedule
- receivable and payable reporting

### 23.3 Frontend pages

- collections dashboard
- customer dues page
- supplier payment page
- payment allocation page

### 23.4 Redux state

`paymentsSlice` should store:

- active collections filters
- selected customer ledger context
- overdue-only toggle
- date-range filters

### 23.5 Installment / EMI extension

If installment selling is enabled, add:

- schedule preview
- due reminders
- due collection screen

This should still eventually post through ERPNext finance documents.

### 23.6 Test scenarios

- collect full payment
- collect partial payment
- settle outstanding invoices
- show overdue customers

## 24. Module: Expenses And Operating Costs

### 24.1 Purpose

Track all non-manufacturing business operating expenses and separate stock-capitalized costs from period expenses.

### 24.2 Business categories

Recommended categories:

- Rent
- Utilities
- Freight Inward
- Local Transport
- Courier
- Packaging
- Store Maintenance
- Marketing
- Gateway Charges
- Marketplace Commission
- Petty Cash
- Admin Expense
- Repairs
- Other Operating Expense

### 24.3 ERPNext ownership

- expense accounts
- Purchase Invoice for billed expenses
- Payment Entry for settlement
- Journal Entry for adjustments
- Landed Cost Voucher for inventory-capitalized costs

### 24.4 Frontend pages

- expense dashboard
- expense entry summary
- branch/store expense analytics
- landed cost summary view

### 24.5 Redux state

`expensesSlice` should contain:

- branch/store filter
- expense category filter
- period filter
- comparison mode
- grouped view state

### 24.6 Custom APIs

`textile_erp.api.expenses` should expose:

- expense summary by branch/store/category
- monthly opex trend
- landed cost vs period expense split

### 24.7 Validation

- inventory-related extra cost must be classified correctly
- non-stock opex must not be posted as inventory capitalization

### 24.8 Test scenarios

- create vendor-billed utility expense
- create freight and capitalize through landed cost
- show opex by branch

## 25. Module: Accounting And Tax

### 25.1 Purpose

Ensure all operational transactions flow into finance correctly.

### 25.2 ERPNext ownership

- tax templates
- ledgers
- receivables
- payables
- P&L
- balance sheet
- cash and bank

### 25.3 Configuration priorities

- default expense account
- stock-in-hand account
- write-off account
- landed-cost accounts
- branch/store cost centers if needed
- sales and purchase tax templates

### 25.4 Frontend pages

Mostly dashboard-focused:

- finance KPI dashboard
- receivable summary
- payable summary
- margin summary

### 25.5 Test scenarios

- sales invoice posts correct taxes
- purchase invoice posts vendor payable
- payment entry clears outstanding
- landed cost affects inventory value only where intended

## 26. Module: Dashboards And Reports

### 26.1 Purpose

Give operational and management visibility without forcing users to manually stitch reports together.

### 26.2 Dashboard families

Build dashboards for:

- executive overview
- procurement overview
- stock overview
- retail sales overview
- wholesale overview
- returns overview
- collections overview
- expenses overview
- profitability overview

### 26.3 Key KPIs

Recommended KPIs:

- sales today
- sales month-to-date
- retail vs wholesale share
- top-selling items
- slow-moving items
- low stock items
- purchase this month
- overdue receivables
- overdue payables
- monthly opex
- gross margin

### 26.4 Redux state

`dashboardsSlice` should include:

- selected KPI date range
- active branch/store filter
- active channel filter
- comparison mode
- cached dashboard cards

### 26.5 Custom APIs

`textile_erp.api.dashboards` should provide:

- overview cards
- sales chart data
- stock chart data
- expense chart data
- profitability summaries

### 26.6 Test scenarios

- KPI totals match ERPNext source data
- branch filters work consistently
- date ranges update charts correctly

## 27. Module: Roles, Permissions, And Audit

### 27.1 Suggested roles

- System Manager
- Inventory Manager
- Purchase User
- Purchase Manager
- Sales User
- Sales Manager
- POS Cashier
- Accountant
- Branch Manager
- Returns User

### 27.2 Permission strategy

Use ERPNext permissions as the base and enforce:

- cashier limited to POS, retail invoice view, and allowed store
- purchase user limited to procurement docs
- branch manager limited to own branch/store analytics where applicable
- accountant has finance and expense access

### 27.3 Audit requirements

- submitted document cancellation should be restricted
- high discount overrides should be approved
- stock adjustments should be traceable
- high-value expenses should follow approval rules

### 27.4 Test scenarios

- unauthorized user cannot open protected module
- branch-scoped user cannot view another branch’s summaries
- discount override triggers correct approval path

## 28. API Documentation Strategy

### 28.1 API categories

The backend API surface should be grouped as:

- standard ERPNext CRUD APIs
- standard ERPNext document conversion APIs
- `textile_erp` dashboard APIs
- `textile_erp` stock visibility APIs
- `textile_erp` POS helper APIs
- `textile_erp` expense and collection summary APIs

### 28.2 API response design principles

Custom APIs should:

- be summary-oriented
- be frontend-friendly
- avoid exposing raw ERP internals where not needed
- remain thin wrappers over ERP data sources

### 28.3 Example summary endpoint families

- `/api/method/textile_erp.api.catalog.search_items`
- `/api/method/textile_erp.api.stock.get_stock_overview`
- `/api/method/textile_erp.api.sales.get_sales_dashboard`
- `/api/method/textile_erp.api.expenses.get_expense_summary`
- `/api/method/textile_erp.api.dashboards.get_executive_dashboard`

## 29. UI Navigation Model

Recommended left navigation:

- Dashboard
- Catalog
- Customers
- Suppliers
- Purchase
- Stock
- Sales
- POS
- Returns
- Collections
- Expenses
- Reports
- Settings

Navigation visibility should be role-driven.

## 30. Non-Functional Requirements

### 30.1 Performance

- barcode lookup must feel instant
- dashboard cards should load quickly with aggregated APIs
- stock pages should use server-side filtering/pagination

### 30.2 Reliability

- transaction posting should rely on ERPNext standard documents
- custom APIs must not bypass accounting or stock posting rules

### 30.3 Security

- session and permission checks must be server-side enforced
- branch/store filters in frontend are convenience filters, not security controls by themselves

### 30.4 Maintainability

- keep `textile_erp` thin
- avoid duplicating standard ERP logic
- keep frontend domain folders aligned with backend module names

## 31. QA And Acceptance Matrix

The application should not be accepted unless the following work end to end:

- product creation with variants and barcodes
- vendor buying workflow
- stock receiving and transfer
- retail POS billing
- wholesale sales workflow
- customer return and supplier return
- customer collection and supplier payment
- expense booking and reporting
- dashboard accuracy
- branch/store-scoped usage

## 32. Delivery Phases

### Phase 1: Foundation

- company setup
- master data model
- catalog structure
- customer/supplier setup
- stock structure

### Phase 2: Core Transactions

- procurement
- stock flows
- wholesale sales
- retail billing

### Phase 3: Management Controls

- expenses
- dashboards
- reports
- approvals
- permissions

### Phase 4: Advanced User Experience

- custom POS frontend
- advanced stock dashboards
- installment flow if needed
- optimized summary APIs

## 33. Recommended Build Ownership

### Backend team

- ERPNext configuration
- `textile_erp` APIs and services
- validations
- reports
- permissions

### Frontend team

- Next.js application
- Redux store and slices
- dashboard screens
- POS/cart UX
- stock and sales UI

### QA team

- workflow validation
- role validation
- dashboard data correctness
- finance and stock reconciliation checks

## 34. Final Implementation Principles

The application should be built according to these principles:

- ERPNext is the transaction engine
- `textile_erp` is a thin textile-specific extension
- Redux stores cross-page business state, not every field
- frontend should be modular by business domain
- standard ERPNext APIs should be used whenever they already solve the problem
- custom APIs should exist only where the frontend needs summarized or textile-specific behavior

## 35. Final Assumptions

- there is no existing frontend app in this bench today
- the frontend will be built as a separate Next.js application
- Redux Toolkit will be the global client-state solution
- App Router structure is preferred
- batch tracking is selective, not universal
- installment support is optional and should be enabled only if the business confirms that requirement
- no manufacturing features should be designed into this application

## 36. Final Build Checklist

Before implementation starts, confirm that the team will build:

- ERPNext configuration layer
- `textile_erp` backend extension layer
- Next.js frontend
- Redux store and domain slices
- dashboards and reporting
- test cases for every business workflow

If all of the above are followed, this document is sufficient as the module-level reference for building the Textile Trading ERP application end to end.
