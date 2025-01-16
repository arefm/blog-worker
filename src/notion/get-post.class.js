import Notion from './notion.class'

class GetPost extends Notion {

  constructor (worker) {
    super(worker.env)
    this.KV = worker.env.NOTION_BLOG_POSTS_CACHE

    this.getCacheResponse = worker.getCacheResponse
    this.setCacheResponse = worker.setCacheResponse

    this.slug = this.sanitizeSlug(worker.params.get('slug') || '404')
  }

  sanitizeSlug(slug) {
    if (!slug) {
      return null
    }
    return slug.replace(/[^a-zA-Z0-9-_]/g, '');
  }

  async execute() {
    try {
      const cacheKey = `notion:blog:post:${this.slug}`;
      const cachedPost = await this.KV.get(cacheKey, { type: 'json' });

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
      await this.KV.put(cacheKey, JSON.stringify(transformedPost), { expirationTtl: 3600 });
      return transformedPost;
    } catch (error) {
      throw new Error(error)
    }
  }

}

export default GetPost
