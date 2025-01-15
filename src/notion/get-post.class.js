import Notion from './notion.class'

class GetPost extends Notion {

  constructor (env, params) {
    super(env)
    this.slug = params.get('slug') || '404'
  }

  async execute() {
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

    return await this.transformPost(post.results[0], true)
  }

}

export default GetPost
