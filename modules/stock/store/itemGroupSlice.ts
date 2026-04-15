"use client";

import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type EntityState,
  type PayloadAction
} from "@reduxjs/toolkit";

import { apiRequest, normalizeApiError } from "@/core/api/axiosInstance";
import { fetchAllFrappePages } from "@/core/api/frappe";
import { itemGroupEndpoints } from "@/modules/stock/api/itemGroupEndpoints";
import type { RootState } from "@/store";
import type { FrappeDocumentPayload, FrappeListPayload } from "@/modules/stock/types/master-data";
import type {
  ItemGroupDocument,
  ItemGroupMutationPayload,
  ItemGroupTreeNode
} from "@/modules/stock/types/item-group";
import type { LookupOption } from "@/modules/stock/types/item";

type ItemGroupResourceRecord = {
  name: string;
  item_group_name?: string | null;
  parent_item_group?: string | null;
  is_group?: 0 | 1 | boolean | null;
  modified?: string | null;
  creation?: string | null;
  image?: string | null;
  description?: string | null;
};

type ItemGroupState = EntityState<ItemGroupDocument, string> & {
  treeData: string[];
  selectedGroup?: string;
  loading: boolean;
  detailLoading: boolean;
  mutationLoading: boolean;
  error: string | null;
  initialized: boolean;
};

const itemGroupAdapter = createEntityAdapter<ItemGroupDocument, string>({
  selectId: (itemGroup) => itemGroup.name,
  sortComparer: (left, right) => left.item_group_name.localeCompare(right.item_group_name)
});

const initialState: ItemGroupState = itemGroupAdapter.getInitialState({
  treeData: [],
  selectedGroup: undefined,
  loading: false,
  detailLoading: false,
  mutationLoading: false,
  error: null,
  initialized: false
});

const encodeFrappeJson = (value: unknown) => JSON.stringify(value);

const normalizeGroupRecord = (record: ItemGroupResourceRecord): ItemGroupDocument => ({
  name: record.name,
  item_group_name: record.item_group_name?.trim() || record.name,
  parent_item_group: record.parent_item_group?.trim() || null,
  is_group: record.is_group ? 1 : 0,
  disabled: 0,
  image: record.image ?? null,
  description: record.description ?? null,
  children_count: 0,
  item_count: 0,
  dependency_counts: {
    child_groups: 0,
    linked_items: 0
  },
  modified: record.modified ?? undefined,
  creation: record.creation ?? undefined,
  can_delete: true,
  can_disable: false,
  can_enable: false
});

const syncTreeData = (state: ItemGroupState) => {
  const roots = state.ids
    .map((id) => state.entities[id])
    .filter((itemGroup): itemGroup is ItemGroupDocument => Boolean(itemGroup))
    .filter((itemGroup) => !itemGroup.parent_item_group || !state.entities[itemGroup.parent_item_group])
    .sort((left, right) => left.item_group_name.localeCompare(right.item_group_name))
    .map((itemGroup) => itemGroup.name);

  state.treeData = roots;
};

const refreshDerivedMetadata = (state: ItemGroupState) => {
  const childCountByParent = new Map<string, number>();

  state.ids.forEach((id) => {
    const itemGroup = state.entities[id];
    if (!itemGroup?.parent_item_group) {
      return;
    }

    childCountByParent.set(itemGroup.parent_item_group, (childCountByParent.get(itemGroup.parent_item_group) ?? 0) + 1);
  });

  state.ids.forEach((id) => {
    const itemGroup = state.entities[id];
    if (!itemGroup) {
      return;
    }

    const childGroups = childCountByParent.get(itemGroup.name) ?? 0;
    itemGroup.children_count = childGroups;
    itemGroup.dependency_counts = {
      child_groups: childGroups,
      linked_items: itemGroup.dependency_counts?.linked_items ?? 0
    };
  });

  syncTreeData(state);
};

export const fetchItemGroups = createAsyncThunk<ItemGroupDocument[], void, { rejectValue: string }>(
  "itemGroups/fetchItemGroups",
  async (_arg, thunkApi) => {
    try {
      const rows = await fetchAllFrappePages<ItemGroupResourceRecord>({
        url: itemGroupEndpoints.list,
        fields: ["name", "item_group_name", "parent_item_group", "is_group", "modified", "creation"],
        orderBy: "item_group_name asc"
      });

      return rows.map(normalizeGroupRecord);
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch item groups.").message);
    }
  }
);

export const fetchItemGroupDetail = createAsyncThunk<ItemGroupDocument, string, { rejectValue: string }>(
  "itemGroups/fetchItemGroupDetail",
  async (itemGroupName, thunkApi) => {
    try {
      const payload = await apiRequest<FrappeDocumentPayload<ItemGroupResourceRecord>>({
        url: itemGroupEndpoints.detail(itemGroupName),
        method: "GET",
        params: {
          fields: encodeFrappeJson([
            "name",
            "item_group_name",
            "parent_item_group",
            "is_group",
            "modified",
            "creation",
            "image",
            "description"
          ])
        }
      });

      return normalizeGroupRecord(payload.data);
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch item group details.").message);
    }
  }
);

export const createItemGroup = createAsyncThunk<ItemGroupDocument, ItemGroupMutationPayload, { rejectValue: string }>(
  "itemGroups/createItemGroup",
  async (values, thunkApi) => {
    try {
      const payload = await apiRequest<FrappeDocumentPayload<ItemGroupResourceRecord>>({
        url: itemGroupEndpoints.list,
        method: "POST",
        data: values
      });

      return normalizeGroupRecord(payload.data);
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to create item group.").message);
    }
  }
);

export const updateItemGroup = createAsyncThunk<
  ItemGroupDocument,
  { itemGroup: string; values: ItemGroupMutationPayload },
  { rejectValue: string }
>(
  "itemGroups/updateItemGroup",
  async ({ itemGroup, values }, thunkApi) => {
    try {
      const payload = await apiRequest<FrappeDocumentPayload<ItemGroupResourceRecord>>({
        url: itemGroupEndpoints.detail(itemGroup),
        method: "PUT",
        data: values
      });

      return normalizeGroupRecord(payload.data);
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to update item group.").message);
    }
  }
);

export const deleteItemGroup = createAsyncThunk<string, string, { rejectValue: string }>(
  "itemGroups/deleteItemGroup",
  async (itemGroup, thunkApi) => {
    try {
      await apiRequest({
        url: itemGroupEndpoints.detail(itemGroup),
        method: "DELETE"
      });

      return itemGroup;
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to delete item group.").message);
    }
  }
);

const itemGroupSlice = createSlice({
  name: "itemGroups",
  initialState,
  reducers: {
    setSelectedGroup(state, action: PayloadAction<string | undefined>) {
      state.selectedGroup = action.payload;
    },
    clearItemGroupError(state) {
      state.error = null;
    },
    optimisticRenameItemGroup(
      state,
      action: PayloadAction<{ itemGroup: string; item_group_name: string }>
    ) {
      const target = state.entities[action.payload.itemGroup];
      if (!target) {
        return;
      }

      target.item_group_name = action.payload.item_group_name;
      refreshDerivedMetadata(state);
    },
    rollbackRenameItemGroup(
      state,
      action: PayloadAction<{ itemGroup: string; item_group_name: string }>
    ) {
      const target = state.entities[action.payload.itemGroup];
      if (!target) {
        return;
      }

      target.item_group_name = action.payload.item_group_name;
      refreshDerivedMetadata(state);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItemGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        itemGroupAdapter.setAll(state, action.payload);
        refreshDerivedMetadata(state);
      })
      .addCase(fetchItemGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to fetch item groups.";
      })
      .addCase(fetchItemGroupDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchItemGroupDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        itemGroupAdapter.upsertOne(state, action.payload);
        refreshDerivedMetadata(state);
      })
      .addCase(fetchItemGroupDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload ?? "Unable to fetch item group details.";
      })
      .addCase(createItemGroup.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createItemGroup.fulfilled, (state, action) => {
        state.mutationLoading = false;
        itemGroupAdapter.addOne(state, action.payload);
        state.selectedGroup = action.payload.name;
        refreshDerivedMetadata(state);
      })
      .addCase(createItemGroup.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload ?? "Unable to create item group.";
      })
      .addCase(updateItemGroup.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateItemGroup.fulfilled, (state, action) => {
        state.mutationLoading = false;
        itemGroupAdapter.upsertOne(state, action.payload);
        state.selectedGroup = action.payload.name;
        refreshDerivedMetadata(state);
      })
      .addCase(updateItemGroup.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload ?? "Unable to update item group.";
      })
      .addCase(deleteItemGroup.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteItemGroup.fulfilled, (state, action) => {
        state.mutationLoading = false;
        itemGroupAdapter.removeOne(state, action.payload);
        if (state.selectedGroup === action.payload) {
          state.selectedGroup = undefined;
        }
        refreshDerivedMetadata(state);
      })
      .addCase(deleteItemGroup.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload ?? "Unable to delete item group.";
      });
  }
});

export const {
  clearItemGroupError,
  optimisticRenameItemGroup,
  rollbackRenameItemGroup,
  setSelectedGroup
} = itemGroupSlice.actions;

const adapterSelectors = itemGroupAdapter.getSelectors<RootState>((state) => state.itemGroups);

export const selectItemGroupState = (state: RootState) => state.itemGroups;
export const selectAllItemGroups = adapterSelectors.selectAll;
export const selectItemGroupEntities = adapterSelectors.selectEntities;
export const selectSelectedGroupId = (state: RootState) => state.itemGroups.selectedGroup;
export const selectSelectedItemGroup = createSelector(
  [selectItemGroupEntities, selectSelectedGroupId],
  (entities, selectedGroupId) => (selectedGroupId ? entities[selectedGroupId] : undefined)
);

export const selectItemGroupTree = createSelector([selectAllItemGroups], (itemGroups): ItemGroupTreeNode[] => {
  const byParent = new Map<string | null, ItemGroupDocument[]>();

  itemGroups.forEach((itemGroup) => {
    const key = itemGroup.parent_item_group || null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(itemGroup);
    byParent.set(key, bucket);
  });

  const buildNodes = (parentName: string | null): ItemGroupTreeNode[] =>
    (byParent.get(parentName) ?? [])
      .slice()
      .sort((left, right) => left.item_group_name.localeCompare(right.item_group_name))
      .map((itemGroup) => {
        const children = buildNodes(itemGroup.name);

        return {
          ...itemGroup,
          children_count: children.length,
          dependency_counts: {
            child_groups: children.length,
            linked_items: 0
          },
          item_count: 0,
          children
        };
      });

  return buildNodes(null);
});

export const selectItemGroupOptions = createSelector([selectAllItemGroups], (itemGroups): LookupOption[] =>
  itemGroups
    .slice()
    .sort((left, right) => left.item_group_name.localeCompare(right.item_group_name))
    .map((itemGroup) => ({
      value: itemGroup.name,
      label: itemGroup.item_group_name
    }))
);

export const selectItemGroupParentOptions = createSelector(
  [selectAllItemGroups, (_state: RootState, currentGroup?: string) => currentGroup],
  (itemGroups, currentGroup): LookupOption[] => {
    if (!currentGroup) {
      return itemGroups
        .slice()
        .sort((left, right) => left.item_group_name.localeCompare(right.item_group_name))
        .map((itemGroup) => ({
          value: itemGroup.name,
          label: itemGroup.item_group_name
        }));
    }

    const childrenByParent = new Map<string, string[]>();
    itemGroups.forEach((itemGroup) => {
      if (!itemGroup.parent_item_group) {
        return;
      }

      const bucket = childrenByParent.get(itemGroup.parent_item_group) ?? [];
      bucket.push(itemGroup.name);
      childrenByParent.set(itemGroup.parent_item_group, bucket);
    });

    const excluded = new Set<string>([currentGroup]);
    const queue = [currentGroup];

    while (queue.length) {
      const next = queue.shift();
      if (!next) {
        continue;
      }

      (childrenByParent.get(next) ?? []).forEach((child) => {
        if (!excluded.has(child)) {
          excluded.add(child);
          queue.push(child);
        }
      });
    }

    return itemGroups
      .filter((itemGroup) => !excluded.has(itemGroup.name))
      .sort((left, right) => left.item_group_name.localeCompare(right.item_group_name))
      .map((itemGroup) => ({
        value: itemGroup.name,
        label: itemGroup.item_group_name
      }));
  }
);

export default itemGroupSlice.reducer;
