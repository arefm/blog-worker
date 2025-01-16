class Worker {

  constructor (request, env) {
    const ReqUrl = new URL(request.url)
    const params = ReqUrl.searchParams

    this.corsWhiteList = env.CORS_WHITE_LIST
    this.action = this.sanitizeAction(params.get('action'))
    this.params = params
    this.env = env
    this.KV = env.NOTION_BLOG_POSTS_CACHE

    this.handleCors(request)
  }

  handleCors(request) {
    if (request.method === "OPTIONS") {
      return this.createResponse(null, { status: 403 })
    }
  }

  createResponse(data = null, extraHeaders = {}) {
    return new Response(data ? JSON.stringify(data) : null, {
      headers: {
        "Access-Control-Allow-Origin": this.corsWhiteList,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
        'Access-Control-Expose-Headers': 'X-API-Key',
        ...extraHeaders
      },
    });
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

    await this.KV.put(`token:${token}`, 'valid', { expirationTtl: 3600 })

    return token;
  }

}

export default Worker
