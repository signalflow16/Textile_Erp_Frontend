"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  deleteItemGroup,
  fetchItemGroupDetail,
  fetchItemGroups,
  optimisticRenameItemGroup,
  rollbackRenameItemGroup,
  selectItemGroupState,
  selectItemGroupTree,
  selectSelectedItemGroup,
  setSelectedGroup,
  updateItemGroup
} from "@/store/slices/itemGroupSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { ItemGroupTreeNode } from "@/types/item-group";

const collectKeys = (nodes: ItemGroupTreeNode[]): string[] =>
  nodes.flatMap((node) => [node.name, ...collectKeys(node.children ?? [])]);

const filterTree = (nodes: ItemGroupTreeNode[], search: string): ItemGroupTreeNode[] => {
  const query = search.trim().toLowerCase();
  if (!query) {
    return nodes;
  }

  return nodes
    .map((node) => ({
      ...node,
      children: filterTree(node.children ?? [], query)
    }))
    .filter((node) => node.item_group_name.toLowerCase().includes(query) || node.children.length > 0);
};

export function useItemGroupWorkspace(defaultSelectedGroup?: string) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { message } = App.useApp();

  const itemGroupState = useAppSelector(selectItemGroupState);
  const selectedItemGroup = useAppSelector(selectSelectedItemGroup);
  const tree = useAppSelector(selectItemGroupTree);

  const [search, setSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [renamingGroup, setRenamingGroup] = useState<string | undefined>(undefined);
  const [renameValue, setRenameValue] = useState("");
  const didInitializeExpandedKeys = useRef(false);
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    if (!itemGroupState.initialized && !itemGroupState.loading) {
      void dispatch(fetchItemGroups());
    }
  }, [dispatch, itemGroupState.initialized, itemGroupState.loading]);

  useEffect(() => {
    if (defaultSelectedGroup) {
      dispatch(setSelectedGroup(defaultSelectedGroup));
      void dispatch(fetchItemGroupDetail(defaultSelectedGroup));
    }
  }, [defaultSelectedGroup, dispatch]);

  useEffect(() => {
    if (itemGroupState.selectedGroup) {
      void dispatch(fetchItemGroupDetail(itemGroupState.selectedGroup));
    }
  }, [dispatch, itemGroupState.selectedGroup]);

  const filteredTree = useMemo(() => filterTree(tree, debouncedSearch), [debouncedSearch, tree]);
  const allKeys = useMemo(() => collectKeys(filteredTree), [filteredTree]);
  const rootKeys = useMemo(() => filteredTree.map((node) => node.name), [filteredTree]);

  useEffect(() => {
    if (!didInitializeExpandedKeys.current && allKeys.length) {
      setExpandedKeys(allKeys);
      didInitializeExpandedKeys.current = true;
    }
  }, [allKeys]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      return;
    }

    setExpandedKeys(allKeys);
  }, [allKeys, debouncedSearch]);

  const startRename = (itemGroup: ItemGroupTreeNode) => {
    setRenamingGroup(itemGroup.name);
    setRenameValue(itemGroup.item_group_name);
  };

  const cancelRename = () => {
    setRenamingGroup(undefined);
    setRenameValue("");
  };

  const submitRename = async () => {
    if (!renamingGroup) {
      return;
    }

    const nextName = renameValue.trim();
    const previousName = itemGroupState.entities[renamingGroup]?.item_group_name;

    if (!nextName || !previousName || nextName === previousName) {
      cancelRename();
      return;
    }

    dispatch(optimisticRenameItemGroup({ itemGroup: renamingGroup, item_group_name: nextName }));

    try {
      await dispatch(
        updateItemGroup({
          itemGroup: renamingGroup,
          values: { item_group_name: nextName }
        })
      ).unwrap();
      message.success("Item group renamed successfully.");
      cancelRename();
    } catch (error) {
      dispatch(rollbackRenameItemGroup({ itemGroup: renamingGroup, item_group_name: previousName }));
      message.error(typeof error === "string" ? error : "Unable to rename item group.");
    }
  };

  const handleDelete = async (itemGroup: string) => {
    try {
      await dispatch(deleteItemGroup(itemGroup)).unwrap();
      message.success("Item group deleted successfully.");
    } catch (error) {
      message.error(typeof error === "string" ? error : "Unable to delete item group.");
    }
  };

  return {
    loading: itemGroupState.loading,
    detailLoading: itemGroupState.detailLoading,
    mutationLoading: itemGroupState.mutationLoading,
    error: itemGroupState.error,
    tree: filteredTree,
    selectedGroup: itemGroupState.selectedGroup,
    selectedItemGroup,
    search,
    expandedKeys,
    renamingGroup,
    renameValue,
    setSearch,
    setExpandedKeys,
    setSelectedGroup: (itemGroup?: string) => dispatch(setSelectedGroup(itemGroup)),
    startRename,
    cancelRename,
    setRenameValue,
    submitRename,
    handleDelete,
    goToEdit: (itemGroup: string) => router.push(`/stock/item-groups/${encodeURIComponent(itemGroup)}/edit`),
    goToCreate: (parent?: string) =>
      router.push(parent ? `/stock/item-groups/create?parent=${encodeURIComponent(parent)}` : "/stock/item-groups/create"),
    expandAll: () => setExpandedKeys(allKeys),
    collapseAll: () => setExpandedKeys([]),
    clearTreeState: () => {
      setSearch("");
      dispatch(setSelectedGroup(undefined));
      cancelRename();
      setExpandedKeys(rootKeys);
    }
  };
}
