import Worker from "./worker.class";
import GetPosts from './notion/get-posts.class'
import GetPost from './notion/get-post.class'

export default {
  async fetch(request, env) {
    const worker = new Worker(request, env)

    let handler = null
    switch (worker.action) {
      case 'GetAllPosts':
        handler = new GetPosts(worker)
        break
      case 'GetPostBySlug':
        handler = new GetPost(worker)
        break
    }

    const response = handler ? await handler.execute() : []
    return worker.createResponse(response)
  }
}
