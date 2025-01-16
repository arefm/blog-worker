import Worker from "./worker.class";
import GetApiKey from "./get-api-key.class";
import GetPosts from './notion/get-posts.class'
import GetPost from './notion/get-post.class'

export default {
  async fetch(request, env) {
    const worker = new Worker(request, env)

    const validActions = new Map()
    validActions.set('GetApiKey', { auth: false, handler: GetApiKey })
    validActions.set('GetAllPosts', { auth: true, handler: GetPosts })
    validActions.set('GetPostBySlug', { auth: true, handler: GetPost })

    const isValidAction = validActions.has(worker.action)
    if (!isValidAction) {
      return worker.createResponse(null, { status: 404 })
    }

    const action = validActions.get(worker.action)
    if (action.auth) {
      const requestApiKey = request.headers.get('X-API-Key')
      const validApiKey = await worker.env.NOTION_BLOG_POSTS_CACHE.get(`token:${requestApiKey}`)
      if (!validApiKey) {
        return worker.createResponse(null, { status: 401 })
      }
    }
    const authToken = await worker.generateShortLivedToken()

    const handler = new action.handler(worker)
    const response = await handler.execute()

    return worker.createResponse(response, { 'X-API-Key': authToken })
  }
}
