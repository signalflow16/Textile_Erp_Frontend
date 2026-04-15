import axios from "axios";
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
  const headers: Record<string, string> = {};

  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");

  // Always forward incoming session cookies for native ERPNext auth.
  if (cookie) {
    headers.cookie = cookie;
  }

  if (authorization) {
    headers.authorization = authorization;
  }

  if (contentType) {
    headers["content-type"] = contentType;
  }

  const csrfToken = request.headers.get("x-frappe-csrf-token");
  if (csrfToken) {
    headers["x-frappe-csrf-token"] = csrfToken;
  }

  headers.accept = "application/json";

  try {
    const requestBody = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();

    const response = await axios.request<string>({
      url: url.toString(),
      method: request.method,
      headers,
      data: requestBody,
      timeout: 30000,
      maxRedirects: 0,
      responseType: "text",
      validateStatus: () => true
    });

    const proxied = new NextResponse(response.data, {
      status: response.status
    });

    const responseContentType = response.headers["content-type"];
    if (responseContentType) {
      proxied.headers.set("content-type", responseContentType);
    }

    const setCookieHeader = response.headers["set-cookie"];
    if (Array.isArray(setCookieHeader)) {
      setCookieHeader.forEach((value) => proxied.headers.append("set-cookie", value));
    } else if (setCookieHeader) {
      proxied.headers.set("set-cookie", setCookieHeader);
    }

    return proxied;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while contacting ERPNext";
    const status =
      axios.isAxiosError(error) && error.code === "ECONNABORTED"
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
