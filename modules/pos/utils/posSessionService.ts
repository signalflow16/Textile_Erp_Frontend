import { openErpNextPrintPreview } from "@/modules/pos/utils/printBill";
import type { PosClosingEntryPayload, PosInvoiceDoc, PosSession, PosSessionSummary } from "@/modules/pos/types/pos";

export const getActivePosSession = async (loader: () => Promise<PosSession | null>) => loader();

export const createPosOpeningEntry = async (creator: () => Promise<PosSession>) => creator();

export const createOrUpdatePosBillDraft = async (saver: () => Promise<PosInvoiceDoc>) => saver();

export const submitPosBill = async (submitter: () => Promise<PosInvoiceDoc>) => submitter();

export const getSessionSummary = async (loader: () => Promise<PosSessionSummary>) => loader();

export const createPosClosingEntry = async (
  payload: PosClosingEntryPayload,
  closer: (values: PosClosingEntryPayload) => Promise<{ name?: string; status?: string }>
) => closer(payload);

export const openErpnextPrintPreview = (doctype: string, name: string) => {
  openErpNextPrintPreview(doctype, name);
};
