import { NextResponse } from "next/server";

export const jsonOk = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json(data, { status: 200, ...init });

export const jsonCreated = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json(data, { status: 201, ...init });

export const jsonBadRequest = (error: string | { message: string; details?: unknown }) =>
  NextResponse.json({ error: typeof error === 'string' ? { message: error } : error }, { status: 400 });

export const jsonNotFound = (message = "Not found.") =>
  NextResponse.json({ error: { message } }, { status: 404 });

export const jsonUnauthorized = (message = "Unauthorized.") =>
  NextResponse.json({ error: { message } }, { status: 401 });

export const jsonForbidden = (message = "Forbidden.") =>
  NextResponse.json({ error: { message } }, { status: 403 });

export const jsonNoContent = (init?: ResponseInit) =>
  new NextResponse(null, { status: 204, ...init });

export const jsonServerError = (message = "Internal server error.") =>
  NextResponse.json({ error: { message } }, { status: 500 });
