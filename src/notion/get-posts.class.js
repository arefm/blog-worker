import Notion from './notion.class'

class GetPosts extends Notion {

  constructor (worker) {
    super(worker.env)
    this.KV = worker.env.NOTION_BLOG_POSTS_CACHE

    this.cursors = new Map()
    this.page = isNaN(parseInt(worker.params.get('page'))) ? 1 : parseInt(params.get('page'))
    this.limit = isNaN(parseInt(worker.params.get('limit'))) ? 10 : parseInt(params.get('limit'))
  }

  async execute() {
    const cacheKey = 'notion:blog:posts';
    const cachedPosts = this.KV.get(cacheKey, { type: 'json' });

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
    await this.KV.put(cacheKey, JSON.stringify(transformedPosts), { expirationTtl: 3600 });
    return transformedPosts;
  }

}

export default GetPosts
