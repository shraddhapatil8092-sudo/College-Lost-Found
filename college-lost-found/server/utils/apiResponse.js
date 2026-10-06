export function sendSuccess(response, statusCode, message, data) {
  return response.status(statusCode).json({ success: true, message, data });
}