import { useCallback, useMemo, useState } from "react";

type SaveSubmitOptions<FormValues, Payload, DocResponse> = {
  doctype: string;
  initialDocName?: string;
  initialSubmitted?: boolean;
  createPayloadMapper: (values: FormValues) => Payload;
  updatePayloadMapper?: (values: FormValues) => Payload;
  createDraft: (payload: Payload) => Promise<DocResponse>;
  updateDraft: (name: string, payload: Payload) => Promise<DocResponse>;
  submitDraft: (name: string) => Promise<DocResponse>;
  onSaved?: (doc: DocResponse, action: "create" | "update") => Promise<void> | void;
  onSubmitted?: (doc: DocResponse) => Promise<void> | void;
  onError?: (error: unknown, stage: "save" | "submit") => void;
};

const extractDocName = (doc: unknown): string | null => {
  if (!doc || typeof doc !== "object") {
    return null;
  }

  const name = (doc as { name?: unknown }).name;
  return typeof name === "string" && name.trim() ? name : null;
};

const detectSubmitted = (doc: unknown) => {
  if (!doc || typeof doc !== "object") {
    return false;
  }

  const docstatus = (doc as { docstatus?: unknown }).docstatus;
  if (docstatus === 1) {
    return true;
  }

  const status = (doc as { status?: unknown }).status;
  return typeof status === "string" && status.toLowerCase() === "submitted";
};

export function useDocumentSaveSubmit<FormValues, Payload, DocResponse>(options: SaveSubmitOptions<FormValues, Payload, DocResponse>) {
  const [docName, setDocName] = useState<string | null>(options.initialDocName ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<DocResponse | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(options.initialSubmitted));

  const mapCreatePayload = options.createPayloadMapper;
  const mapUpdatePayload = options.updatePayloadMapper ?? options.createPayloadMapper;

  const persistDraft = useCallback(async (formValues: FormValues, runSavedCallback: boolean) => {
    const isUpdate = Boolean(docName);
    const payload = isUpdate ? mapUpdatePayload(formValues) : mapCreatePayload(formValues);
    const savedDoc = isUpdate
      ? await options.updateDraft(docName as string, payload)
      : await options.createDraft(payload);

    const resolvedName = extractDocName(savedDoc);
    if (resolvedName) {
      setDocName(resolvedName);
    }

    setIsSubmitted(detectSubmitted(savedDoc));
    setLastActionResult(savedDoc);

    if (runSavedCallback && options.onSaved) {
      await options.onSaved(savedDoc, isUpdate ? "update" : "create");
    }

    return savedDoc;
  }, [docName, mapCreatePayload, mapUpdatePayload, options]);

  const handleSaveDraft = useCallback(async (formValues: FormValues) => {
    setIsSaving(true);
    try {
      return await persistDraft(formValues, true);
    } catch (error) {
      options.onError?.(error, "save");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [options, persistDraft]);

  const handleSaveSubmit = useCallback(async (formValues: FormValues) => {
    setIsSubmitting(true);
    try {
      const savedDoc = await persistDraft(formValues, false);
      const finalName = extractDocName(savedDoc) ?? docName;

      if (!finalName) {
        throw new Error(`Unable to submit ${options.doctype}. Document name is missing after save.`);
      }

      const submittedDoc = await options.submitDraft(finalName);
      const submittedName = extractDocName(submittedDoc);
      if (submittedName) {
        setDocName(submittedName);
      }

      setIsSubmitted(true);
      setLastActionResult(submittedDoc);

      if (options.onSubmitted) {
        await options.onSubmitted(submittedDoc);
      }

      return submittedDoc;
    } catch (error) {
      options.onError?.(error, "submit");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [docName, options, persistDraft]);

  const resetState = useCallback(() => {
    setDocName(null);
    setIsSaving(false);
    setIsSubmitting(false);
    setLastActionResult(null);
    setIsSubmitted(false);
  }, []);

  return useMemo(
    () => ({
      docName,
      isSaving,
      isSubmitting,
      handleSaveDraft,
      handleSaveSubmit,
      lastActionResult,
      isSubmitted,
      resetState
    }),
    [docName, isSaving, isSubmitting, handleSaveDraft, handleSaveSubmit, lastActionResult, isSubmitted, resetState]
  );
}
