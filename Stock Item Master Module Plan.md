# Stock Item Master Module Plan

## Scope

This plan covers only the `Stock > Item Master` module for the Next.js frontend integrated with ERPNext/Frappe through the existing `/api/frappe/[...path]` proxy route.

In-scope:

- item list, filter, pagination, and sorting
- item add and edit workflows
- barcode row entry support
- variant-aware fields (`has_variants`, `variant_of`)
- textile custom attributes from the ERP plan document:
  - `collection`
  - `season`
  - `style_code`
  - `fabric_type`
  - `display_category`
  - `shelf_rack_code`
  - `primary_store`

Out-of-scope:

- warehouse transfer, stock ledger, batch, and aging screens
- procurement, sales, POS, returns, dashboards
- manufacturing flows

## Functional Flow

1. User opens `Stock > Item Master`.
2. Screen loads item list with server-backed filters and pagination.
3. User can filter by status, variants, item group, item code/name, and variant-of.
4. User opens item record from list.
5. User edits and saves item fields.
6. User creates a new item from `Add Item`.
7. RTK Query invalidates list and item caches after create/update.

## API Contracts

Module uses current backend API style:

- `GET /api/frappe/method/textile_erp.api.item_master_list`
- `GET /api/frappe/method/textile_erp.api.item_master_lookups`
- `GET /api/frappe/resource/Item/{item_code}`
- `POST /api/frappe/resource/Item`
- `PUT /api/frappe/resource/Item/{item_code}`

Frontend query params supported:

- `page`
- `page_size`
- `search`
- `item_code`
- `item_name`
- `item_group`
- `variant_of`
- `has_variants`
- `disabled`
- `sort_by`

## UI Structure

Routes:

- `/stock/items` list page
- `/stock/items/new` create page
- `/stock/items/[itemCode]` edit page

Main UI regions:

- header toolbar (view mode, search, refresh, add item)
- left filter panel
- right data table panel
- create/edit form sections:
  - core fields
  - textile attributes
  - barcode rows
  - flags and description

## State Management

Redux slice: `store/features/items/itemsUiSlice.ts`

Stores:

- list filters
- pagination settings
- active sort

RTK API slice: `store/api/frappeApi.ts`

Handles:

- list queries
- lookups query
- item query
- create/update mutations
- tag invalidation

## Validation Rules

- `item_code` required
- `item_group` required
- `stock_uom` required
- barcode row requires barcode value
- `has_variants = true` cannot be combined with `variant_of`

## Folder Readability Conventions

Item master UI is organized by file naming convention under `components/stock/`:

- `item-master-toolbar.tsx`
- `item-filters.tsx`
- `item-table.tsx`
- `item-form.tsx`
- `item-master-helpers.ts`

This keeps a single stock domain directory while making item-master ownership explicit by filename.

## Acceptance Checklist

- [ ] List loads items and total count from backend
- [ ] Filters update list correctly
- [ ] Sorting updates server query
- [ ] Pagination works with configured page sizes
- [ ] Create item saves and redirects to item edit page
- [ ] Edit item saves and returns to list
- [ ] Barcode rows add/remove and submit correctly
- [ ] Variant/template validation works
- [ ] UI is responsive and usable on desktop/mobile
