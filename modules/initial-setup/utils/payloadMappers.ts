import type {
  CompanyFormValues,
  CompanySetupPayload,
  CustomerFormValues,
  CustomersSetupPayload,
  InitialSetupPayload,
  ItemGroupFormNode,
  ItemGroupFormValues,
  ItemGroupsSetupPayload,
  SupplierFormValues,
  SuppliersSetupPayload,
  UomFormValues,
  UomsSetupPayload,
  WarehouseFormNode,
  WarehouseFormValues,
  WarehousesSetupPayload
} from "@/modules/initial-setup/types/initialSetup";

const cleanText = (value: string | undefined) => (value ?? "").trim();

type MappedWarehouseNode = {
  warehouse_name: string;
  children: MappedWarehouseNode[];
};

type MappedItemGroupNode = {
  item_group_name: string;
  children: MappedItemGroupNode[];
};

const mapWarehouseNode = (node: WarehouseFormNode): MappedWarehouseNode => ({
  warehouse_name: cleanText(node.warehouse_name),
  children: (node.children ?? [])
    .map(mapWarehouseNode)
    .filter((child) => child.warehouse_name.length > 0)
});

const mapItemGroupNode = (node: ItemGroupFormNode): MappedItemGroupNode => ({
  item_group_name: cleanText(node.item_group_name),
  children: (node.children ?? [])
    .map(mapItemGroupNode)
    .filter((child) => child.item_group_name.length > 0)
});

export const mapCompanyPayload = (values: CompanyFormValues): CompanySetupPayload => ({
  company_name: cleanText(values.company_name),
  abbreviation: cleanText(values.abbreviation).toUpperCase(),
  default_currency: cleanText(values.default_currency),
  country: cleanText(values.country)
});

export const mapWarehousePayload = (values: WarehouseFormValues): WarehousesSetupPayload => ({
  company: cleanText(values.company),
  warehouses: values.warehouses
    .map(mapWarehouseNode)
    .filter((warehouse) => warehouse.warehouse_name.length > 0)
});

export const mapUomPayload = (values: UomFormValues): UomsSetupPayload => ({
  uoms: values.uoms
    .filter((uom) => cleanText(uom.uom_name).length > 0)
    .map((uom) => ({
      uom_name: cleanText(uom.uom_name),
      must_be_whole_number: uom.must_be_whole_number ? 1 : 0
    }))
});

export const mapItemGroupPayload = (values: ItemGroupFormValues): ItemGroupsSetupPayload => ({
  item_groups: values.item_groups
    .map(mapItemGroupNode)
    .filter((group) => group.item_group_name.length > 0)
});

export const mapSuppliersPayload = (values: SupplierFormValues): SuppliersSetupPayload => ({
  suppliers: values.suppliers
    .filter((supplier) => cleanText(supplier.supplier_name).length > 0)
    .map((supplier) => ({
      supplier_name: cleanText(supplier.supplier_name),
      supplier_group: cleanText(supplier.supplier_group),
      supplier_type: cleanText(supplier.supplier_type),
      mobile_no: cleanText(supplier.mobile_no),
      email_id: cleanText(supplier.email_id),
      gstin: cleanText(supplier.gstin)
    }))
});

export const mapCustomersPayload = (values: CustomerFormValues): CustomersSetupPayload => ({
  customers: values.customers
    .filter((customer) => cleanText(customer.customer_name).length > 0)
    .map((customer) => ({
      customer_name: cleanText(customer.customer_name),
      customer_group: cleanText(customer.customer_group),
      territory: cleanText(customer.territory),
      mobile_no: cleanText(customer.mobile_no),
      email_id: cleanText(customer.email_id),
      gstin: cleanText(customer.gstin)
    }))
});

export const mapInitializePayload = (values: {
  company: CompanyFormValues;
  warehouses: WarehouseFormValues;
  uoms: UomFormValues;
  itemGroups: ItemGroupFormValues;
  suppliers: SupplierFormValues;
  customers: CustomerFormValues;
}): InitialSetupPayload => ({
  company: mapCompanyPayload(values.company),
  warehouses: mapWarehousePayload(values.warehouses),
  uoms: mapUomPayload(values.uoms).uoms,
  item_groups: mapItemGroupPayload(values.itemGroups),
  suppliers: mapSuppliersPayload(values.suppliers),
  customers: mapCustomersPayload(values.customers)
});
