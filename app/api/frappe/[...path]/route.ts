import { NextRequest, NextResponse } from "next/server";

import { appEnv } from "@/lib/env";

const buildTargetUrl = (request: NextRequest, path: string[]) => {
  const target = new URL(`${appEnv.erpBaseUrl.replace(/\/$/, "")}/api/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return target;
};

const forwardRequest = async (request: NextRequest, path: string[]) => {
  const url = buildTargetUrl(request, path);
  const contentType = request.headers.get("content-type");
  const headers = new Headers();

  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  if (contentType) {
    headers.set("content-type", contentType);
  }

  const csrfToken = request.headers.get("x-frappe-csrf-token");
  if (csrfToken) {
    headers.set("x-frappe-csrf-token", csrfToken);
  }

  headers.set("accept", "application/json");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  };

  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      init.body = await request.text();
    }

    const response = await fetch(url, init);
    const body = await response.text();
    const proxied = new NextResponse(body, {
      status: response.status
    });

    const responseContentType = response.headers.get("content-type");
    if (responseContentType) {
      proxied.headers.set("content-type", responseContentType);
    }

    const setCookies =
      (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];

    if (setCookies.length > 0) {
      setCookies.forEach((value) => proxied.headers.append("set-cookie", value));
    } else {
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        proxied.headers.set("set-cookie", setCookie);
      }
    }

    return proxied;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while contacting ERPNext";
    const status =
      error instanceof Error && error.name === "TimeoutError"
        ? 504
        : 503;

    return NextResponse.json(
      {
        error: "erpnext_unreachable",
        message: `Unable to reach ERPNext at ${appEnv.erpBaseUrl}. Confirm the Frappe bench is running and the base URL is correct.`,
        details: message
      },
      {
        status
      }
    );
  }
};

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}
