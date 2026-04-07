"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type DisabledFilter = "all" | "0" | "1";
type HasVariantsFilter = "all" | "0" | "1";
type ItemSort = "modified_desc" | "modified_asc" | "item_code_asc" | "item_name_asc";

export type ItemsUiState = {
  search: string;
  itemCode: string;
  itemName: string;
  itemGroup?: string;
  variantOf: string;
  hasVariants: HasVariantsFilter;
  disabled: DisabledFilter;
  sortBy: ItemSort;
  page: number;
  pageSize: number;
};

const initialState: ItemsUiState = {
  search: "",
  itemCode: "",
  itemName: "",
  itemGroup: undefined,
  variantOf: "",
  hasVariants: "all",
  disabled: "all",
  sortBy: "modified_desc",
  page: 1,
  pageSize: 20
};

const itemsUiSlice = createSlice({
  name: "itemsUi",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setItemCode(state, action: PayloadAction<string>) {
      state.itemCode = action.payload;
      state.page = 1;
    },
    setItemName(state, action: PayloadAction<string>) {
      state.itemName = action.payload;
      state.page = 1;
    },
    setItemGroup(state, action: PayloadAction<string | undefined>) {
      state.itemGroup = action.payload;
      state.page = 1;
    },
    setVariantOf(state, action: PayloadAction<string>) {
      state.variantOf = action.payload;
      state.page = 1;
    },
    setHasVariants(state, action: PayloadAction<HasVariantsFilter>) {
      state.hasVariants = action.payload;
      state.page = 1;
    },
    setDisabled(state, action: PayloadAction<DisabledFilter>) {
      state.disabled = action.payload;
      state.page = 1;
    },
    setSortBy(state, action: PayloadAction<ItemSort>) {
      state.sortBy = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.page = 1;
    },
    resetFilters() {
      return initialState;
    }
  }
});

export const {
  resetFilters,
  setDisabled,
  setHasVariants,
  setItemCode,
  setItemGroup,
  setItemName,
  setPage,
  setPageSize,
  setSearch,
  setSortBy,
  setVariantOf
} = itemsUiSlice.actions;

export default itemsUiSlice.reducer;
