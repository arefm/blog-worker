import { LRUCache } from "lru-cache"

const cache = new LRUCache({
  max: 50,
  ttl: 3600 * 1000 // 1 hour
})

class Worker {

  constructor (request, env) {
    const ReqUrl = new URL(request.url)
    const params = ReqUrl.searchParams

    this.corsWhiteList = env.CORS_WHITE_LIST
    this.action = params.get('action')
    this.params = params
    this.env = env

    this.handleCors(request)
  }

  handleCors(request) {
    if (request.method === "OPTIONS") {
      return this.createResponse(null)
    }
  }

  createResponse(data = null) {
    return new Response(data ? JSON.stringify(data) : null, {
      headers: {
        "Access-Control-Allow-Origin": this.corsWhiteList,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } const

  getCacheResponse(cacheKey) {
    return cache.get(cacheKey);
  }

  setCacheResponse(cacheKey, response) {
    cache.set(cacheKey, response);
  }

}

export default Worker
