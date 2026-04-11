"use client";

import { useEffect, useMemo } from "react";
import { Alert } from "antd";

import { ItemGroupDetailPanel } from "@/components/stock/item-group-detail-panel";
import { ItemGroupToolbar } from "@/components/stock/item-group-toolbar";
import { ItemGroupTreePanel } from "@/components/stock/item-group-tree-panel";
import {
  frappeApi,
  useGetItemGroupQuery,
  useGetItemGroupTreeQuery
} from "@/store/api/frappeApi";
import { setExpandedKeys, setSelectedItemGroup, setTreeSearch } from "@/store/features/itemGroups/itemGroupsUiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { ItemGroupTreeNode } from "@/types/item-group";

const collectKeys = (nodes: ItemGroupTreeNode[]): string[] =>
  nodes.flatMap((node) => [node.name, ...collectKeys(node.children ?? [])]);

export function ItemGroupWorkspace() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((state) => state.itemGroupsUi);

  const { data: treeData, isFetching: treeLoading, error: treeError } = useGetItemGroupTreeQuery({
    search: ui.treeSearch
  });
  const { data: selectedItemGroup, isFetching: detailLoading, error: detailError } = useGetItemGroupQuery(
    ui.selectedItemGroup ?? "",
    { skip: !ui.selectedItemGroup }
  );

  const allTreeKeys = useMemo(() => collectKeys(treeData?.data ?? []), [treeData?.data]);

  useEffect(() => {
    if (!ui.expandedKeys.length && allTreeKeys.length) {
      dispatch(setExpandedKeys(allTreeKeys));
    }
  }, [allTreeKeys, dispatch, ui.expandedKeys.length]);

  const selectedCountLabel = ui.selectedItemGroup ? `Selected: ${ui.selectedItemGroup}` : "No group selected";

  const onRefresh = () => {
    dispatch(
      frappeApi.util.invalidateTags([
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        ...(ui.selectedItemGroup ? [{ type: "ItemGroupDetail" as const, id: ui.selectedItemGroup }] : [])
      ])
    );
  };

  return (
    <div className="page-stack">
      <ItemGroupToolbar
        totalGroups={allTreeKeys.length}
        selectedCountLabel={selectedCountLabel}
        onRefresh={onRefresh}
      />

      {treeError ? (
        <Alert
          type="error"
          showIcon
          message="Item Group workspace is unavailable"
          description="The Item Group tree could not be loaded from the backend."
        />
      ) : null}

      <ItemGroupTreePanel
        nodes={treeData?.data ?? []}
        isLoading={treeLoading}
        selectedItemGroup={ui.selectedItemGroup}
        search={ui.treeSearch}
        expandedKeys={ui.expandedKeys}
        onSearchChange={(value) => dispatch(setTreeSearch(value))}
        onSelect={(itemGroupName) => dispatch(setSelectedItemGroup(itemGroupName))}
        onExpandedKeysChange={(keys) => dispatch(setExpandedKeys(keys))}
        onExpandAll={() => dispatch(setExpandedKeys(allTreeKeys))}
        onCollapseAll={() => dispatch(setExpandedKeys([]))}
        onViewDetails={(itemGroupName) => dispatch(setSelectedItemGroup(itemGroupName))}
      />

      <div className="item-group-schema-note">
        Standard ERPNext Item Group resources active
      </div>

      <ItemGroupDetailPanel
        open={Boolean(ui.selectedItemGroup)}
        itemGroup={selectedItemGroup}
        isLoading={detailLoading}
        error={Boolean(detailError)}
        onClose={() => dispatch(setSelectedItemGroup(undefined))}
      />
    </div>
  );
}
