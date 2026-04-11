import type {
  CompanyFormValues,
  CustomerFormValues,
  ItemGroupFormValues,
  SupplierFormValues,
  UomFormValues,
  WarehouseFormValues
} from "@/modules/initial-setup/types/initialSetup";

export const defaultCompanyValues: CompanyFormValues = {
  company_name: "",
  abbreviation: "",
  default_currency: "INR",
  country: "India"
};

export const defaultWarehouseValues: WarehouseFormValues = {
  company: "",
  warehouses: [
    {
      warehouse_name: "Stores",
      children: [
        { warehouse_name: "Main Godown", children: [] },
        { warehouse_name: "Retail Floor", children: [] }
      ]
    }
  ]
};

export const defaultUomValues: UomFormValues = {
  uoms: [
    { uom_name: "Nos", must_be_whole_number: true },
    { uom_name: "Meter", must_be_whole_number: false },
    { uom_name: "Piece", must_be_whole_number: true },
    { uom_name: "Box", must_be_whole_number: true }
  ]
};

export const defaultItemGroupValues: ItemGroupFormValues = {
  item_groups: [
    { item_group_name: "Fabrics", children: [] },
    { item_group_name: "Sarees", children: [] },
    { item_group_name: "Shirts", children: [] },
    { item_group_name: "Kids Wear", children: [] }
  ]
};

export const defaultSupplierValues: SupplierFormValues = {
  suppliers: [
    {
      supplier_name: "",
      supplier_group: "All Supplier Groups",
      supplier_type: "Company",
      mobile_no: "",
      email_id: "",
      gstin: ""
    }
  ]
};

export const defaultCustomerValues: CustomerFormValues = {
  customers: [
    {
      customer_name: "Walk-in Customer",
      customer_group: "All Customer Groups",
      territory: "India",
      mobile_no: "",
      email_id: "",
      gstin: ""
    }
  ]
};