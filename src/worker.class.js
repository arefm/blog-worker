class Worker {

  constructor (request, env) {
    const ReqUrl = new URL(request.url)
    const params = ReqUrl.searchParams

    this.corsWhiteList = env.CORS_WHITE_LIST
    this.action = this.sanitizeAction(params.get('action'))
    this.params = params
    this.env = env
    this.KV = env.NOTION_BLOG_POSTS_CACHE
  }

  createResponse(data = {}, additionalHeaders = {}) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": this.corsWhiteList,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
        'Access-Control-Expose-Headers': 'X-API-Key',
        ...additionalHeaders
      },
    });
  }

  createErrorResponse(error, status) {
    return new Response(JSON.stringify({ status, error }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": this.corsWhiteList,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
        'Access-Control-Expose-Headers': 'X-API-Key'
      }
    })
  }

  sanitizeAction(action) {
    if (!action) {
      return null
    }
    return action.replace(/[^a-zA-Z0-9-_]/g, '');
  }

  async generateShortLivedToken() {
    const token = Array.from(crypto.getRandomValues(new Uint32Array(8)))
      .map((n) => n.toString(36))
      .join('');

    await this.KV.put(`token:${token}`, 'valid', { expirationTtl: this.env.API_KEY_EXPIRATION })

    return token;
  }

}

export default Worker
