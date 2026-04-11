"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type BinaryFilter = "all" | "0" | "1";
type ItemGroupView = "workspace" | "list";

export type ItemGroupsUiState = {
  selectedItemGroup?: string;
  treeSearch: string;
  expandedKeys: string[];
  activeView: ItemGroupView;
  listPage: number;
  listPageSize: number;
  listSearch: string;
  listParentItemGroup?: string;
  listIsGroup: BinaryFilter;
  listDisabled: BinaryFilter;
};

const initialState: ItemGroupsUiState = {
  selectedItemGroup: undefined,
  treeSearch: "",
  expandedKeys: [],
  activeView: "workspace",
  listPage: 1,
  listPageSize: 20,
  listSearch: "",
  listParentItemGroup: undefined,
  listIsGroup: "all",
  listDisabled: "all"
};

const itemGroupsUiSlice = createSlice({
  name: "itemGroupsUi",
  initialState,
  reducers: {
    setSelectedItemGroup(state, action: PayloadAction<string | undefined>) {
      state.selectedItemGroup = action.payload;
    },
    setTreeSearch(state, action: PayloadAction<string>) {
      state.treeSearch = action.payload;
    },
    setExpandedKeys(state, action: PayloadAction<string[]>) {
      state.expandedKeys = action.payload;
    },
    setActiveView(state, action: PayloadAction<ItemGroupView>) {
      state.activeView = action.payload;
    },
    setListSearch(state, action: PayloadAction<string>) {
      state.listSearch = action.payload;
      state.listPage = 1;
    },
    setListParentItemGroup(state, action: PayloadAction<string | undefined>) {
      state.listParentItemGroup = action.payload;
      state.listPage = 1;
    },
    setListIsGroup(state, action: PayloadAction<BinaryFilter>) {
      state.listIsGroup = action.payload;
      state.listPage = 1;
    },
    setListDisabled(state, action: PayloadAction<BinaryFilter>) {
      state.listDisabled = action.payload;
      state.listPage = 1;
    },
    setListPage(state, action: PayloadAction<number>) {
      state.listPage = action.payload;
    },
    setListPageSize(state, action: PayloadAction<number>) {
      state.listPageSize = action.payload;
      state.listPage = 1;
    }
  }
});

export const {
  setActiveView,
  setExpandedKeys,
  setListDisabled,
  setListIsGroup,
  setListPage,
  setListPageSize,
  setListParentItemGroup,
  setListSearch,
  setSelectedItemGroup,
  setTreeSearch
} = itemGroupsUiSlice.actions;

export default itemGroupsUiSlice.reducer;
