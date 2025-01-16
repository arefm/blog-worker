import Notion from './notion.class';

/**
 * Retrieves a list of blog posts from Notion, with optional caching and filtering.
 */
class GetPosts extends Notion {

  /**
   * Creates a new GetPosts instance.
   *
   * @param {Worker} worker - The worker instance providing access to environment and KV.
   */
  constructor (worker) {
    super(worker.env);
    this.KV = worker.KV;

    this.cursors = new Map(); // Not used in the current code, consider removing
    this.page = isNaN(parseInt(worker.params.get('page'))) ? 1 : parseInt(worker.params.get('page'));
    this.limit = isNaN(parseInt(worker.params.get('limit'))) ? 10 : parseInt(worker.params.get('limit'));
  }

  /**
   * Fetches and transforms blog posts from Notion.
   *
   * @param {Object} options - Options for fetching posts.
   * @param {boolean} [options.useCache=true] - Whether to use cached posts if available.
   * @param {boolean} [options.isDevMode=false] - Whether to include posts in review (for development).
   * @returns {Promise<Array>} An array of transformed blog post objects.
   * @throws {Error} If an error occurs during fetching or transformation.
   */
  async execute({ useCache = true, isDevMode = false } = {}) {
    try {
      const cacheKey = 'notion:blog:posts';

      if (useCache) {
        const cachedPosts = await this.KV.get(cacheKey, { type: 'json' });
        if (cachedPosts) {
          return cachedPosts;
        }
      }

      // Define the filter based on the mode (development or production)
      const filter = isDevMode
        ? {
          or: [{ property: 'Published', checkbox: { equals: true } }, { property: 'Published', checkbox: { equals: false } }]
        }
        : { property: 'Published', checkbox: { equals: true } };

      const posts = await this.notion.databases.query({
        database_id: this.databaseId,
        filter,
        sorts: [{ property: 'Date', direction: 'descending' }],
        page_size: this.limit > 10 || this.limit < 1 ? 10 : this.limit,
        // start_cursor: this.page > 1 ? this.getCursor(this.page) : undefined // Not used in the current code
      });

      const transformedPosts = await Promise.all(
        posts.results.map(async (post) => await this.transformPost(post))
      );

      if (useCache) {
        await this.KV.put(cacheKey, JSON.stringify(transformedPosts), { expirationTtl: 3600 });
      }

      return transformedPosts;
    } catch (error) {
      console.error('Error fetching posts:', error); // Log the error for debugging
      throw new Error('Failed to fetch blog posts'); // Throw a generic error to avoid exposing details
    }
  }
}

export default GetPosts;
