import { LRUCache } from 'lru-cache'
import Notion from './notion.class'

const cache = new LRUCache({
  max: 10,
  ttl: 1000 * 60 * 60 // 1 hour
})

class GetPosts extends Notion {

  constructor (env, params) {
    super(env)
    this.cursors = new Map()
    this.page = isNaN(parseInt(params.get('page'))) ? 1 : parseInt(params.get('page'))
    this.limit = isNaN(parseInt(params.get('limit'))) ? 10 : parseInt(params.get('limit'))
  }

  async execute() {
    const cacheKey = 'notion:blog:posts';
    const cachedPosts = cache.get(cacheKey);

    if (cachedPosts) {
      return cachedPosts;
    }

    const posts = await this.notion.databases.query({
      database_id: this.databaseId,
      filter: {
        property: 'Published',
        checkbox: { equals: true }
      },
      sorts: [{
        property: 'Date',
        direction: 'descending'
      }],
      page_size: this.limit > 10 || this.limit < 1 ? 10 : this.limit,
      start_cursor: undefined
      // start_cursor: this.page > 1 ? this.getCursor(this.page) : undefined
    })

    // console.log(posts)

    const transformedPosts = await Promise.all(
      posts.results.map(async post => await this.transformPost(post))
    )
    cache.set(cacheKey, transformedPosts);
    return transformedPosts;
  }

}

export default GetPosts
