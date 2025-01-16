/**
 * Represents a worker that handles requests and provides utility functions.
 */
class Worker {

  /**
   * Creates a new Worker instance.
   *
   * @param {Request} request - The incoming request object.
   * @param {Object} env - The Cloudflare Worker environment.
   */
  constructor (request, env) {
    const requestUrl = new URL(request.url);
    const params = requestUrl.searchParams;

    this.corsWhiteList = env.CORS_WHITE_LIST;
    this.action = this.sanitizeAction(params.get('action'));
    this.params = params;
    this.env = env;
    this.KV = env.NOTION_BLOG_POSTS_CACHE;
  }

  /**
   * Creates a successful response with the given data and headers.
   *
   * @param {Object} [data={}] - The data to include in the response body.
   * @param {Object} [additionalHeaders={}] - Additional headers to include in the response.
   * @returns {Response} The response object.
   */
  createResponse(data = {}, additionalHeaders = {}) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': this.corsWhiteList,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        'Access-Control-Expose-Headers': 'X-API-Key',
        ...additionalHeaders,
      },
    });
  }

  /**
   * Creates an error response with the given error message and status code.
   *
   * @param {string} error - The error message.
   * @param {number} status - The HTTP status code.
   * @returns {Response} The error response object.
   */
  createErrorResponse(error, status) {
    return new Response(JSON.stringify({ status, error }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': this.corsWhiteList,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        'Access-Control-Expose-Headers': 'X-API-Key',
      },
    });
  }

  /**
   * Sanitizes the action string by removing invalid characters.
   *
   * @param {string} action - The action string to sanitize.
   * @returns {string|null} The sanitized action string or null if invalid.
   */
  sanitizeAction(action) {
    if (!action) {
      return null;
    }
    return action.replace(/[^a-zA-Z0-9-_]/g, '');
  }

  /**
   * Generates a short-lived token and stores it in KV.
   *
   * @returns {Promise<string>} The generated token.
   */
  async generateShortLivedToken() {
    const token = Array.from(crypto.getRandomValues(new Uint32Array(8)))
      .map((n) => n.toString(36))
      .join('');

    await this.KV.put(`token:${token}`, 'valid', { expirationTtl: this.env.API_KEY_EXPIRATION });

    return token;
  }

  /**
   * Checks if the given API key is valid.
   *
   * @param {string} apiKey - The API key to validate.
   * @returns {Promise<boolean>} True if the API key is valid, false otherwise.
   */
  async isValidApiKey(apiKey) {
    return await this.KV.get(`token:${apiKey}`) === 'valid';
  }
}

export default Worker;
