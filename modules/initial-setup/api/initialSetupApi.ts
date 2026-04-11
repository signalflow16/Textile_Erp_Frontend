import { frappeApi } from "@/store/api/frappeApi";
import type {
  CompanySetupPayload,
  CustomersSetupPayload,
  InitialSetupPayload,
  InitialSetupEnvelope,
  ItemGroupNode,
  ItemGroupsSetupPayload,
  MasterCountsResponse,
  SetupMutationResponse,
  SetupReadinessResponse,
  SetupStatusResponse,
  SuppliersSetupPayload,
  UomsSetupPayload,
  WarehousesSetupPayload,
  WarehouseNode,
  SetupActionResponseData
} from "@/modules/initial-setup/types/initialSetup";

type QueryArg = string | {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, unknown>;
};

type BaseQueryError = {
  status?: number;
  data: unknown;
};

type QueryResult = { data: unknown } | { error: BaseQueryError };
type QueryExecutor = (arg: QueryArg) => Promise<QueryResult>;

type CountMap = {
  company_count: number;
  warehouse_count: number;
  uom_count: number;
  item_group_count: number;
  supplier_count: number;
  customer_count: number;
};

type RunSectionResult = {
  section: "company" | "warehouses" | "uoms" | "item_groups" | "suppliers" | "customers";
  status: "created" | "skipped" | "failed";
  message: string;
  created: number;
  skipped: number;
};

type FrappeListResponse<T> = {
  data: T[];
};

type FrappeDocResponse<T> = {
  data: T;
};

const encode = (value: unknown) => JSON.stringify(value);

const toEnvelopeSuccess = <T>(data: T, message = "Success", code = "OK"): InitialSetupEnvelope<T> => ({
  ok: true,
  code,
  message,
  data
});

const hasError = (result: QueryResult): result is { error: BaseQueryError } => "error" in result;

const getErrorStatus = (error: unknown): number | null => {
  if (!error || typeof error !== "object") {
    return null;
  }

  if (!("status" in error)) {
    return null;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
};

const isNotFoundError = (error: unknown) => getErrorStatus(error) === 404;

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const getCount = async (
  baseQuery: QueryExecutor,
  doctype: string,
  filters?: unknown[][]
): Promise<number | { error: BaseQueryError }> => {
  const params: Record<string, unknown> = {
    fields: encode(["count(name) as total_count"]),
    limit_page_length: 1
  };

  if (filters?.length) {
    params.filters = encode(filters);
  }

  const result = await baseQuery({
    url: `/resource/${encodeURIComponent(doctype)}`,
    method: "GET",
    params
  });

  if (hasError(result)) {
    return { error: result.error };
  }

  const rows = (result.data as FrappeListResponse<{ total_count?: number | string }>).data;
  return toNumber(rows?.[0]?.total_count);
};

const getMasterCounts = async (baseQuery: QueryExecutor): Promise<CountMap | { error: BaseQueryError }> => {
  const [company, warehouse, uom, itemGroup, supplier, customer] = await Promise.all([
    getCount(baseQuery, "Company"),
    getCount(baseQuery, "Warehouse"),
    getCount(baseQuery, "UOM"),
    getCount(baseQuery, "Item Group"),
    getCount(baseQuery, "Supplier"),
    getCount(baseQuery, "Customer")
  ]);

  const firstError = [company, warehouse, uom, itemGroup, supplier, customer].find(
    (value): value is { error: BaseQueryError } => typeof value === "object" && value !== null && "error" in value
  );

  if (firstError) {
    return firstError;
  }

  return {
    company_count: company as number,
    warehouse_count: warehouse as number,
    uom_count: uom as number,
    item_group_count: itemGroup as number,
    supplier_count: supplier as number,
    customer_count: customer as number
  };
};

const findSingleDoc = async (
  baseQuery: QueryExecutor,
  doctype: string,
  fields: string[],
  filters: unknown[][]
): Promise<{ doc: Record<string, unknown> | null } | { error: BaseQueryError }> => {
  const result = await baseQuery({
    url: `/resource/${encodeURIComponent(doctype)}`,
    method: "GET",
    params: {
      fields: encode(fields),
      filters: encode(filters),
      limit_page_length: 1
    }
  });

  if (hasError(result)) {
    return { error: result.error };
  }

  const rows = (result.data as FrappeListResponse<Record<string, unknown>>).data;
  return { doc: rows[0] ?? null };
};

const createCompany = async (
  baseQuery: QueryExecutor,
  payload: CompanySetupPayload
): Promise<RunSectionResult | { error: BaseQueryError }> => {
  const existingResult = await findSingleDoc(
    baseQuery,
    "Company",
    ["name", "company_name", "abbr"],
    [["company_name", "=", payload.company_name]]
  );

  if ("error" in existingResult) {
    return existingResult;
  }

  const existing = existingResult.doc;

  if (existing) {
    return {
      section: "company",
      status: "skipped",
      message: "Company already exists.",
      created: 0,
      skipped: 1
    };
  }

  const createResult = await baseQuery({
    url: "/resource/Company",
    method: "POST",
    data: {
      company_name: payload.company_name,
      abbr: payload.abbreviation,
      default_currency: payload.default_currency,
      country: payload.country
    }
  });

  if (hasError(createResult)) {
    return { error: createResult.error };
  }

  return {
    section: "company",
    status: "created",
    message: "Company created.",
    created: 1,
    skipped: 0
  };
};

const resolveCompanyAbbr = async (baseQuery: QueryExecutor, company: string): Promise<string | { error: BaseQueryError }> => {
  const companyResult = await baseQuery({
    url: `/resource/Company/${encodeURIComponent(company)}`,
    method: "GET"
  });

  if (hasError(companyResult)) {
    return { error: companyResult.error };
  }

  const companyDoc = (companyResult.data as FrappeDocResponse<Record<string, unknown>>).data;
  return typeof companyDoc.abbr === "string" ? companyDoc.abbr : "";
};

const upsertWarehouseNode = async (
  baseQuery: QueryExecutor,
  company: string,
  parentWarehouse: string,
  node: WarehouseNode
): Promise<{ created: number; skipped: number; error?: BaseQueryError }> => {
  const existing = await findSingleDoc(
    baseQuery,
    "Warehouse",
    ["name"],
    [
      ["warehouse_name", "=", node.warehouse_name],
      ["company", "=", company],
      ["parent_warehouse", "=", parentWarehouse]
    ]
  );

  if ("error" in existing) {
    return { created: 0, skipped: 0, error: existing.error };
  }
  const existingDoc = existing.doc;
  let warehouseName = existingDoc && typeof existingDoc.name === "string" ? existingDoc.name : null;
  let created = 0;
  let skipped = 0;

  if (!warehouseName) {
    const createResult = await baseQuery({
      url: "/resource/Warehouse",
      method: "POST",
      data: {
        warehouse_name: node.warehouse_name,
        parent_warehouse: parentWarehouse,
        company,
        is_group: Array.isArray(node.children) && node.children.length > 0 ? 1 : 0
      }
    });

    if (hasError(createResult)) {
      return { created: 0, skipped: 0, error: createResult.error };
    }

    const createdDoc = (createResult.data as FrappeDocResponse<Record<string, unknown>>).data;
    warehouseName = typeof createdDoc.name === "string" ? createdDoc.name : null;
    created += 1;
  } else {
    skipped += 1;
  }

  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    const childResult = await upsertWarehouseNode(baseQuery, company, warehouseName || parentWarehouse, child);
    if (childResult.error) {
      return { created, skipped, error: childResult.error };
    }

    created += childResult.created;
    skipped += childResult.skipped;
  }

  return { created, skipped };
};

const createWarehouses = async (
  baseQuery: QueryExecutor,
  payload: WarehousesSetupPayload
): Promise<RunSectionResult | { error: BaseQueryError }> => {
  const abbr = await resolveCompanyAbbr(baseQuery, payload.company);
  if (typeof abbr === "object" && abbr !== null && "error" in abbr) {
    return abbr;
  }

  const rootWarehouse = `All Warehouses - ${abbr}`;
  let created = 0;
  let skipped = 0;

  for (const node of payload.warehouses) {
    const result = await upsertWarehouseNode(baseQuery, payload.company, rootWarehouse, node);
    if (result.error) {
      return { error: result.error };
    }

    created += result.created;
    skipped += result.skipped;
  }

  return {
    section: "warehouses",
    status: created > 0 ? "created" : "skipped",
    message: created > 0 ? "Warehouses setup completed." : "All warehouses already exist.",
    created,
    skipped
  };
};

const createUoms = async (
  baseQuery: QueryExecutor,
  payload: UomsSetupPayload
): Promise<RunSectionResult | { error: BaseQueryError }> => {
  let created = 0;
  let skipped = 0;

  for (const row of payload.uoms) {
    const uomName = row.uom_name.trim();
    if (!uomName) {
      continue;
    }

    const existingResult = await baseQuery({
      url: `/resource/UOM/${encodeURIComponent(uomName)}`,
      method: "GET"
    });

    if (!hasError(existingResult)) {
      skipped += 1;
      continue;
    }

    if (!isNotFoundError(existingResult.error)) {
      return { error: existingResult.error };
    }

    const createResult = await baseQuery({
      url: "/resource/UOM",
      method: "POST",
      data: {
        uom_name: uomName,
        must_be_whole_number: row.must_be_whole_number
      }
    });

    if (hasError(createResult)) {
      return { error: createResult.error };
    }

    created += 1;
  }

  return {
    section: "uoms",
    status: created > 0 ? "created" : "skipped",
    message: created > 0 ? "UOM setup completed." : "All UOMs already exist.",
    created,
    skipped
  };
};

const upsertItemGroupNode = async (
  baseQuery: QueryExecutor,
  parentItemGroup: string,
  node: ItemGroupNode
): Promise<{ created: number; skipped: number; name: string | null; error?: BaseQueryError }> => {
  const existingResult = await findSingleDoc(
    baseQuery,
    "Item Group",
    ["name", "is_group"],
    [
      ["item_group_name", "=", node.item_group_name],
      ["parent_item_group", "=", parentItemGroup]
    ]
  );

  if ("error" in existingResult) {
    return { created: 0, skipped: 0, name: null, error: existingResult.error };
  }

  const existing = existingResult.doc;
  let itemGroupName = existing && typeof existing.name === "string" ? existing.name : null;
  let created = 0;
  let skipped = 0;

  if (!itemGroupName) {
    const createResult = await baseQuery({
      url: "/resource/Item Group",
      method: "POST",
      data: {
        item_group_name: node.item_group_name,
        parent_item_group: parentItemGroup,
        is_group: Array.isArray(node.children) && node.children.length > 0 ? 1 : 0
      }
    });

    if (hasError(createResult)) {
      return { created: 0, skipped: 0, name: null, error: createResult.error };
    }

    const createdDoc = (createResult.data as FrappeDocResponse<Record<string, unknown>>).data;
    itemGroupName = typeof createdDoc.name === "string" ? createdDoc.name : null;
    created += 1;
  } else {
    skipped += 1;
  }

  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    const childResult = await upsertItemGroupNode(baseQuery, itemGroupName || parentItemGroup, child);
    if (childResult.error) {
      return { created, skipped, name: itemGroupName, error: childResult.error };
    }

    created += childResult.created;
    skipped += childResult.skipped;
  }

  return { created, skipped, name: itemGroupName };
};

const createItemGroups = async (
  baseQuery: QueryExecutor,
  payload: ItemGroupsSetupPayload
): Promise<RunSectionResult | { error: BaseQueryError }> => {
  let created = 0;
  let skipped = 0;

  for (const node of payload.item_groups) {
    const result = await upsertItemGroupNode(baseQuery, "All Item Groups", node);
    if (result.error) {
      return { error: result.error };
    }

    created += result.created;
    skipped += result.skipped;
  }

  return {
    section: "item_groups",
    status: created > 0 ? "created" : "skipped",
    message: created > 0 ? "Item groups setup completed." : "All item groups already exist.",
    created,
    skipped
  };
};

const createSuppliers = async (
  baseQuery: QueryExecutor,
  payload: SuppliersSetupPayload
): Promise<RunSectionResult | { error: BaseQueryError }> => {
  let created = 0;
  let skipped = 0;

  for (const supplier of payload.suppliers) {
    const supplierName = supplier.supplier_name.trim();
    if (!supplierName) {
      continue;
    }

    const existingResult = await findSingleDoc(
      baseQuery,
      "Supplier",
      ["name"],
      [["supplier_name", "=", supplierName]]
    );

    if ("error" in existingResult) {
      return existingResult;
    }

    const existing = existingResult.doc;
    if (existing) {
      skipped += 1;
      continue;
    }

    const createResult = await baseQuery({
      url: "/resource/Supplier",
      method: "POST",
      data: {
        supplier_name: supplierName,
        supplier_group: supplier.supplier_group,
        supplier_type: supplier.supplier_type,
        mobile_no: supplier.mobile_no,
        email_id: supplier.email_id,
        // MIGRATION NOTE: `gstin` from legacy payload is mapped to ERPNext standard `tax_id`.
        tax_id: supplier.gstin
      }
    });

    if (hasError(createResult)) {
      return { error: createResult.error };
    }

    created += 1;
  }

  return {
    section: "suppliers",
    status: created > 0 ? "created" : "skipped",
    message: created > 0 ? "Suppliers setup completed." : "All suppliers already exist.",
    created,
    skipped
  };
};

const createCustomers = async (
  baseQuery: QueryExecutor,
  payload: CustomersSetupPayload
): Promise<RunSectionResult | { error: BaseQueryError }> => {
  let created = 0;
  let skipped = 0;

  for (const customer of payload.customers) {
    const customerName = customer.customer_name.trim();
    if (!customerName) {
      continue;
    }

    const existingResult = await findSingleDoc(
      baseQuery,
      "Customer",
      ["name"],
      [["customer_name", "=", customerName]]
    );

    if ("error" in existingResult) {
      return existingResult;
    }

    const existing = existingResult.doc;
    if (existing) {
      skipped += 1;
      continue;
    }

    const createResult = await baseQuery({
      url: "/resource/Customer",
      method: "POST",
      data: {
        customer_name: customerName,
        customer_group: customer.customer_group,
        territory: customer.territory,
        mobile_no: customer.mobile_no,
        email_id: customer.email_id,
        // MIGRATION NOTE: `gstin` from legacy payload is mapped to ERPNext standard `tax_id`.
        tax_id: customer.gstin
      }
    });

    if (hasError(createResult)) {
      return { error: createResult.error };
    }

    created += 1;
  }

  return {
    section: "customers",
    status: created > 0 ? "created" : "skipped",
    message: created > 0 ? "Customers setup completed." : "All customers already exist.",
    created,
    skipped
  };
};

const createStatusEnvelope = (counts: CountMap): SetupStatusResponse => {
  const sections = {
    company: {
      status: counts.company_count > 0 ? "completed" : "not_started",
      message: counts.company_count > 0 ? "Company is configured." : "Company setup is pending."
    },
    warehouses: {
      status: counts.warehouse_count > 0 ? "completed" : "not_started",
      message: counts.warehouse_count > 0 ? "Warehouses are configured." : "Warehouse setup is pending."
    },
    uoms: {
      status: counts.uom_count > 0 ? "completed" : "not_started",
      message: counts.uom_count > 0 ? "UOMs are configured." : "UOM setup is pending."
    },
    item_groups: {
      status: counts.item_group_count > 0 ? "completed" : "not_started",
      message: counts.item_group_count > 0 ? "Item groups are configured." : "Item group setup is pending."
    },
    suppliers: {
      status: counts.supplier_count > 0 ? "completed" : "not_started",
      message: counts.supplier_count > 0 ? "Suppliers are configured." : "Supplier setup is pending."
    },
    customers: {
      status: counts.customer_count > 0 ? "completed" : "not_started",
      message: counts.customer_count > 0 ? "Customers are configured." : "Customer setup is pending."
    }
  };

  const completedCount = Object.values(sections).filter((section) => section.status === "completed").length;
  const total = Object.keys(sections).length;

  const status = completedCount === total ? "completed" : completedCount === 0 ? "not_started" : "in_progress";

  return toEnvelopeSuccess(
    {
      status,
      sections,
      readiness: {
        ready: completedCount === total
      },
      message: completedCount === total
        ? "All initial setup sections are completed."
        : `${completedCount}/${total} sections completed.`
    },
    "Initial setup status loaded"
  );
};

const createReadinessEnvelope = (counts: CountMap): SetupReadinessResponse => {
  const missingSections: string[] = [];

  if (counts.company_count === 0) {
    missingSections.push("company");
  }

  if (counts.warehouse_count === 0) {
    missingSections.push("warehouses");
  }

  if (counts.uom_count === 0) {
    missingSections.push("uoms");
  }

  if (counts.item_group_count === 0) {
    missingSections.push("item_groups");
  }

  if (counts.supplier_count === 0) {
    missingSections.push("suppliers");
  }

  if (counts.customer_count === 0) {
    missingSections.push("customers");
  }

  const ready = missingSections.length === 0;

  return toEnvelopeSuccess(
    {
      ready,
      is_ready: ready,
      can_create_items: ready,
      missing_sections: missingSections,
      message: ready
        ? "All required setup masters are available for item creation."
        : "Complete the pending setup sections before creating items."
    },
    "Readiness evaluated"
  );
};

const normalizeInitializePayload = (data: InitialSetupPayload) => {
  const uoms = Array.isArray(data.uoms) ? data.uoms : [];

  return {
    company: data.company,
    warehouses: data.warehouses,
    uoms,
    item_groups: data.item_groups,
    suppliers: data.suppliers,
    customers: data.customers
  };
};

const runInitializeFlow = async (
  baseQuery: QueryExecutor,
  payload: InitialSetupPayload
): Promise<SetupMutationResponse | { error: BaseQueryError }> => {
  const normalized = normalizeInitializePayload(payload);
  const sectionResults: Record<string, Record<string, unknown>> = {};
  const summary: Record<string, unknown> = {
    created: 0,
    skipped: 0,
    failed_sections: [] as string[]
  };

  const operations: Array<() => Promise<RunSectionResult | { error: BaseQueryError }>> = [
    () => createCompany(baseQuery, normalized.company),
    () => createWarehouses(baseQuery, normalized.warehouses),
    () => createUoms(baseQuery, { uoms: normalized.uoms }),
    () => createItemGroups(baseQuery, normalized.item_groups),
    () => createSuppliers(baseQuery, normalized.suppliers),
    () => createCustomers(baseQuery, normalized.customers)
  ];

  for (const operation of operations) {
    const result = await operation();

    if (typeof result === "object" && result !== null && "error" in result) {
      return { error: result.error };
    }

    const successResult = result as RunSectionResult;
    sectionResults[successResult.section] = {
      status: successResult.status,
      message: successResult.message,
      created: successResult.created,
      skipped: successResult.skipped
    };

    summary.created = toNumber(summary.created) + successResult.created;
    summary.skipped = toNumber(summary.skipped) + successResult.skipped;
  }

  const responseData: SetupActionResponseData = {
    sections: sectionResults,
    summary
  };

  return toEnvelopeSuccess(responseData, "Initial setup flow completed using standard ERPNext resources.");
};

export const initialSetupApi = frappeApi.injectEndpoints({
  endpoints: (builder) => ({
    getInitialSetupStatus: builder.query<SetupStatusResponse, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const counts = await getMasterCounts(baseQuery as QueryExecutor);
        if (typeof counts === "object" && counts !== null && "error" in counts) {
          return { error: counts.error };
        }

        return { data: createStatusEnvelope(counts as CountMap) };
      }
    }),
    getMasterCounts: builder.query<MasterCountsResponse, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const counts = await getMasterCounts(baseQuery as QueryExecutor);
        if (typeof counts === "object" && counts !== null && "error" in counts) {
          return { error: counts.error };
        }

        return {
          data: toEnvelopeSuccess(counts as CountMap, "Master counts loaded")
        };
      }
    }),
    validateSetupReadinessForItemCreation: builder.query<SetupReadinessResponse, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const counts = await getMasterCounts(baseQuery as QueryExecutor);
        if (typeof counts === "object" && counts !== null && "error" in counts) {
          return { error: counts.error };
        }

        return { data: createReadinessEnvelope(counts as CountMap) };
      }
    }),
    setupCompany: builder.mutation<SetupMutationResponse, CompanySetupPayload>({
      async queryFn(data, _api, _extra, baseQuery) {
        const result = await createCompany(baseQuery as QueryExecutor, data);

        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: result.error };
        }

        const sectionResult = result as RunSectionResult;
        return {
          data: toEnvelopeSuccess(
            {
              sections: {
                company: {
                  status: sectionResult.status,
                  message: sectionResult.message,
                  created: sectionResult.created,
                  skipped: sectionResult.skipped
                }
              },
              summary: {
                created: sectionResult.created,
                skipped: sectionResult.skipped
              }
            },
            sectionResult.message
          )
        };
      }
    }),
    setupWarehouses: builder.mutation<SetupMutationResponse, WarehousesSetupPayload>({
      async queryFn(data, _api, _extra, baseQuery) {
        const result = await createWarehouses(baseQuery as QueryExecutor, data);

        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: result.error };
        }

        const sectionResult = result as RunSectionResult;
        return {
          data: toEnvelopeSuccess(
            {
              sections: {
                warehouses: {
                  status: sectionResult.status,
                  message: sectionResult.message,
                  created: sectionResult.created,
                  skipped: sectionResult.skipped
                }
              },
              summary: {
                created: sectionResult.created,
                skipped: sectionResult.skipped
              }
            },
            sectionResult.message
          )
        };
      }
    }),
    setupUoms: builder.mutation<SetupMutationResponse, UomsSetupPayload>({
      async queryFn(data, _api, _extra, baseQuery) {
        const result = await createUoms(baseQuery as QueryExecutor, data);

        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: result.error };
        }

        const sectionResult = result as RunSectionResult;
        return {
          data: toEnvelopeSuccess(
            {
              sections: {
                uoms: {
                  status: sectionResult.status,
                  message: sectionResult.message,
                  created: sectionResult.created,
                  skipped: sectionResult.skipped
                }
              },
              summary: {
                created: sectionResult.created,
                skipped: sectionResult.skipped
              }
            },
            sectionResult.message
          )
        };
      }
    }),
    setupItemGroups: builder.mutation<SetupMutationResponse, ItemGroupsSetupPayload>({
      async queryFn(data, _api, _extra, baseQuery) {
        const result = await createItemGroups(baseQuery as QueryExecutor, data);

        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: result.error };
        }

        const sectionResult = result as RunSectionResult;
        return {
          data: toEnvelopeSuccess(
            {
              sections: {
                item_groups: {
                  status: sectionResult.status,
                  message: sectionResult.message,
                  created: sectionResult.created,
                  skipped: sectionResult.skipped
                }
              },
              summary: {
                created: sectionResult.created,
                skipped: sectionResult.skipped
              }
            },
            sectionResult.message
          )
        };
      }
    }),
    setupSuppliers: builder.mutation<SetupMutationResponse, SuppliersSetupPayload>({
      async queryFn(data, _api, _extra, baseQuery) {
        const result = await createSuppliers(baseQuery as QueryExecutor, data);

        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: result.error };
        }

        const sectionResult = result as RunSectionResult;
        return {
          data: toEnvelopeSuccess(
            {
              sections: {
                suppliers: {
                  status: sectionResult.status,
                  message: sectionResult.message,
                  created: sectionResult.created,
                  skipped: sectionResult.skipped
                }
              },
              summary: {
                created: sectionResult.created,
                skipped: sectionResult.skipped
              }
            },
            sectionResult.message
          )
        };
      }
    }),
    setupCustomers: builder.mutation<SetupMutationResponse, CustomersSetupPayload>({
      async queryFn(data, _api, _extra, baseQuery) {
        const result = await createCustomers(baseQuery as QueryExecutor, data);

        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: result.error };
        }

        const sectionResult = result as RunSectionResult;
        return {
          data: toEnvelopeSuccess(
            {
              sections: {
                customers: {
                  status: sectionResult.status,
                  message: sectionResult.message,
                  created: sectionResult.created,
                  skipped: sectionResult.skipped
                }
              },
              summary: {
                created: sectionResult.created,
                skipped: sectionResult.skipped
              }
            },
            sectionResult.message
          )
        };
      }
    }),
    initializeInitialSetup: builder.mutation<SetupMutationResponse, InitialSetupPayload>({
      async queryFn(data, _api, _extra, baseQuery) {
        const result = await runInitializeFlow(baseQuery as QueryExecutor, data);

        if (!("ok" in result)) {
          return { error: result.error };
        }

        return { data: result };
      }
    })
  })
});

export const {
  useGetInitialSetupStatusQuery,
  useGetMasterCountsQuery,
  useValidateSetupReadinessForItemCreationQuery,
  useSetupCompanyMutation,
  useSetupWarehousesMutation,
  useSetupUomsMutation,
  useSetupItemGroupsMutation,
  useSetupSuppliersMutation,
  useSetupCustomersMutation,
  useInitializeInitialSetupMutation
} = initialSetupApi;
