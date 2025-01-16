import Notion from './notion.class'

class GetPosts extends Notion {

  constructor (worker) {
    super(worker.env)
    this.KV = worker.KV

    this.cursors = new Map()
    this.page = isNaN(parseInt(worker.params.get('page'))) ? 1 : parseInt(params.get('page'))
    this.limit = isNaN(parseInt(worker.params.get('limit'))) ? 10 : parseInt(params.get('limit'))
  }

  async execute({ useCache = true, dev = false }) {
    try {

      if (useCache) {
        const cacheKey = 'notion:blog:posts';
        const cachedPosts = await this.KV.get(cacheKey, { type: 'json' });

        if (cachedPosts) {
          return cachedPosts;
        }
      }

      const posts = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          or: [{
            property: 'Published',
            checkbox: { equals: true }
          }, {
            property: 'OnReview',
            checkbox: { equals: dev }
          }]
        },
        sorts: [{
          property: 'Date',
          direction: 'descending'
        }],
        page_size: this.limit > 10 || this.limit < 1 ? 10 : this.limit,
        start_cursor: undefined
        // start_cursor: this.page > 1 ? this.getCursor(this.page) : undefined
      })

      const transformedPosts = await Promise.all(
        posts.results.map(async post => await this.transformPost(post))
      )
      if (useCache) {
        await this.KV.put(cacheKey, JSON.stringify(transformedPosts), { expirationTtl: 3600 });
      }
      return transformedPosts;
    } catch (error) {
      throw new Error(error)
    }
  }

}

export default GetPosts
