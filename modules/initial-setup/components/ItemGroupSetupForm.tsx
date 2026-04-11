"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Form, Input, Space, Typography } from "antd";
import type { FormListFieldData } from "antd/es/form";

import { SetupSectionCard } from "@/modules/initial-setup/components/SetupSectionCard";
import { useSetupItemGroups } from "@/modules/initial-setup/hooks/useSetupItemGroups";
import { itemGroupSchema } from "@/modules/initial-setup/schemas/itemGroupSchema";
import type { ItemGroupFormValues, SetupSectionStatus } from "@/modules/initial-setup/types/initialSetup";
import { normalizeSetupApiError, normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";
import { mapItemGroupPayload } from "@/modules/initial-setup/utils/payloadMappers";
import { toUiStatus } from "@/modules/initial-setup/utils/statusMapper";

const { Text } = Typography;

function ItemGroupNodeEditor({
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
            label="Item Group Name"
            name={[...path, "item_group_name"]}
            rules={itemGroupSchema.itemGroupNameRules}
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Input placeholder="Fabrics" />
          </Form.Item>
          <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
            Remove
          </Button>
        </Space>

        <Form.List name={[...path, "children"]}>
          {(childFields, { add: addChild, remove: removeChild }) => (
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                <Text type="secondary">Child Item Groups</Text>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => addChild({ item_group_name: "", children: [] })}>
                  Add Child
                </Button>
              </Space>

              {childFields.map((childField) => (
                <ItemGroupNodeEditor
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

export function ItemGroupSetupForm({
  initialValues,
  status,
  onValuesChange,
  onSuccess
}: {
  initialValues: ItemGroupFormValues;
  status?: SetupSectionStatus;
  onValuesChange: (values: ItemGroupFormValues) => void;
  onSuccess: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ItemGroupFormValues>();
  const { submit, isLoading, error } = useSetupItemGroups();

  const requestError = error ? normalizeSetupApiError(error, "Unable to setup item groups.") : null;

  const handleSubmit = async (values: ItemGroupFormValues) => {
    try {
      const response = await submit(mapItemGroupPayload(values));
      const setupError = normalizeSetupEnvelopeError(response, "Unable to setup item groups.");
      if (setupError) {
        message.error(`${setupError.code ? `[${setupError.code}] ` : ""}${setupError.message}`);
        return;
      }

      message.success(response.message || "Item group setup completed.");
      await onSuccess();
    } catch (requestErrorValue) {
      const normalized = normalizeSetupApiError(requestErrorValue, "Unable to setup item groups.");
      message.error(normalized.message);
    }
  };

  return (
    <SetupSectionCard title="Item Groups" status={toUiStatus(status?.status ?? status?.code)} message={status?.message}>
      {requestError ? (
        <Alert
          type={requestError.isUnauthorized || requestError.isForbidden ? "warning" : "error"}
          showIcon
          message={requestError.title}
          description={`${requestError.code ? `[${requestError.code}] ` : ""}${requestError.message}`}
        />
      ) : null}

      <Form<ItemGroupFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
        onValuesChange={(_, values) => onValuesChange(values)}
        onFinish={handleSubmit}
      >
        <Form.List name="item_groups">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                <Text strong>Item Group Hierarchy</Text>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ item_group_name: "", children: [] })}>
                  Add Root Group
                </Button>
              </Space>

              {fields.map((field) => (
                <ItemGroupNodeEditor
                  key={field.key}
                  field={field}
                  remove={remove}
                  path={["item_groups", field.name]}
                />
              ))}
            </Space>
          )}
        </Form.List>

        <Space>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save Item Groups
          </Button>
        </Space>
      </Form>
    </SetupSectionCard>
  );
}