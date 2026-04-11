"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Spin } from "antd";

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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { me, hydrated } = useAppSelector((state) => state.auth);
  const [triggerAuthMe, authMeState] = useLazyAuthMeQuery();
  const authRequestedRef = useRef(false);
  const isPublicRoute = useMemo(
    () => (pathname ? PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) : false),
    [pathname]
  );

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
  }, [authMeState.isFetching, hydrated, me, triggerAuthMe]);

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

    if (isPublicRoute) {
      return;
    }

    dispatch(clearAuth());
    clearAuthTokens();
  }, [authMeState.error, dispatch, isPublicRoute]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (isPublicRoute && me) {
      router.replace("/stock/items");
      return;
    }

    const isVerifying = authMeState.isFetching;
    if (!isPublicRoute && !me && !isVerifying) {
      const redirectTo = pathname || "/stock/items";
      router.replace(`/signin?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [
    authMeState.isFetching,
    hydrated,
    isPublicRoute,
    me,
    pathname,
    router
  ]);

  if (!hydrated) {
    return (
      <div className="centered-state">
        <Spin size="large" />
      </div>
    );
  }

  const isVerifying = !isPublicRoute && !me && authMeState.isFetching;
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
