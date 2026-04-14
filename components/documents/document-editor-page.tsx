"use client";

import { useMemo } from "react";
import { Alert, App, Card, Form, Input, Select } from "antd";
import { useRouter } from "next/navigation";

import { ActionFooter } from "@/components/documents/action-footer";
import { AuditTimeline } from "@/components/documents/audit-timeline";
import { DocumentFormLayout } from "@/components/documents/document-form-layout";
import { ItemsTableEditable } from "@/components/documents/items-table-editable";
import { SummarySidebar } from "@/components/documents/summary-sidebar";
import { useDocument } from "@/hooks/useDocument";
import type { DocumentEngineConfig } from "@/types/document-engine";

export function DocumentEditorPage({
  doctype,
  name
}: {
  doctype: DocumentEngineConfig["doctype"];
  name: string;
}) {
  const router = useRouter();
  const { notification } = App.useApp();
  const model = useDocument({ doctype, name });

  const priceListField = model.config.priceListField;
  const partyLabel = useMemo(
    () => (model.config.partyField === "supplier" ? "Supplier" : "Customer"),
    [model.config.partyField]
  );

  if (!model.document) {
    return <Card loading />;
  }

  const hasStockIssues = model.validations.some((entry) => !entry.ok);

  return (
    <DocumentFormLayout
      main={
        <div className="page-stack">
          {model.commands.saveError ? <Alert type="error" showIcon message={model.commands.saveError} /> : null}
          {model.commands.submitError ? <Alert type="error" showIcon message={model.commands.submitError} /> : null}
          <Card title={`${model.config.title} Workspace`} className="document-workspace-card">
            <div className="document-form-grid document-form-grid-split">
              <Form layout="vertical" requiredMark={false}>
                <Form.Item label={partyLabel}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    disabled={model.isReadonly}
                    options={model.lookups.parties}
                    value={model.document.party ?? undefined}
                    onChange={(value) => model.setField("party", value)}
                  />
                </Form.Item>
                <Form.Item label="Posting Date">
                  <Input
                    type="date"
                    disabled={model.isReadonly}
                    value={model.document.posting_date ?? ""}
                    onChange={(event) => model.setField("posting_date", event.target.value)}
                  />
                </Form.Item>
                <Form.Item label="Posting Time">
                  <Input
                    type="time"
                    disabled={model.isReadonly}
                    value={model.document.posting_time ?? ""}
                    onChange={(event) => model.setField("posting_time", event.target.value)}
                  />
                </Form.Item>
                <Form.Item label="Default Warehouse">
                  <Select
                    showSearch
                    allowClear
                    disabled={model.isReadonly}
                    optionFilterProp="label"
                    options={model.lookups.warehouses}
                    value={model.document.set_warehouse ?? undefined}
                    onChange={(value) => model.setField("set_warehouse", value ?? null)}
                  />
                </Form.Item>
                <Form.Item label="Price List">
                  <Select
                    showSearch
                    allowClear
                    disabled={model.isReadonly}
                    optionFilterProp="label"
                    options={model.lookups.priceLists}
                    value={(priceListField === "buying_price_list" ? model.document.buying_price_list : model.document.selling_price_list) ?? undefined}
                    onChange={(value) => model.setField(priceListField, value ?? null)}
                  />
                </Form.Item>
                <Form.Item label="Remarks">
                  <Input.TextArea
                    rows={3}
                    disabled={model.isReadonly}
                    value={model.document.remarks ?? ""}
                    onChange={(event) => model.setField("remarks", event.target.value)}
                  />
                </Form.Item>
              </Form>
            </div>
          </Card>

          <Card title="Items" className="document-items-card">
            <ItemsTableEditable
              config={model.config}
              rows={model.document.items ?? []}
              validations={model.validations}
              lookups={model.lookups}
              readonly={model.isReadonly}
              onRowChange={model.updateRow}
              onAddRow={model.addRow}
              onRemoveRow={model.removeRow}
            />
          </Card>
        </div>
      }
      side={
        <div className="document-support-grid">
          <div className="document-support-card">
            <SummarySidebar
              document={model.document}
              partyLabel={partyLabel}
              total={model.totals.total}
              taxTotal={model.totals.taxTotal}
              grandTotal={model.totals.grandTotal}
            />
          </div>
          <div className="document-support-card">
            <AuditTimeline document={model.document} />
          </div>
        </div>
      }
      footer={
        <ActionFooter
          readonly={model.isReadonly}
          canCancel={model.document.docstatus === 1}
          disableSubmit={hasStockIssues}
          loading={model.commands.saveStatus === "loading" || model.commands.submitStatus === "loading"}
          onSave={() => {
            void model.save().then((saved) => {
              if (saved?.document.name && saved.document.name !== name && name.startsWith("__draft__")) {
                router.replace(`${model.config.routeBase}/${saved.document.name}`);
              }
              notification.success({ message: `${model.config.title} saved.` });
            }).catch((error: unknown) => {
              notification.error({ message: typeof error === "string" ? error : `Unable to save ${model.config.title}.` });
            });
          }}
          onSubmit={() => {
            void model.submit().then((saved) => {
              if (saved?.document.name) {
                router.replace(`${model.config.routeBase}/${saved.document.name}`);
              }
              notification.success({ message: `${model.config.title} submitted.` });
            }).catch((error: unknown) => {
              notification.error({ message: typeof error === "string" ? error : `Unable to submit ${model.config.title}.` });
            });
          }}
          onCancel={() => {
            void model.cancel().then(() => {
              notification.success({ message: `${model.config.title} cancelled.` });
            }).catch((error: unknown) => {
              notification.error({ message: typeof error === "string" ? error : `Unable to cancel ${model.config.title}.` });
            });
          }}
        />
      }
    />
  );
}
