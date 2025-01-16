import Worker from "./worker.class";
import GetApiKey from "./get-api-key.class";
import GetPosts from './notion/get-posts.class'
import GetPost from './notion/get-post.class'

export default {
  async fetch(request, env) {
    try {

      if (request.method === "OPTIONS") {
        // Handle CORS!
        return new Response(null, {
          headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": env.CORS_WHITE_LIST,
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
            'Access-Control-Expose-Headers': 'X-API-Key',
          },
        });
      }

      // Development Mode
      const dev = env?.APP_ENV === 'development'

      const worker = new Worker(request, env)

      const validActions = new Map()
      validActions.set('GetApiKey', { auth: false, handler: GetApiKey })
      validActions.set('GetAllPosts', { auth: true, handler: GetPosts })
      validActions.set('GetPostBySlug', { auth: true, handler: GetPost })

      const isValidAction = validActions.has(worker.action)
      if (!isValidAction) {
        return worker.createErrorResponse('not found', 404)
      }

      const action = validActions.get(worker.action)
      if (dev) {
        const handler = new action.handler(worker)
        const response = await handler.execute({ useCache: false, dev })

        return worker.createResponse(response, { 'X-API-Key': 'development' })
      }

      let apiKey = request.headers.get('X-API-Key') || ''
      if (action.auth) {
        const validApiKey = await worker.KV.get(`token:${apiKey}`)
        if (!validApiKey) {
          return worker.createErrorResponse('invalid api key', 401)
        }
      } else {
        apiKey = apiKey === '' ? await worker.generateShortLivedToken() : apiKey
      }

      const handler = new action.handler(worker)
      const response = await handler.execute()

      return worker.createResponse(response, { 'X-API-Key': apiKey })
    } catch (error) {
      console.log(error)
    }
  }
}
