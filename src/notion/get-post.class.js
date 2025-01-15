import Notion from './notion.class'

class GetPost extends Notion {

  constructor (worker) {
    super(worker.env)

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
    const cacheKey = `'notion:blog:post:${this.slug}`;
    const cachedPost = this.getCacheResponse(cacheKey);

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
    this.setCacheResponse(cacheKey, transformedPost);
    return transformedPost;
  }

}

export default GetPost
