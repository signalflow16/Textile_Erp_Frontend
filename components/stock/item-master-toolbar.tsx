"use client";

import { PlusOutlined, RedoOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Segmented, Space } from "antd";

import { frappeApi } from "@/store/api/frappeApi";
import { useAppDispatch } from "@/store/hooks";

export function ItemMasterToolbar() {
  const dispatch = useAppDispatch();

  const onRefresh = () => {
    dispatch(frappeApi.util.invalidateTags(["ItemList", "Lookups"]));
  };

  return (
    <div className="item-toolbar">
      <div className="item-toolbar-left">
        <Segmented
          value="list"
          options={[
            {
              label: (
                <Space size={6}>
                  <UnorderedListOutlined />
                  <span>List View</span>
                </Space>
              ),
              value: "list"
            }
          ]}
        />
      </div>
      <Space size="middle">
        <Button
          size="middle"
          type="text"
          aria-label="Refresh items"
          icon={<RedoOutlined />}
          onClick={onRefresh}
        />
        <Button type="primary" size="middle" icon={<PlusOutlined />} href="/stock/items/new">
          Add Item
        </Button>
      </Space>
    </div>
  );
}
