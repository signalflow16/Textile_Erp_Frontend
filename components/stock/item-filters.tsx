"use client";

import { useEffect, useState } from "react";
import { Button, Divider, Input, Modal, Select, Space, Tag, Typography } from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetItemLookupsQuery } from "@/store/api/frappeApi";
import {
  resetFilters,
  setDisabled,
  setHasVariants,
  setItemCode,
  setItemGroup,
  setItemName,
  setVariantOf
} from "@/store/features/items/itemsUiSlice";
import type { ItemsUiState } from "@/store/features/items/itemsUiSlice";

const { Text } = Typography;

type ItemFiltersProps = {
  open: boolean;
  onClose: () => void;
};

type FilterDraft = Pick<
  ItemsUiState,
  "itemCode" | "itemName" | "itemGroup" | "variantOf" | "hasVariants" | "disabled"
>;

const initialDraft: FilterDraft = {
  itemCode: "",
  itemName: "",
  itemGroup: undefined,
  variantOf: "",
  hasVariants: "all",
  disabled: "all"
};

export function ItemFilters({ open, onClose }: ItemFiltersProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.itemsUi);
  const { data } = useGetItemLookupsQuery();
  const [draft, setDraft] = useState<FilterDraft>(initialDraft);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft({
      itemCode: filters.itemCode,
      itemName: filters.itemName,
      itemGroup: filters.itemGroup,
      variantOf: filters.variantOf,
      hasVariants: filters.hasVariants,
      disabled: filters.disabled
    });
  }, [filters, open]);

  const applyFilters = () => {
    dispatch(setItemCode(draft.itemCode));
    dispatch(setItemName(draft.itemName));
    dispatch(setItemGroup(draft.itemGroup));
    dispatch(setVariantOf(draft.variantOf));
    dispatch(setHasVariants(draft.hasVariants));
    dispatch(setDisabled(draft.disabled));
    onClose();
  };

  const clearFilters = () => {
    setDraft(initialDraft);
    dispatch(resetFilters());
  };

  return (
    <Modal
      title={
        <Space size={8}>
          <FilterOutlined />
          <span>Filter Items</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={760}
      className="item-filter-modal"
      footer={[
        <Button key="clear" icon={<ReloadOutlined />} onClick={clearFilters}>
          Clear Filters
        </Button>,
        <Button key="apply" type="primary" onClick={applyFilters}>
          Apply Filters
        </Button>
      ]}
    >
      <div className="item-filter-modal-grid">
        <Input
          allowClear
          placeholder="ID"
          value={draft.itemCode}
          onChange={(event) => setDraft((prev) => ({ ...prev, itemCode: event.target.value }))}
        />
        <Input
          allowClear
          placeholder="Item Name"
          value={draft.itemName}
          onChange={(event) => setDraft((prev) => ({ ...prev, itemName: event.target.value }))}
        />
        <Select
          allowClear
          placeholder="Item Group"
          value={draft.itemGroup}
          options={data?.item_groups ?? []}
          onChange={(value) => setDraft((prev) => ({ ...prev, itemGroup: value }))}
        />
        <Input
          allowClear
          placeholder="Variant Of"
          value={draft.variantOf}
          onChange={(event) => setDraft((prev) => ({ ...prev, variantOf: event.target.value }))}
        />
        <Select
          value={draft.hasVariants}
          onChange={(value) => setDraft((prev) => ({ ...prev, hasVariants: value }))}
          options={[
            { label: "Has Variants: All", value: "all" },
            { label: "Has Variants: Yes", value: "1" },
            { label: "Has Variants: No", value: "0" }
          ]}
        />
        <Select
          value={draft.disabled}
          onChange={(value) => setDraft((prev) => ({ ...prev, disabled: value }))}
          options={[
            { label: "Status: All", value: "all" },
            { label: "Status: Enabled", value: "0" },
            { label: "Status: Disabled", value: "1" }
          ]}
        />
      </div>

      <Divider style={{ margin: "14px 0" }} />

      <Text className="item-filter-panel-subtitle">Quick Item Groups</Text>
      <div className="item-group-tags">
        {(data?.item_groups ?? []).slice(0, 10).map((group) => (
          <Tag
            key={group.value}
            className={draft.itemGroup === group.value ? "active-tag" : ""}
            onClick={() => {
              setDraft((prev) => ({
                ...prev,
                itemGroup: prev.itemGroup === group.value ? undefined : group.value
              }));
            }}
          >
            {group.label}
          </Tag>
        ))}
      </div>

      <Button
        icon={<ReloadOutlined />}
        type="text"
        style={{ marginTop: 12, paddingInline: 0 }}
        onClick={clearFilters}
      >
        Reset Filters
      </Button>
    </Modal>
  );
}
