import { useCallback, useRef, useState } from "react";
import type { RagAnswer } from "@cb/rag-core";
import { OnDeviceEngine } from "../rag/onDeviceEngine";
import { remoteAnswer } from "../rag/remoteClient";

export type RagMode = "on-device" | "cloud";

interface RagSearchState {
  loading: boolean;
  answer: RagAnswer | null;
  error: string | null;
}

/**
 * One hook that drives both retrieval paths. The component never branches on
 * mode beyond passing it in — the hook routes to the on-device engine or the
 * remote client and normalizes the result into the same `RagAnswer` shape, so
 * the UI renders identically regardless of where the answer came from.
 */
export function useRagSearch() {
  const [state, setState] = useState<RagSearchState>({ loading: false, answer: null, error: null });
  // Track in-flight requests so a fast second query cancels a slow first one.
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string, mode: RagMode) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ loading: true, answer: null, error: null });
    try {
      const result =
        mode === "cloud"
          ? await remoteAnswer(trimmed, controller.signal)
          : await OnDeviceEngine.get().answer(trimmed);

      if (!controller.signal.aborted) {
        setState({ loading: false, answer: result, error: null });
      }
    } catch (err) {
      if (controller.signal.aborted) return; // superseded by a newer query
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong running the search.";
      setState({ loading: false, answer: null, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ loading: false, answer: null, error: null });
  }, []);

  return { ...state, search, reset };
}
