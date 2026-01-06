/**
 * Standard API Success Response
 * Used for all successful API responses
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Standard API Error Response
 * Used for all error responses (same in development and production)
 * Stack traces are only logged server-side, never sent to client
 */
export interface ApiErrorResponse {
  status: 'error';
  message: string;
  data: null;
}
