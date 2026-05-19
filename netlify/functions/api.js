import { handleGetLists, handleCreateList } from './handlers/lists.js';
import { handleGetWords, handleGetNewWords, handleGetReviewWords, handleAddWord } from './handlers/words.js';
import { handleSubmitReview, handleStartSession, handleEndSession } from './handlers/review.js';
import { handleGetStats, handleGetDailyStats } from './handlers/stats.js';
import { handleGetSettings, handleUpdateSettings } from './handlers/settings.js';
import { verifyAuth } from './utils/auth-middleware.js';
import { success, error, unauthorized } from './utils/response.js';

function parsePath(event) {
  // Parse the sub-path from the full URL
  // /.netlify/functions/api/lists → /lists
  // /api/lists → /lists (Netlify redirect via config.path)
  let urlPath;
  try {
    const url = new URL(event.rawUrl);
    urlPath = url.pathname;
  } catch {
    urlPath = event.path || '';
  }

  // Strip the function mount prefix (/.netlify/functions/api or /api)
  urlPath = urlPath.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');
  urlPath = urlPath.replace(/^\/+/, '').replace(/\/+$/, '');
  const parts = urlPath.split('/').filter(Boolean);
  return parts;
}

function getBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

export const handler = async (event, context) => {
  const method = event.httpMethod;
  const parts = parsePath(event);
  const qs = event.queryStringParameters || {};

  try {
    // GET /api/lists
    if (parts[0] === 'lists' && parts.length === 1 && method === 'GET') {
      return handleGetLists();
    }

    // POST /api/lists
    if (parts[0] === 'lists' && parts.length === 1 && method === 'POST') {
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      event.body = event.body;
      return handleCreateList(event, user);
    }

    // GET /api/lists/:id/words
    if (parts[0] === 'lists' && parts.length === 3 && parts[2] === 'words' && method === 'GET') {
      event.pathParameters = { id: parts[1] };
      event.queryStringParameters = { ...qs, list_id: parts[1] };
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleGetWords(event);
    }

    // GET /api/lists/:id/words/new
    if (parts[0] === 'lists' && parts.length === 4 && parts[2] === 'words' && parts[3] === 'new' && method === 'GET') {
      event.pathParameters = { id: parts[1] };
      event.queryStringParameters = { ...qs, list_id: parts[1] };
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleGetNewWords(event, user);
    }

    // GET /api/lists/:id/words/review
    if (parts[0] === 'lists' && parts.length === 4 && parts[2] === 'words' && parts[3] === 'review' && method === 'GET') {
      event.pathParameters = { id: parts[1] };
      event.queryStringParameters = { ...qs, list_id: parts[1] };
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleGetReviewWords(event, user);
    }

    // POST /api/lists/:id/words
    if (parts[0] === 'lists' && parts.length === 3 && parts[2] === 'words' && method === 'POST') {
      event.pathParameters = { id: parts[1] };
      event.queryStringParameters = { ...qs, list_id: parts[1] };
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleAddWord(event, user);
    }

    // POST /api/review
    if (parts[0] === 'review' && parts.length === 1 && method === 'POST') {
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleSubmitReview(event, user);
    }

    // POST /api/session/start
    if (parts[0] === 'session' && parts.length === 2 && parts[1] === 'start' && method === 'POST') {
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleStartSession(event, user);
    }

    // POST /api/session/end
    if (parts[0] === 'session' && parts.length === 2 && parts[1] === 'end' && method === 'POST') {
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      // Read session_id from body, inject into event for handler
      const body = getBody(event);
      event.queryStringParameters = { ...qs, session_id: body.session_id };
      return handleEndSession(event, user);
    }

    // GET /api/stats
    if (parts[0] === 'stats' && parts.length === 1 && method === 'GET') {
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleGetStats(event, user);
    }

    // GET /api/stats/daily
    if (parts[0] === 'stats' && parts.length === 2 && parts[1] === 'daily' && method === 'GET') {
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleGetDailyStats(event, user);
    }

    // GET /api/settings
    if (parts[0] === 'settings' && parts.length === 1 && method === 'GET') {
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleGetSettings(event, user);
    }

    // PUT /api/settings
    if (parts[0] === 'settings' && parts.length === 1 && method === 'PUT') {
      const { user, error: authErr } = await verifyAuth(event);
      if (authErr) return unauthorized(authErr);
      return handleUpdateSettings(event, user);
    }

    return error('Not found', 404, 'NOT_FOUND');
  } catch (err) {
    console.error('API Error:', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
};

export const config = { path: "/api" };