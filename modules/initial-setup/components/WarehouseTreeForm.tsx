"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Form, Input, Space, Typography } from "antd";
import type { FormListFieldData } from "antd/es/form";

import { useSetupWarehouses } from "@/modules/initial-setup/hooks/useSetupWarehouses";
import { warehouseSchema } from "@/modules/initial-setup/schemas/warehouseSchema";
import type { SetupSectionStatus, WarehouseFormValues } from "@/modules/initial-setup/types/initialSetup";
import { normalizeSetupApiError, normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";
import { mapWarehousePayload } from "@/modules/initial-setup/utils/payloadMappers";
import { toUiStatus } from "@/modules/initial-setup/utils/statusMapper";
import { SetupSectionCard } from "@/modules/initial-setup/components/SetupSectionCard";

const { Text } = Typography;

function WarehouseNodeEditor({
  field,
  remove,
  path
}: {
  field: FormListFieldData;
  remove: (index: number) => void;
  path: (string | number)[];
}) {
  return (
    <Card size="small" className="setup-nested-card">
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
          <Form.Item
            label="Warehouse Name"
            name={[...path, "warehouse_name"]}
            rules={warehouseSchema.warehouseNameRules}
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Input placeholder="Main Godown" />
          </Form.Item>
          <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
            Remove
          </Button>
        </Space>

        <Form.List name={[...path, "children"]}>
          {(childFields, { add: addChild, remove: removeChild }) => (
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                <Text type="secondary">Child Warehouses</Text>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => addChild({ warehouse_name: "", children: [] })}>
                  Add Child
                </Button>
              </Space>

              {childFields.map((childField) => (
                <WarehouseNodeEditor
                  key={childField.key}
                  field={childField}
                  remove={removeChild}
                  path={[...path, "children", childField.name]}
                />
              ))}
            </Space>
          )}
        </Form.List>
      </Space>
    </Card>
  );
}

export function WarehouseTreeForm({
  initialValues,
  status,
  onValuesChange,
  onSuccess
}: {
  initialValues: WarehouseFormValues;
  status?: SetupSectionStatus;
  onValuesChange: (values: WarehouseFormValues) => void;
  onSuccess: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<WarehouseFormValues>();
  const { submit, isLoading, error } = useSetupWarehouses();

  const requestError = error ? normalizeSetupApiError(error, "Unable to setup warehouses.") : null;

  const handleSubmit = async (values: WarehouseFormValues) => {
    try {
      const response = await submit(mapWarehousePayload(values));
      const setupError = normalizeSetupEnvelopeError(response, "Unable to setup warehouses.");
      if (setupError) {
        message.error(`${setupError.code ? `[${setupError.code}] ` : ""}${setupError.message}`);
        return;
      }

      message.success(response.message || "Warehouse setup completed.");
      await onSuccess();
    } catch (requestErrorValue) {
      const normalized = normalizeSetupApiError(requestErrorValue, "Unable to setup warehouses.");
      message.error(normalized.message);
    }
  };

  return (
    <SetupSectionCard title="Warehouses" status={toUiStatus(status?.status ?? status?.code)} message={status?.message}>
      {requestError ? (
        <Alert
          type={requestError.isUnauthorized || requestError.isForbidden ? "warning" : "error"}
          showIcon
          message={requestError.title}
          description={`${requestError.code ? `[${requestError.code}] ` : ""}${requestError.message}`}
        />
      ) : null}

      <Form<WarehouseFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
        onValuesChange={(_, values) => onValuesChange(values)}
        onFinish={handleSubmit}
      >
        <Form.Item label="Company" name="company" rules={warehouseSchema.companyRules}>
          <Input placeholder="ABC Textiles" />
        </Form.Item>

        <Form.List name="warehouses">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                <Text strong>Warehouse Tree</Text>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ warehouse_name: "", children: [] })}>
                  Add Root Warehouse
                </Button>
              </Space>

              {fields.map((field) => (
                <WarehouseNodeEditor
                  key={field.key}
                  field={field}
                  remove={remove}
                  path={["warehouses", field.name]}
                />
              ))}
            </Space>
          )}
        </Form.List>

        <Space>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save Warehouses
          </Button>
        </Space>
      </Form>
    </SetupSectionCard>
  );
}