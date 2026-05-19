export function success(data) {
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, data }),
    headers: { 'Content-Type': 'application/json' }
  };
}

export function error(message, statusCode = 400, code = 'BAD_REQUEST') {
  return {
    statusCode,
    body: JSON.stringify({ success: false, error: { code, message } }),
    headers: { 'Content-Type': 'application/json' }
  };
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, 401, 'UNAUTHORIZED');
}

export function notFound(message = 'Not found') {
  return error(message, 404, 'NOT_FOUND');
}