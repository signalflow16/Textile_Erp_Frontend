"use client";

import Link from "next/link";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";

import { frappeApi } from "@/core/api/frappeApi";
import { useAppDispatch } from "@/core/store/hooks";

const { Text } = Typography;

export function ItemMasterToolbar() {
  const dispatch = useAppDispatch();

  const onRefresh = () => {
    dispatch(frappeApi.util.invalidateTags(["ItemList", "Lookups"]));
  };

  return (
    <div className="item-toolbar">
      <div className="item-toolbar-copy">
        <Text className="item-toolbar-title">Stock</Text>
        <Text className="item-toolbar-subtitle">
          Manage stock items, templates, and variants from a single operational screen.
        </Text>
      </div>
      <Space size="middle">
        <Button
          size="middle"
          icon={<ReloadOutlined />}
          className="item-toolbar-refresh"
          onClick={onRefresh}
        >
          Refresh
        </Button>
        <Link href="/stock/items/new">
          <Button type="primary" size="middle" icon={<PlusOutlined />} className="item-toolbar-primary">
            Add Item
          </Button>
        </Link>
      </Space>
    </div>
  );
}

