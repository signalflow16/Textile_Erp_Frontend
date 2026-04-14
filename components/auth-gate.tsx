"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Spin } from "antd";

import {
  AUTH_LOADING_GRACE_MS,
  AUTH_RETRY_DELAY_MS,
  isRetryableAuthError,
  isUnauthorizedAuthError,
  waitFor
} from "@/lib/auth-session";
import { useLazyAuthMeQuery } from "@/store/api/frappeApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuth,
  setAuthHydrated,
  setAuthMe,
  setAuthStatus
} from "@/store/features/auth/authSlice";

const PUBLIC_ROUTES = ["/signin", "/signup"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hydrated, me, status } = useAppSelector((state) => state.auth);
  const [triggerAuthMe] = useLazyAuthMeQuery();
  const bootstrapStartedRef = useRef(false);
  const [graceElapsed, setGraceElapsed] = useState(false);
  const isPublicRoute = useMemo(
    () => (pathname ? PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) : false),
    [pathname]
  );

  useEffect(() => {
    if (bootstrapStartedRef.current) {
      return;
    }

    bootstrapStartedRef.current = true;
    dispatch(setAuthStatus("loading"));

    let active = true;
    const graceTimer = window.setTimeout(() => {
      if (active) {
        setGraceElapsed(true);
      }
    }, AUTH_LOADING_GRACE_MS);

    const finishBootstrap = () => {
      if (!active) {
        return;
      }

      dispatch(setAuthHydrated(true));
    };

    const loadSession = async () => {
      try {
        const response = await triggerAuthMe().unwrap();
        const userId = typeof response.data?.user_id === "string" ? response.data.user_id : null;

        if (!response.ok || !userId || userId === "Guest") {
          dispatch(clearAuth());
          return;
        }

        dispatch(setAuthMe(response.data));
        return;
      } catch (error) {
        if (isUnauthorizedAuthError(error)) {
          dispatch(clearAuth());
          return;
        }

        if (isRetryableAuthError(error)) {
          await waitFor(AUTH_RETRY_DELAY_MS);

          try {
            const retryResponse = await triggerAuthMe().unwrap();
            const userId =
              typeof retryResponse.data?.user_id === "string" ? retryResponse.data.user_id : null;

            if (!retryResponse.ok || !userId || userId === "Guest") {
              dispatch(clearAuth());
              return;
            }

            dispatch(setAuthMe(retryResponse.data));
            return;
          } catch (retryError) {
            if (isUnauthorizedAuthError(retryError) || isRetryableAuthError(retryError)) {
              dispatch(clearAuth());
              return;
            }
          }
        }

        dispatch(clearAuth());
      } finally {
        finishBootstrap();
      }
    };

    void loadSession();

    return () => {
      active = false;
      window.clearTimeout(graceTimer);
    };
  }, [dispatch, triggerAuthMe]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (isPublicRoute && status === "authenticated") {
      router.replace("/stock");
      return;
    }

    if (!isPublicRoute && status === "unauthenticated") {
      const redirectTo = pathname || "/stock";
      router.replace(`/signin?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [hydrated, isPublicRoute, pathname, router, status]);

  const shouldShowLoading = !hydrated || (status === "loading" && !graceElapsed);

  if (shouldShowLoading) {
    return (
      <div className="centered-state">
        <Spin size="large" />
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="centered-state">
        <Spin size="large" />
      </div>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (status !== "authenticated" && !me) {
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
