"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Spin } from "antd";

import { clearAuthTokens } from "@/lib/auth-storage";
import {
  useLazyAuthMeQuery
} from "@/store/api/frappeApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuth,
  setAuthHydrated,
  setAuthMe
} from "@/store/features/auth/authSlice";

const PUBLIC_ROUTES = ["/signin", "/signup"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { me, hydrated } = useAppSelector((state) => state.auth);
  const [triggerAuthMe, authMeState] = useLazyAuthMeQuery();
  const authRequestedRef = useRef(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const isPublicRoute = useMemo(
    () => (pathname ? PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) : false),
    [pathname]
  );
  const authErrorStatus = (() => {
    if (!authMeState.error || typeof authMeState.error !== "object") {
      return null;
    }

    const statusValue = (authMeState.error as { status?: unknown }).status;
    return typeof statusValue === "number" ? statusValue : null;
  })();
  const isSessionInvalid =
    authErrorStatus === 401 ||
    authErrorStatus === 403 ||
    (Boolean(authMeState.data) && authMeState.data?.ok === false);
  const hasAuthCheckCompleted = Boolean(me) || (authRequestedRef.current && !authMeState.isFetching);
  const isVerifying = !isPublicRoute && !me && !hasAuthCheckCompleted;
  const isSessionExpired = !isPublicRoute && !me && hasAuthCheckCompleted && isSessionInvalid;
  const hasAuthCheckError = !isPublicRoute && !me && hasAuthCheckCompleted && Boolean(authMeState.error) && !isSessionInvalid;

  useEffect(() => {
    if (hydrated) {
      return;
    }

    dispatch(setAuthHydrated(true));
  }, [dispatch, hydrated]);

  useEffect(() => {
    if (!hydrated || me || authMeState.isFetching || authRequestedRef.current) {
      return;
    }

    authRequestedRef.current = true;
    void triggerAuthMe();
  }, [authMeState.isFetching, hydrated, me, triggerAuthMe, retryNonce]);

  useEffect(() => {
    if (!authMeState.data) {
      return;
    }

    if (authMeState.data.ok) {
      dispatch(setAuthMe(authMeState.data.data));
      return;
    }

    dispatch(clearAuth());
    clearAuthTokens();
  }, [authMeState.data, dispatch]);

  useEffect(() => {
    if (!authMeState.error) {
      return;
    }

    // Ignore stale authMe errors if the app already has an authenticated user profile.
    if (me) {
      return;
    }

    if (isPublicRoute) {
      return;
    }

    // Only clear auth when backend confirms session is invalid.
    if (authErrorStatus === 401 || authErrorStatus === 403) {
      dispatch(clearAuth());
      clearAuthTokens();
    }
  }, [authErrorStatus, authMeState.error, dispatch, isPublicRoute, me]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (isPublicRoute && me) {
      const requestedRedirect = searchParams.get("redirect");
      const safeRedirect =
        requestedRedirect && requestedRedirect.startsWith("/") ? requestedRedirect : "/stock/items";
      router.replace(safeRedirect);
      return;
    }

    if (!isPublicRoute && !me && hasAuthCheckCompleted && isSessionInvalid) {
      const redirectTo = pathname || "/stock/items";
      const timer = window.setTimeout(() => {
        router.replace(`/signin?redirect=${encodeURIComponent(redirectTo)}`);
      }, 900);
      return () => window.clearTimeout(timer);
    }
  }, [
    hasAuthCheckCompleted,
    hydrated,
    isPublicRoute,
    isSessionInvalid,
    me,
    pathname,
    searchParams,
    router
  ]);

  if (!hydrated) {
    return (
      <div className="centered-state">
        <Spin size="large" />
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="centered-state">
        <Spin size="large" />
      </div>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!me) {
    if (isSessionExpired) {
      return (
        <div className="page-shell">
          <Alert
            type="warning"
            message="Session expired"
            description="Your ERPNext session has expired. Redirecting to sign in..."
            showIcon
          />
        </div>
      );
    }

    if (hasAuthCheckError) {
      return (
        <div className="page-shell">
          <Alert
            type="error"
            message="Unable to verify session"
            description="Could not validate your login session. Check ERPNext connectivity and retry."
            showIcon
            action={
              <Button
                size="small"
                onClick={() => {
                  authRequestedRef.current = false;
                  setRetryNonce((value) => value + 1);
                }}
              >
                Retry
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <div className="page-shell">
        <Alert
          type="warning"
          message="Authentication required"
          description="Redirecting to sign in..."
          showIcon
        />
      </div>
    );
  }

  return <>{children}</>;
}
