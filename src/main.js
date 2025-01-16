import Worker from './worker.class';
import GetApiKey from './get-api-key.class';
import GetPosts from './notion/get-posts.class';
import GetPost from './notion/get-post.class';

/**
 * Handles CORS preflight requests.
 *
 * @param {Object} env - The Cloudflare Worker environment.
 * @returns {Response} The CORS preflight response.
 */
function handleCorsPreflight(env) {
  return new Response(null, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': env.CORS_WHITE_LIST,
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      'Access-Control-Expose-Headers': 'X-API-Key',
    },
  });
}

/**
 * Handles incoming requests to the Cloudflare Worker.
 *
 * @param {Request} request - The incoming request object.
 * @param {Object} env - The Cloudflare Worker environment.
 * @returns {Promise<Response>} The response to be sent to the client.
 */
async function handleRequest(request, env) {
  try {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight(env);
    }

    const worker = new Worker(request, env);

    // Define valid actions and their properties
    const validActions = new Map([
      ['GetApiKey', { authRequired: false, handler: GetApiKey }],
      ['GetAllPosts', { authRequired: true, handler: GetPosts }],
      ['GetPostBySlug', { authRequired: true, handler: GetPost }],
    ]);

    if (!validActions.has(worker.action)) {
      return worker.createErrorResponse('Not Found', 404);
    }

    const action = validActions.get(worker.action);

    // Development mode handling
    if (env?.DEV_MODE === 'true') {
      const handler = new action.handler(worker);
      const response = await handler.execute({ useCache: false, isDevMode: true });
      return worker.createResponse(response, { 'X-API-Key': 'development' });
    }

    // API key authentication
    let apiKey = request.headers.get('X-API-Key') || '';
    if (action.authRequired) {
      const isValidApiKey = await worker.isValidApiKey(apiKey);
      if (!isValidApiKey) {
        return worker.createErrorResponse('Invalid API key', 401);
      }
    } else if (!apiKey) {
      apiKey = await worker.generateShortLivedToken();
    }

    const handler = new action.handler(worker);
    const response = await handler.execute({});
    return worker.createResponse(response, { 'X-API-Key': apiKey });

  } catch (error) {
    const status = 500;
    // Log the error for debugging purposes
    console.error('An unexpected error occurred:', error);
    return new Response(JSON.stringify({ status, error: 'Internal Server Error' }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": env.CORS_WHITE_LIST,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
        'Access-Control-Expose-Headers': 'X-API-Key'
      }
    })
  }
}

// Export the handler function as the default export
export default { fetch: handleRequest };
