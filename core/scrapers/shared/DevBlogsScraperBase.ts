import * as cheerio from 'cheerio';
import moment from 'moment';

import { Post, Link } from '../../models';
import { HtmlPageScraper } from '../HtmlPageScraper';

export class DevBlogsScraperBase extends HtmlPageScraper {
  constructor(
    private readonly blogId: string,
    private readonly blogName: string) {
    super();
  }

  readonly name = `DevBlogs / ${this.blogName}`;
  readonly path = `devblogs.microsoft.com/${this.blogId}`;

  private readonly DevBlogs: Link = {
    title: 'DevBlogs',
    href: 'https://devblogs.microsoft.com',
  };

  private readonly blog: Link = {
    title: this.blogName,
    href: `https://devblogs.microsoft.com/${this.blogId}/`,
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.blog.href)
      .fetchPosts(DevBlogsFetchReader, reader => {
        const post: Post = {
          image: reader.image,
          title: reader.title,
          href: reader.href,
          categories: [
            this.DevBlogs,
            this.blog,
          ],
          date: moment(reader.date, 'LL'),
          links: [
            {
              title: 'Read more',
              href: reader.href,
            },
          ],
          tags: reader.tags,
        };

        return post;
      });
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this
      .fromHtmlPage(post.href)
      .enrichPost(DevBlogsEnrichReader, reader => {
        post = {
          ...post,
          description: reader.getDescription(),
        };

        return post;
      });
  }
}

class DevBlogsFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '#main .entry-box';

  readonly image = this.article.find('.entry-image img').attr('data-src');
  readonly link = this.article.find('.entry-title a');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';
  readonly date = this.article.find('.entry-post-date').text();
  readonly tags = this.article
    .find('.post-categories-tags a')
    .map((_, element) => this.$(element).text())
    .toArray();
}

class DevBlogsEnrichReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '#main .entry-content';

  getDescription(): string[] {
    const description = [];
    const elements = this.article.children();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = this.$(element);
        const text = p.text().trim();

        if (text) {
          description.push(text);

          if (description.length >= 5) {
            break;
          }
        }
      }
      else if (description.length > 0) {
        break;
      }
    }

    return description;
  }
}
