"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  deleteWarehouse,
  fetchWarehouseDetail,
  fetchWarehouseLookups,
  fetchWarehouses,
  selectSelectedWarehouse,
  selectWarehouseCompanies,
  selectWarehouseState,
  selectWarehouseTree,
  setSelectedWarehouse
} from "@/store/slices/warehouseSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { WarehouseNode } from "@/types/master-data";

const collectKeys = (nodes: WarehouseNode[]): string[] =>
  nodes.flatMap((node) => [node.key, ...collectKeys(node.children ?? [])]);

const filterTree = (nodes: WarehouseNode[], search: string): WarehouseNode[] => {
  const query = search.trim().toLowerCase();
  if (!query) {
    return nodes;
  }

  return nodes
    .map((node) => ({
      ...node,
      children: filterTree(node.children ?? [], query)
    }))
    .filter((node) => node.title.toLowerCase().includes(query) || node.children.length > 0);
};

export function useWarehouseWorkspace(defaultSelectedWarehouse?: string) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { message } = App.useApp();
  const didInitializeExpandedKeys = useRef(false);

  const warehouseState = useAppSelector(selectWarehouseState);
  const selectedWarehouse = useAppSelector(selectSelectedWarehouse);
  const companies = useAppSelector(selectWarehouseCompanies);
  const tree = useAppSelector(selectWarehouseTree);

  const [search, setSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    if (warehouseState.fetchStatus === "idle") {
      void dispatch(fetchWarehouses());
    }

    if (warehouseState.lookupStatus === "idle") {
      void dispatch(fetchWarehouseLookups());
    }
  }, [dispatch, warehouseState.fetchStatus, warehouseState.lookupStatus]);

  useEffect(() => {
    if (defaultSelectedWarehouse) {
      dispatch(setSelectedWarehouse(defaultSelectedWarehouse));
      void dispatch(fetchWarehouseDetail(defaultSelectedWarehouse));
    }
  }, [defaultSelectedWarehouse, dispatch]);

  useEffect(() => {
    if (warehouseState.selectedWarehouse) {
      void dispatch(fetchWarehouseDetail(warehouseState.selectedWarehouse));
    }
  }, [dispatch, warehouseState.selectedWarehouse]);

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

  return {
    loading: warehouseState.fetchStatus === "loading",
    detailLoading: warehouseState.detailStatus === "loading",
    mutationLoading: warehouseState.createStatus === "loading" || warehouseState.updateStatus === "loading",
    error: warehouseState.error,
    selectedWarehouse: warehouseState.selectedWarehouse,
    warehouse: selectedWarehouse,
    companies,
    tree: filteredTree,
    search,
    expandedKeys,
    setSearch,
    setExpandedKeys,
    setSelectedWarehouse: (warehouse?: string) => dispatch(setSelectedWarehouse(warehouse)),
    goToEdit: (warehouse: string) => router.push(`/stock/warehouses/${encodeURIComponent(warehouse)}/edit`),
    goToCreate: (parent?: string) =>
      router.push(parent ? `/stock/warehouses/create?parent=${encodeURIComponent(parent)}` : "/stock/warehouses/create"),
    deleteWarehouse: async (warehouse: string) => {
      try {
        await dispatch(deleteWarehouse(warehouse)).unwrap();
        message.success("Warehouse deleted successfully.");
      } catch (error) {
        message.error(typeof error === "string" ? error : "Unable to delete warehouse.");
      }
    },
    expandAll: () => setExpandedKeys(allKeys),
    collapseAll: () => setExpandedKeys([]),
    clearTreeState: () => {
      setSearch("");
      dispatch(setSelectedWarehouse(undefined));
      setExpandedKeys(rootKeys);
    }
  };
}
