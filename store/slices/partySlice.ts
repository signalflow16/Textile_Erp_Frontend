"use client";

import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type EntityState
} from "@reduxjs/toolkit";

import { apiRequest, normalizeApiError } from "@/services/axiosInstance";
import { masterDataEndpoints } from "@/services/endpoints";
import type { RootState } from "@/store";
import type {
  CustomerCreateValues,
  CustomerRow,
  FrappeDocumentPayload,
  FrappeListPayload,
  MasterDataRequestState,
  PartyCreatePayload,
  PartyLookups,
  SupplierCreateValues,
  SupplierRow
} from "@/types/master-data";
import type { LookupOption } from "@/types/item";

type PartyState = {
  suppliers: EntityState<SupplierRow, string>;
  customers: EntityState<CustomerRow, string>;
  fetchStatus: {
    suppliers: MasterDataRequestState;
    customers: MasterDataRequestState;
  };
  createStatus: {
    suppliers: MasterDataRequestState;
    customers: MasterDataRequestState;
  };
  lookupsStatus: MasterDataRequestState;
  lookups: PartyLookups;
  error: {
    suppliers: string | null;
    customers: string | null;
    lookups: string | null;
  };
};

const supplierAdapter = createEntityAdapter<SupplierRow, string>({
  selectId: (supplier) => supplier.name,
  sortComparer: (left, right) => (left.supplier_name ?? left.name).localeCompare(right.supplier_name ?? right.name)
});

const customerAdapter = createEntityAdapter<CustomerRow, string>({
  selectId: (customer) => customer.name,
  sortComparer: (left, right) => (left.customer_name ?? left.name).localeCompare(right.customer_name ?? right.name)
});

const initialState: PartyState = {
  suppliers: supplierAdapter.getInitialState(),
  customers: customerAdapter.getInitialState(),
  fetchStatus: {
    suppliers: "idle",
    customers: "idle"
  },
  createStatus: {
    suppliers: "idle",
    customers: "idle"
  },
  lookupsStatus: "idle",
  lookups: {
    supplierGroups: [],
    customerGroups: [],
    territories: []
  },
  error: {
    suppliers: null,
    customers: null,
    lookups: null
  }
};

const encodeFrappeJson = (value: unknown) => JSON.stringify(value);

const mapLookupOptions = <T extends Record<string, unknown>>(rows: T[], valueKey: keyof T, labelKey?: keyof T): LookupOption[] => {
  const options: LookupOption[] = [];

  rows.forEach((row) => {
    const value = row[valueKey];
    const label = labelKey ? row[labelKey] : value;

    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    options.push({
      value,
      label: typeof label === "string" && label.trim() ? label : value
    });
  });

  return options;
};

export const fetchSuppliers = createAsyncThunk<SupplierRow[], void, { rejectValue: string }>(
  "parties/fetchSuppliers",
  async (_arg, thunkApi) => {
    try {
      const payload = await apiRequest<FrappeListPayload<SupplierRow>>({
        url: masterDataEndpoints.supplier.list,
        method: "GET",
        params: {
          // Keep list reads portable across ERPNext sites by only requesting core Supplier fields.
          fields: encodeFrappeJson(["name", "supplier_name", "supplier_group", "supplier_type", "modified"]),
          order_by: "supplier_name asc",
          limit_page_length: 500
        }
      });

      return payload.data ?? [];
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch suppliers.").message);
    }
  }
);

export const fetchCustomers = createAsyncThunk<CustomerRow[], void, { rejectValue: string }>(
  "parties/fetchCustomers",
  async (_arg, thunkApi) => {
    try {
      const payload = await apiRequest<FrappeListPayload<CustomerRow>>({
        url: masterDataEndpoints.customer.list,
        method: "GET",
        params: {
          // Keep list reads portable across ERPNext sites by only requesting core Customer fields.
          fields: encodeFrappeJson(["name", "customer_name", "customer_group", "territory", "modified"]),
          order_by: "customer_name asc",
          limit_page_length: 500
        }
      });

      return payload.data ?? [];
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch customers.").message);
    }
  }
);

export const fetchPartyLookups = createAsyncThunk<PartyLookups, void, { rejectValue: string }>(
  "parties/fetchLookups",
  async (_arg, thunkApi) => {
    try {
      const [supplierGroupsPayload, customerGroupsPayload, territoriesPayload] = await Promise.all([
        apiRequest<FrappeListPayload<{ name: string; supplier_group_name?: string | null }>>({
          url: masterDataEndpoints.supplierGroup.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "supplier_group_name"]),
            order_by: "supplier_group_name asc",
            limit_page_length: 200
          }
        }),
        apiRequest<FrappeListPayload<{ name: string; customer_group_name?: string | null }>>({
          url: masterDataEndpoints.customerGroup.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "customer_group_name"]),
            order_by: "customer_group_name asc",
            limit_page_length: 200
          }
        }),
        apiRequest<FrappeListPayload<{ name: string; territory_name?: string | null }>>({
          url: masterDataEndpoints.territory.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "territory_name"]),
            order_by: "territory_name asc",
            limit_page_length: 200
          }
        })
      ]);

      return {
        supplierGroups: mapLookupOptions(supplierGroupsPayload.data ?? [], "name", "supplier_group_name"),
        customerGroups: mapLookupOptions(customerGroupsPayload.data ?? [], "name", "customer_group_name"),
        territories: mapLookupOptions(territoriesPayload.data ?? [], "name", "territory_name")
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch party lookups.").message);
    }
  }
);

const createSupplierDocument = (values: SupplierCreateValues) => ({
  supplier_name: values.supplier_name.trim(),
  supplier_group: values.supplier_group.trim(),
  supplier_type: values.supplier_type,
  ...(values.mobile_no?.trim() ? { mobile_no: values.mobile_no.trim() } : {}),
  ...(values.email_id?.trim() ? { email_id: values.email_id.trim() } : {}),
  ...(values.gstin?.trim() ? { gstin: values.gstin.trim() } : {})
});

const createCustomerDocument = (values: CustomerCreateValues) => ({
  customer_name: values.customer_name.trim(),
  customer_group: values.customer_group.trim(),
  territory: values.territory.trim(),
  ...(values.mobile_no?.trim() ? { mobile_no: values.mobile_no.trim() } : {}),
  ...(values.email_id?.trim() ? { email_id: values.email_id.trim() } : {}),
  ...(values.gstin?.trim() ? { gstin: values.gstin.trim() } : {})
});

export const createParty = createAsyncThunk<
  { type: "supplier"; supplier: SupplierRow } | { type: "customer"; customer: CustomerRow },
  PartyCreatePayload,
  { rejectValue: { type: "supplier" | "customer"; message: string } }
>(
  "parties/createParty",
  async (payload, thunkApi) => {
    try {
      if (payload.type === "supplier") {
        const response = await apiRequest<FrappeDocumentPayload<SupplierRow>>({
          url: masterDataEndpoints.supplier.list,
          method: "POST",
          data: createSupplierDocument(payload.values)
        });

        return {
          type: "supplier",
          supplier: response.data
        };
      }

      const response = await apiRequest<FrappeDocumentPayload<CustomerRow>>({
        url: masterDataEndpoints.customer.list,
        method: "POST",
        data: createCustomerDocument(payload.values)
      });

      return {
        type: "customer",
        customer: response.data
      };
    } catch (error) {
      return thunkApi.rejectWithValue({
        type: payload.type,
        message: normalizeApiError(error, `Unable to create ${payload.type}.`).message
      });
    }
  }
);

const partySlice = createSlice({
  name: "parties",
  initialState,
  reducers: {
    clearPartyError(state, action: { payload: "suppliers" | "customers" }) {
      state.error[action.payload] = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.fetchStatus.suppliers = "loading";
        state.error.suppliers = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.fetchStatus.suppliers = "succeeded";
        supplierAdapter.setAll(state.suppliers, action.payload);
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.fetchStatus.suppliers = "failed";
        state.error.suppliers = action.payload ?? "Unable to fetch suppliers.";
      })
      .addCase(fetchCustomers.pending, (state) => {
        state.fetchStatus.customers = "loading";
        state.error.customers = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.fetchStatus.customers = "succeeded";
        customerAdapter.setAll(state.customers, action.payload);
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.fetchStatus.customers = "failed";
        state.error.customers = action.payload ?? "Unable to fetch customers.";
      })
      .addCase(fetchPartyLookups.pending, (state) => {
        state.lookupsStatus = "loading";
        state.error.lookups = null;
      })
      .addCase(fetchPartyLookups.fulfilled, (state, action) => {
        state.lookupsStatus = "succeeded";
        state.lookups = action.payload;
      })
      .addCase(fetchPartyLookups.rejected, (state, action) => {
        state.lookupsStatus = "failed";
        state.error.lookups = action.payload ?? "Unable to fetch party lookups.";
      })
      .addCase(createParty.pending, (state, action) => {
        const targetKey = action.meta.arg.type === "supplier" ? "suppliers" : "customers";
        state.createStatus[targetKey] = "loading";
        state.error[targetKey] = null;
      })
      .addCase(createParty.fulfilled, (state, action) => {
        if (action.payload.type === "supplier") {
          state.createStatus.suppliers = "succeeded";
          supplierAdapter.addOne(state.suppliers, action.payload.supplier);
          return;
        }

        state.createStatus.customers = "succeeded";
        customerAdapter.addOne(state.customers, action.payload.customer);
      })
      .addCase(createParty.rejected, (state, action) => {
        if (!action.payload) {
          return;
        }

        const targetKey = action.payload.type === "supplier" ? "suppliers" : "customers";
        state.createStatus[targetKey] = "failed";
        state.error[targetKey] = action.payload.message;
      });
  }
});

export const { clearPartyError } = partySlice.actions;

export const selectPartyState = (state: RootState) => state.parties;
export const selectPartyLookups = (state: RootState) => state.parties.lookups;
export const selectAllSuppliers = supplierAdapter.getSelectors<RootState>((state) => state.parties.suppliers).selectAll;
export const selectAllCustomers = customerAdapter.getSelectors<RootState>((state) => state.parties.customers).selectAll;

export default partySlice.reducer;
