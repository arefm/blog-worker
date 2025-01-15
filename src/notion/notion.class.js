import { Client } from "@notionhq/client";
import { NotionToMarkdown } from 'notion-to-md'
import { format } from 'date-fns'

class Notion {

  constructor (env) {
    this.notion = new Client({ auth: env.NOTION_TOKEN })
    this.n2m = new NotionToMarkdown({ notionClient: this.notion })
    this.databaseId = env.NOTION_DATABASE_ID
  }

  getPropertyValue(post, field, valueKey = 'rich_text') {
    return post.properties[field]?.[valueKey]?.[0]?.plain_text ?? null
  }

  getAuthors(post) {
    return post.properties.Author.people.map(({ name, avatar_url: avatar }) => {
      return { name, avatar }
    })
  } false

  getTags(post) {
    return post.properties.Tags.multi_select.map(tag => tag.name)
  }

  async transformPost(post, includeContent = false) {
    const basePost = {
      slug: this.getPropertyValue(post, 'Slug', 'rich_text'),
      title: this.getPropertyValue(post, 'Title', 'title'),
      date: format(new Date(post.properties.Date.date.start), 'MMMM dd, yyyy'),
      authors: this.getAuthors(post),
      tags: this.getTags(post),
      description: this.getPropertyValue(post, 'Description', 'rich_text'),
      content: null
    }

    if (includeContent) {
      const mdblocks = await this.n2m.pageToMarkdown(post.id);
      basePost.content = this.n2m.toMarkdownString(mdblocks).parent;
    }

    return basePost
  }

}

export default Notion
