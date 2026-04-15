"use client";

import { useEffect, useRef } from "react";

import { isUnauthorizedAuthError } from "@/core/auth/auth-session";
import { useLazyAuthMeQuery } from "@/core/api/frappeApi";
import { clearAuth } from "@/core/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";

const SESSION_KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

export const useSessionKeepAlive = () => {
  const dispatch = useAppDispatch();
  const { hydrated, status } = useAppSelector((state) => state.auth);
  const [triggerAuthMe] = useLazyAuthMeQuery();
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!hydrated || status !== "authenticated") {
      return;
    }

    let active = true;

    const refreshSession = async () => {
      if (!active || isRefreshingRef.current || document.visibilityState !== "visible") {
        return;
      }

      isRefreshingRef.current = true;

      try {
        await triggerAuthMe().unwrap();
      } catch (error) {
        if (isUnauthorizedAuthError(error)) {
          dispatch(clearAuth());
        }
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshSession();
    }, SESSION_KEEP_ALIVE_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch, hydrated, status, triggerAuthMe]);
};

