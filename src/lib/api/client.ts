/* The single configured axios instance for the platform API.

   Two interceptors do the heavy lifting so callers never repeat themselves:
   - request:  attach `Authorization: Bearer <jwt>` from auth-storage.
   - response: unwrap the { status, success, result, error_details } envelope so
               callers receive `result` directly, and on a 401 trigger a logout. */

import axios from "axios"
import type { AxiosError, AxiosRequestConfig } from "axios"

import { readToken } from "@/lib/auth-storage"

// In dev, default to the relative "/api/v1" path so requests go through the Vite
// proxy (see vite.config.ts) and avoid CORS. In prod, hit the Azure host directly.
// Override either with VITE_API_BASE_URL.
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "/api/v1" : "https://dev-api.ginja.ai/api/v1")

export type ApiEnvelope<T> = {
  status: number
  success: boolean
  message: string | null
  result: T | null
  error_details: unknown
}

/** Normalised error thrown by every failed request (carries the envelope message). */
export class ApiError extends Error {
  status: number
  errorDetails: unknown
  constructor(message: string, status: number, errorDetails: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errorDetails = errorDetails
  }
}

/* AuthProvider registers a handler here; the response interceptor calls it on a
   401 so an expired/revoked session drops the user back to /login. */
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = readToken()
  // Don't clobber an explicit Authorization header (used by logout).
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === "object" && "success" in data) {
      return (data as ApiEnvelope<unknown>).result
    }
    return data
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0
    const envelope = error.response?.data
    const url = error.config?.url ?? ""
    const isAuthCall =
      url.includes("/auth/login") || url.includes("/auth/logout")

    if (status === 401 && !isAuthCall) onUnauthorized?.()

    const message =
      envelope?.message ||
      error.message ||
      "Something went wrong. Please try again."
    return Promise.reject(
      new ApiError(message, status, envelope?.error_details ?? null)
    )
  }
)

/* Typed helpers. The response interceptor resolves to `result`, so these cast
   away axios's AxiosResponse wrapper and hand callers the payload directly. */
export function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return api.get(url, config) as unknown as Promise<T>
}
export function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return api.post(url, body, config) as unknown as Promise<T>
}
export function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return api.put(url, body, config) as unknown as Promise<T>
}
export function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return api.patch(url, body, config) as unknown as Promise<T>
}
export function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return api.delete(url, config) as unknown as Promise<T>
}
