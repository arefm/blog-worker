import Notion from './notion.class';

/**
 * Retrieves a single blog post from Notion by its slug, with optional caching.
 */
class GetPost extends Notion {

  /**
   * Creates a new GetPost instance.
   *
   * @param {Worker} worker - The worker instance providing access to environment and KV.
   */
  constructor (worker) {
    super(worker.env);
    this.KV = worker.KV;
    this.slug = this.sanitizeSlug(worker.params.get('slug')) || '404';
  }

  /**
   * Sanitizes the slug by removing invalid characters.
   *
   * @param {string} slug - The slug to sanitize.
   * @returns {string|null} The sanitized slug or null if invalid.
   */
  sanitizeSlug(slug) {
    if (!slug) {
      return null;
    }
    return slug.replace(/[^a-zA-Z0-9-_]/g, '');
  }

  /**
   * Fetches and transforms a blog post from Notion.
   *
   * @param {Object} options - Options for fetching the post.
   * @param {boolean} [options.useCache=true] - Whether to use cached post if available.
   * @param {boolean} [options.isDevMode=false] - Whether to bypass the 'Published' filter (for development).
   * @returns {Promise<Object>} The transformed blog post object.
   * @throws {Error} If an error occurs during fetching or transformation.
   */
  async execute({ useCache = true, isDevMode = false } = {}) {
    try {
      const cacheKey = `notion:blog:post:${this.slug}`;

      if (useCache) {
        const cachedPost = await this.KV.get(cacheKey, { type: 'json' });
        if (cachedPost) {
          return cachedPost;
        }
      }

      // Define the filter based on the mode (development or production)
      const filter = isDevMode
        ? {
          property: 'Slug',
          rich_text: { equals: this.slug },
        }
        : {
          and: [
            { property: 'Slug', rich_text: { equals: this.slug } },
            { property: 'Published', checkbox: { equals: true } },
          ],
        };

      const post = await this.notion.databases.query({
        database_id: this.databaseId,
        filter,
      });

      if (!post.results.length) {
        return this.createErrorResponse('Post not found', 404); // Return a 404 response if no post is found
      }

      const transformedPost = await this.transformPost(post.results[0], true);

      if (useCache) {
        await this.KV.put(cacheKey, JSON.stringify(transformedPost), { expirationTtl: 3600 });
      }

      return transformedPost;
    } catch (error) {
      console.error('Error fetching post:', error); // Log the error for debugging
      throw new Error('Failed to fetch blog post'); // Throw a generic error to avoid exposing details
    }
  }
}

export default GetPost;
