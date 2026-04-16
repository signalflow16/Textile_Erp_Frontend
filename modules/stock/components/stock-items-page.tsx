"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { App, Button, Form, Input, Select, Space, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { FormModal } from "@/components/common/form-modal";
import { ItemCreateForm } from "@/components/forms/item-create-form";
import { DataTable } from "@/components/tables/data-table";
import {
  createItem,
  fetchItemLookups,
  fetchItems,
  selectAllItems,
  selectItemFieldAvailability,
  selectItemLookups,
  selectItemsState
} from "@/modules/stock/store/itemsSlice";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";
import type { ItemCreateValues, ItemMasterRow } from "@/modules/stock/types/master-data";

const { Text } = Typography;

export function StockItemsPage() {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const [form] = Form.useForm<ItemCreateValues>();
  const [searchText, setSearchText] = useState("");
  const [itemGroup, setItemGroup] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [itemCodeValidating, setItemCodeValidating] = useState(false);
  const deferredSearch = useDeferredValue(searchText);

  const items = useAppSelector(selectAllItems);
  const lookups = useAppSelector(selectItemLookups);
  const fieldAvailability = useAppSelector(selectItemFieldAvailability);
  const itemsState = useAppSelector(selectItemsState);

  useEffect(() => {
    if (itemsState.lookupsStatus === "idle") {
      void dispatch(fetchItemLookups());
    }
  }, [dispatch, itemsState.lookupsStatus]);

  useEffect(() => {
    if (itemsState.pagination.current !== 1) {
      return;
    }

    void dispatch(
      fetchItems({
        search: deferredSearch,
        itemGroup,
        page: itemsState.pagination.current,
        pageSize: itemsState.pagination.pageSize
      })
    );
  }, [deferredSearch, dispatch, itemGroup, itemsState.pagination.current, itemsState.pagination.pageSize]);

  useEffect(() => {
    if (itemsState.pagination.current === 1) {
      return;
    }

    void dispatch(
      fetchItems({
        search: deferredSearch,
        itemGroup,
        page: 1,
        pageSize: itemsState.pagination.pageSize
      })
    );
  }, [deferredSearch, dispatch, itemGroup, itemsState.pagination.current, itemsState.pagination.pageSize]);

  const columns = useMemo<ColumnsType<ItemMasterRow>>(
    () => [
      {
        title: "Item",
        dataIndex: "item_name",
        key: "item_name",
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.item_name || record.item_code}</Text>
            <Text type="secondary">{record.item_code}</Text>
          </Space>
        )
      },
      {
        title: "Item Group",
        dataIndex: "item_group",
        key: "item_group"
      },
      {
        title: "Unit",
        dataIndex: "stock_uom",
        key: "stock_uom",
        width: 110
      },
      {
        title: "Status",
        dataIndex: "disabled",
        key: "disabled",
        width: 120,
        render: (value) => (
          <Tag color={value ? "default" : "blue"} bordered={false}>
            {value ? "Disabled" : "Active"}
          </Tag>
        )
      },
      {
        title: "Modified",
        dataIndex: "modified",
        key: "modified",
        width: 180,
        render: (value) => <Text type="secondary">{value || "-"}</Text>
      }
    ],
    []
  );

  const handleCreate = async () => {
    try {
      if (itemCodeValidating || form.isFieldValidating("item_code")) {
        return;
      }

      const values = await form.validateFields();
      await dispatch(createItem(values)).unwrap();
      message.success("Item created successfully.");
      form.resetFields();
      setModalOpen(false);
      setItemCodeValidating(false);
    } catch (error) {
      if (typeof error === "object" && error && "errorFields" in error) {
        return;
      }

      message.error(typeof error === "string" ? error : "Unable to create item.");
    }
  };

  return (
    <div className="page-stack">
      <div className="master-toolbar">
        <div>
          <Text className="item-toolbar-title">Stock Master Data</Text>
          <Text className="item-toolbar-subtitle">
            Manage core stock items with standard Frappe resources and textile-friendly UI helpers.
          </Text>
        </div>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          Create Item
        </Button>
      </div>

      <div className="master-filter-bar">
        <Input
          allowClear
          value={searchText}
          placeholder="Search by item code or item name"
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Select
          allowClear
          value={itemGroup}
          options={lookups.itemGroups}
          placeholder="Filter by item group"
          onChange={(value) => setItemGroup(value)}
        />
      </div>

      <div className="master-summary-bar">
        <Space>
          <Tag color="processing" bordered={false}>
            {itemsState.pagination.total} items
          </Tag>
          <Text type="secondary">Live stock item records from your ERP workspace.</Text>
        </Space>
      </div>

      <div className="item-list-card">
        <DataTable
          rowKey={(record) => record.name}
          columns={columns}
          dataSource={items}
          loading={itemsState.fetchStatus === "loading"}
          pagination={{
            current: itemsState.pagination.current,
            pageSize: itemsState.pagination.pageSize,
            total: itemsState.pagination.total,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100].map(String)
          }}
          onChange={(pagination) => {
            void dispatch(
              fetchItems({
                search: deferredSearch,
                itemGroup,
                page: pagination.current ?? 1,
                pageSize: pagination.pageSize ?? 20
              })
            );
          }}
        />
      </div>

      <FormModal
        open={modalOpen}
        title="Create Item"
        onCancel={() => {
          form.resetFields();
          setModalOpen(false);
          setItemCodeValidating(false);
        }}
        onOk={handleCreate}
        okText="Create Item"
        confirmLoading={itemsState.createStatus === "loading"}
        okButtonProps={{ disabled: itemCodeValidating }}
      >
        <ItemCreateForm
          form={form}
          lookups={lookups}
          fieldAvailability={fieldAvailability}
          onItemCodeValidationChange={setItemCodeValidating}
        />
      </FormModal>
    </div>
  );
}

