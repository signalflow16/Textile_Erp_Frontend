"use client";

import { useCallback } from "react";
import { App, Button, Card, Input, Radio, Select, Space, Switch, Tag, Typography } from "antd";

import { extractApiErrorMessage } from "@/lib/api-errors";
import { BillingSummary } from "@/modules/pos/components/BillingSummary";
import { BillPreviewPanel } from "@/modules/pos/components/BillPreviewPanel";
import { CartTable } from "@/modules/pos/components/CartTable";
import { CustomerSelector } from "@/modules/pos/components/CustomerSelector";
import { PaymentSection } from "@/modules/pos/components/PaymentSection";
import { PosHeader } from "@/modules/pos/components/PosHeader";
import { PosPrintButton } from "@/modules/pos/components/PosPrintButton";
import { PosSessionBanner } from "@/modules/pos/components/PosSessionBanner";
import { usePosBilling } from "@/modules/pos/hooks/usePosBilling";
import { usePosCustomerSearch } from "@/modules/pos/hooks/usePosCustomerSearch";
import type { PosSession } from "@/modules/pos/types/pos";

export function PosBillingPage({
  session,
  onRefreshSession,
  onOpenSession,
  onCloseSession
}: {
  session?: PosSession | null;
  onRefreshSession?: () => void;
  onOpenSession?: () => void;
  onCloseSession?: () => void;
}) {
  const { Text } = Typography;
  const { message, modal } = App.useApp();
  const customers = usePosCustomerSearch();
  const billing = usePosBilling({ session });

  const handleSaveDraft = useCallback(async () => {
    try {
      const draft = await billing.saveDraft();
      message.success(`Draft saved${draft.name ? `: ${draft.name}` : "."}`);
    } catch (error) {
      message.error(extractApiErrorMessage(error, "Unable to save draft."));
    }
  }, [billing, message]);

  const handleSaveAndPrint = useCallback(async () => {
    try {
      const invoice = await billing.saveAndPrint();
      message.success(`Bill saved and print preview opened${invoice.name ? `: ${invoice.name}` : "."}`);
    } catch (error) {
      message.error(extractApiErrorMessage(error, "Unable to save and print bill."));
    }
  }, [billing, message]);

  const handleClearCart = useCallback(() => {
    modal.confirm({
      title: "Clear current bill?",
      content: "All unsaved cart rows will be removed.",
      okText: "Clear Cart",
      okButtonProps: { danger: true },
      onOk: billing.clearCart
    });
  }, [billing.clearCart, modal]);

  const isActionBusy = billing.isSaving || billing.isSubmitting || billing.isLoadingDraft;

  if (!session) {
    return (
      <Card>
        <Space direction="vertical" size={8}>
          <Text strong>Start POS session before billing</Text>
          <Text type="secondary">Create a POS Opening Entry to begin billing.</Text>
          <Button type="primary" onClick={onOpenSession}>
            Start Session
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <PosSessionBanner session={session} onRefresh={onRefreshSession} onCloseSession={onCloseSession} />

      <Card>
        <PosHeader
          isSaving={billing.isSaving}
          isSubmitting={billing.isSubmitting}
          currentBillName={billing.activeBillName}
          currentBillStatus={billing.activeBillStatus}
          onSaveDraft={() => {
            void handleSaveDraft();
          }}
          onSavePrint={() => {
            void handleSaveAndPrint();
          }}
        />
      </Card>

      <CustomerSelector
        customer={billing.form.customer}
        customerOptions={customers.customers}
        loading={customers.isLoading || customers.isFetching}
        onCustomerChange={(value) => billing.updateForm({ customer: value })}
      />

      <Card title="Session Controls">
        <div className="pos-payment-grid">
          <div>
            <Text type="secondary">Posting Date</Text>
            <Input
              type="date"
              value={billing.form.posting_date}
              onChange={(event) => billing.updateForm({ posting_date: event.target.value })}
            />
          </div>
          <div>
            <Text type="secondary">Warehouse</Text>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={billing.form.set_warehouse}
              placeholder="Optional default warehouse"
              options={billing.warehouseOptions}
              loading={billing.isWarehousesLoading}
              onChange={(value) => {
                void billing.setWarehouse(value);
              }}
            />
          </div>
          <div>
            <Text type="secondary">Draft Bills</Text>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Resume saved draft"
              value={billing.draftDocName ?? undefined}
              loading={billing.isLoadingDraftList || billing.isLoadingDraft}
              options={billing.draftInvoices.map((draft) => ({
                label: `${draft.value}${draft.customer ? ` - ${draft.customer}` : ""}`,
                value: draft.value
              }))}
              onChange={(value) => {
                if (value) {
                  void billing.loadDraft(value);
                }
              }}
            />
          </div>
          <div>
            <Text type="secondary">Bill Status</Text>
            <div style={{ marginTop: 8 }}>
              {billing.activeBillStatus ? (
                <Tag color={billing.activeBillStatus === "Submitted" ? "green" : "gold"}>
                  {billing.activeBillStatus}
                </Tag>
              ) : (
                <Tag>New Bill</Tag>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Discount Controls">
        <div className="pos-payment-grid">
          <div>
            <Text type="secondary">Enable Discount</Text>
            <div style={{ marginTop: 8 }}>
              <Switch
                checked={billing.form.discount_enabled}
                onChange={(checked) => billing.updateDiscountConfig({ discount_enabled: checked })}
              />
            </div>
          </div>
          <div>
            <Text type="secondary">Discount Mode</Text>
            <div style={{ marginTop: 8 }}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                value={billing.form.discount_mode}
                disabled={!billing.form.discount_enabled}
                options={[
                  { label: "Item-wise", value: "item" },
                  { label: "Overall", value: "overall" },
                  { label: "Both", value: "both" }
                ]}
                onChange={(event) => billing.updateDiscountConfig({ discount_mode: event.target.value })}
              />
            </div>
          </div>
          <div>
            <Text type="secondary">Overall Discount %</Text>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              disabled={!billing.overallDiscountEnabled}
              value={billing.form.overall_discount_percentage}
              onChange={(event) =>
                billing.updateDiscountConfig({
                  overall_discount_percentage: Math.min(Math.max(Number(event.target.value || 0), 0), 100)
                })
              }
            />
          </div>
          <div>
            <Text type="secondary">Calculation Order</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">Item discount first, overall discount second</Tag>
            </div>
          </div>
        </div>
      </Card>

      <Card
        className="pos-square-fields"
        title="Cart"
        extra={
          <Space>
            <Button danger disabled={billing.totals.totalItems <= 0 || isActionBusy} onClick={handleClearCart}>
              Clear Cart
            </Button>
            <PosPrintButton
              disabled={!billing.draftDocName && !billing.lastSubmittedInvoiceName}
              onClick={() => {
                const opened = billing.printBill();
                if (!opened) {
                  message.warning("Save draft or submit bill before opening print preview.");
                }
              }}
            />
          </Space>
        }
      >
        <CartTable
          rows={billing.cartItems}
          discountEnabled={billing.itemDiscountEnabled}
          focusSequence={billing.focusSequence}
          onChangeRow={billing.updateCartItem}
          onRemoveRow={billing.removeCartItem}
          onApplyItem={async (rowId, itemCode) => {
            await billing.applyItemCodeToRow(rowId, itemCode);
          }}
          onApplyBarcode={(rowId, barcode) => billing.applyBarcodeToRow(rowId, barcode)}
        />
      </Card>

      <div className="pos-preview-layout">
        <div className="pos-summary-grid">
          <BillingSummary totals={billing.totals} />
          <PaymentSection
            modeOfPayment={billing.form.mode_of_payment}
            paymentModes={billing.paymentModes}
            paidAmount={billing.paidAmount}
            balanceAmount={billing.balanceAmount}
            remarks={billing.form.remarks}
            onChangeMode={(value) => billing.updateForm({ mode_of_payment: value })}
            onChangePaidAmount={(value) => billing.updateForm({ paid_amount: value })}
            onChangeRemarks={(value) => billing.updateForm({ remarks: value })}
          />
        </div>
        <BillPreviewPanel
          customer={billing.form.customer}
          rows={billing.billableRows}
          totals={billing.totals}
          invoiceName={billing.lastSubmittedInvoiceName ?? billing.draftDocName}
        />
      </div>
    </div>
  );
}
