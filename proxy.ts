import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseBasicAuthHeader, isAuthorized } from "@/lib/outreach/auth/basicAuth";

// `middleware.ts` was renamed to `proxy.ts` in Next.js 16
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).

const REALM = "Outreach Sequencer";

function unauthorizedResponse(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

/**
 * Gates every /outreach and /api/outreach route behind a single shared
 * username/password (Phase 1 is a self-hosted, single-operator tool - not a
 * multi-tenant app, so this is a deliberately simpler bar than a full
 * accounts system). The unsubscribe link is the one exception: recipients,
 * not the operator, click it, and it is protected by its own signed token
 * instead.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/outreach/unsubscribe/")) {
    return NextResponse.next();
  }

  const expectedUser = process.env.OUTREACH_ACCESS_USER;
  const expectedPass = process.env.OUTREACH_ACCESS_PASSWORD;
  if (!expectedUser || !expectedPass) {
    // Fail closed: an unconfigured gate refuses access rather than letting
    // every request through.
    return NextResponse.json(
      { error: "Outreach access is not configured. Set OUTREACH_ACCESS_USER and OUTREACH_ACCESS_PASSWORD." },
      { status: 503 },
    );
  }

  const credentials = parseBasicAuthHeader(request.headers.get("authorization"));
  if (isAuthorized(credentials, expectedUser, expectedPass)) {
    return NextResponse.next();
  }

  return unauthorizedResponse();
}

export const config = {
  matcher: ["/outreach/:path*", "/api/outreach/:path*"],
};
