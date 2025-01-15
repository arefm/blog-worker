import LRUCache from 'lru-cache'
import Notion from './notion.class'

const cache = new LRUCache({
  max: 10,
  ttl: 1000 * 60 * 60 // 1 hour
})

class GetPost extends Notion {

  constructor (env, params) {
    super(env)
    this.slug = this.sanitizeSlug(params.get('slug') || '404')
  }

  sanitizeSlug(slug) {
    if (!slug) {
      return null
    }
    return slug.replace(/[^a-zA-Z0-9-_]/g, '');
  }

  async execute() {
    const cacheKey = `post:${this.slug}`;
    const cachedPost = cache.get(cacheKey);

    if (cachedPost) {
      return cachedPost;
    }

    const post = await this.notion.databases.query({
      database_id: this.databaseId,
      filter: {
        and: [{
          property: 'Slug',
          rich_text: { equals: this.slug }
        }, {
          property: 'Published',
          checkbox: { equals: true }
        }]
      }
    })

    const transformedPost = await this.transformPost(post.results[0], true)
    cache.set(cacheKey, transformedPost);
    return transformedPost;
  }

}

export default GetPost
