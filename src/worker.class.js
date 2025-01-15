class Worker {

  constructor (request, env) {
    const ReqUrl = new URL(request.url)
    const params = ReqUrl.searchParams

    this.corsWhiteList = env.CORS_WHITE_LIST
    this.action = this.sanitizeAction(params.get('action'))
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
  }

  sanitizeAction(action) {
    if (!action) {
      return null
    }
    return action.replace(/[^a-zA-Z0-9-_]/g, '');
  }

}

export default Worker
