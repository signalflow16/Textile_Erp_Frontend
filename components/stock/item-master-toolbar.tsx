"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { PlusOutlined, ReloadOutlined, SearchOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Input, Segmented, Space } from "antd";

import { frappeApi } from "@/store/api/frappeApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSearch } from "@/store/features/items/itemsUiSlice";

export function ItemMasterToolbar() {
  const dispatch = useAppDispatch();
  const search = useAppSelector((state) => state.itemsUi.search);
  const [inputValue, setInputValue] = useState(search);
  const deferredSearch = useDeferredValue(inputValue);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  useEffect(() => {
    if (deferredSearch !== search) {
      dispatch(setSearch(deferredSearch));
    }
  }, [deferredSearch, dispatch, search]);

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
        <Input
          allowClear
          className="item-toolbar-search"
          prefix={<SearchOutlined />}
          placeholder="Search by item name or item code"
          size="large"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
        />
      </div>
      <Space size="middle">
        <Button icon={<ReloadOutlined />} size="large" onClick={onRefresh}>
          Refresh
        </Button>
        <Button type="primary" size="large" icon={<PlusOutlined />} href="/stock/items/new">
          Add Item
        </Button>
      </Space>
    </div>
  );
}
