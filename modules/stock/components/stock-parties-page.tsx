"use client";

import { useEffect, useMemo, useState } from "react";
import { App, Button, Form, Input, Space, Tabs, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { FormModal } from "@/components/common/form-modal";
import { CustomerCreateForm, SupplierCreateForm } from "@/components/forms/party-create-form";
import { DataTable } from "@/components/tables/data-table";
import {
  createParty,
  fetchCustomers,
  fetchPartyLookups,
  fetchSuppliers,
  selectAllCustomers,
  selectPartyLookups,
  selectAllSuppliers,
  selectPartyState
} from "@/modules/stock/store/partySlice";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";
import type { CustomerCreateValues, CustomerRow, SupplierCreateValues, SupplierRow } from "@/modules/stock/types/master-data";

const { Text } = Typography;

export function StockPartiesPage() {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const [supplierForm] = Form.useForm<SupplierCreateValues>();
  const [customerForm] = Form.useForm<CustomerCreateValues>();
  const [activeTab, setActiveTab] = useState("suppliers");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const suppliers = useAppSelector(selectAllSuppliers);
  const customers = useAppSelector(selectAllCustomers);
  const lookups = useAppSelector(selectPartyLookups);
  const partyState = useAppSelector(selectPartyState);

  useEffect(() => {
    if (partyState.fetchStatus.suppliers === "idle") {
      void dispatch(fetchSuppliers());
    }

    if (partyState.fetchStatus.customers === "idle") {
      void dispatch(fetchCustomers());
    }

    if (partyState.lookupsStatus === "idle") {
      void dispatch(fetchPartyLookups());
    }
  }, [dispatch, partyState.fetchStatus.customers, partyState.fetchStatus.suppliers, partyState.lookupsStatus]);

  const supplierColumns = useMemo<ColumnsType<SupplierRow>>(
    () => [
      {
        title: "Supplier",
        dataIndex: "supplier_name",
        key: "supplier_name",
        render: (value, record) => value || record.name
      },
      { title: "Group", dataIndex: "supplier_group", key: "supplier_group" },
      { title: "Type", dataIndex: "supplier_type", key: "supplier_type" },
      { title: "Mobile", dataIndex: "mobile_no", key: "mobile_no" },
      { title: "Email", dataIndex: "email_id", key: "email_id" }
    ],
    []
  );

  const customerColumns = useMemo<ColumnsType<CustomerRow>>(
    () => [
      {
        title: "Customer",
        dataIndex: "customer_name",
        key: "customer_name",
        render: (value, record) => value || record.name
      },
      { title: "Group", dataIndex: "customer_group", key: "customer_group" },
      { title: "Territory", dataIndex: "territory", key: "territory" },
      { title: "Mobile", dataIndex: "mobile_no", key: "mobile_no" },
      { title: "Email", dataIndex: "email_id", key: "email_id" }
    ],
    []
  );

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter((entry) => {
        const query = search.trim().toLowerCase();
        if (!query) {
          return true;
        }

        return [entry.supplier_name ?? "", entry.name, entry.supplier_group ?? ""].some((value) =>
          value.toLowerCase().includes(query)
        );
      }),
    [search, suppliers]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((entry) => {
        const query = search.trim().toLowerCase();
        if (!query) {
          return true;
        }

        return [entry.customer_name ?? "", entry.name, entry.customer_group ?? "", entry.territory ?? ""].some((value) =>
          value.toLowerCase().includes(query)
        );
      }),
    [customers, search]
  );

  const handleCreate = async () => {
    try {
      if (activeTab === "suppliers") {
        const values = await supplierForm.validateFields();
        await dispatch(createParty({ type: "supplier", values })).unwrap();
        supplierForm.resetFields();
      } else {
        const values = await customerForm.validateFields();
        await dispatch(createParty({ type: "customer", values })).unwrap();
        customerForm.resetFields();
      }

      message.success(`${activeTab === "suppliers" ? "Supplier" : "Customer"} created successfully.`);
      setOpen(false);
    } catch (error) {
      if (typeof error === "object" && error && "errorFields" in error) {
        return;
      }

      message.error(typeof error === "string" ? error : "Unable to create party.");
    }
  };

  return (
    <div className="page-stack">
      <div className="master-filter-bar">
        <Input allowClear value={search} placeholder={`Search ${activeTab}`} onChange={(event) => setSearch(event.target.value)} />
        <Space>
          <Button type="primary" onClick={() => setOpen(true)}>
            Create {activeTab === "suppliers" ? "Supplier" : "Customer"}
          </Button>
          <Tag color="processing" bordered={false}>
            {activeTab === "suppliers" ? filteredSuppliers.length : filteredCustomers.length} records
          </Tag>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "suppliers",
            label: "Suppliers",
            children: (
              <DataTable
                rowKey={(record) => record.name}
                columns={supplierColumns}
                dataSource={filteredSuppliers}
                loading={partyState.fetchStatus.suppliers === "loading"}
              />
            )
          },
          {
            key: "customers",
            label: "Customers",
            children: (
              <DataTable
                rowKey={(record) => record.name}
                columns={customerColumns}
                dataSource={filteredCustomers}
                loading={partyState.fetchStatus.customers === "loading"}
              />
            )
          }
        ]}
      />

      <FormModal
        open={open}
        title={`Create ${activeTab === "suppliers" ? "Supplier" : "Customer"}`}
        onCancel={() => {
          supplierForm.resetFields();
          customerForm.resetFields();
          setOpen(false);
        }}
        onOk={handleCreate}
        okText={`Create ${activeTab === "suppliers" ? "Supplier" : "Customer"}`}
        confirmLoading={
          activeTab === "suppliers"
            ? partyState.createStatus.suppliers === "loading"
            : partyState.createStatus.customers === "loading"
        }
        okButtonProps={{
          disabled:
            partyState.lookupsStatus === "loading" ||
            (activeTab === "suppliers"
              ? lookups.supplierGroups.length === 0
              : lookups.customerGroups.length === 0 || lookups.territories.length === 0)
        }}
      >
        {activeTab === "suppliers" ? (
          <SupplierCreateForm form={supplierForm} supplierGroups={lookups.supplierGroups} />
        ) : (
          <CustomerCreateForm
            form={customerForm}
            customerGroups={lookups.customerGroups}
            territories={lookups.territories}
          />
        )}
      </FormModal>
    </div>
  );
}

