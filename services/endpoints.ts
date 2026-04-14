const RESOURCE_BASE = "/resource";

const resourcePath = (doctype: string) => `${RESOURCE_BASE}/${encodeURIComponent(doctype)}`;

const documentPath = (doctype: string, name: string) =>
  `${resourcePath(doctype)}/${encodeURIComponent(name)}`;

export const masterDataEndpoints = {
  item: {
    list: resourcePath("Item"),
    detail: (name: string) => documentPath("Item", name),
    meta: documentPath("DocType", "Item")
  },
  itemGroup: {
    list: resourcePath("Item Group"),
    detail: (name: string) => documentPath("Item Group", name)
  },
  warehouse: {
    list: resourcePath("Warehouse"),
    detail: (name: string) => documentPath("Warehouse", name)
  },
  supplier: {
    list: resourcePath("Supplier"),
    detail: (name: string) => documentPath("Supplier", name)
  },
  supplierGroup: {
    list: resourcePath("Supplier Group")
  },
  customer: {
    list: resourcePath("Customer"),
    detail: (name: string) => documentPath("Customer", name)
  },
  customerGroup: {
    list: resourcePath("Customer Group")
  },
  territory: {
    list: resourcePath("Territory")
  },
  uom: {
    list: resourcePath("UOM")
  },
  company: {
    list: resourcePath("Company")
  },
  stock: {
    bin: resourcePath("Bin"),
    stockEntry: resourcePath("Stock Entry"),
    stockLedgerEntry: resourcePath("Stock Ledger Entry"),
    stockEntryType: resourcePath("Stock Entry Type"),
    purchaseReceipt: resourcePath("Purchase Receipt"),
    deliveryNote: resourcePath("Delivery Note")
  }
};
