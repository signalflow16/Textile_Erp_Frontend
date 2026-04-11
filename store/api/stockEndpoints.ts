const RESOURCE_BASE = "/resource";

const resourcePath = (doctype: string) => `${RESOURCE_BASE}/${encodeURIComponent(doctype)}`;
const documentPath = (doctype: string, name: string) => `${resourcePath(doctype)}/${encodeURIComponent(name)}`;

export const stockEndpoints = {
  item: {
    list: resourcePath("Item")
  },
  warehouse: {
    list: resourcePath("Warehouse")
  },
  bin: {
    list: resourcePath("Bin")
  },
  stockLedgerEntry: {
    list: resourcePath("Stock Ledger Entry")
  },
  purchaseReceipt: {
    list: resourcePath("Purchase Receipt")
  },
  deliveryNote: {
    list: resourcePath("Delivery Note")
  },
  stockEntry: {
    list: resourcePath("Stock Entry"),
    detail: (name: string) => documentPath("Stock Entry", name)
  },
  stockEntryType: {
    list: resourcePath("Stock Entry Type")
  }
};
