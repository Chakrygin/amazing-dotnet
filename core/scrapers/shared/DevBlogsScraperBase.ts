import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../models';
import { HtmlPageScraper } from '../HtmlPageScraper';

export abstract class DevBlogsScraperBase extends HtmlPageScraper {
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

  private readonly DevBlog: Link = {
    title: this.blogName,
    href: `https://devblogs.microsoft.com/${this.blogId}/`,
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage('', '#main .entry-box', ($, article) => {
      const image = article.find('.entry-image img').attr('data-src');
      const link = article.find('.entry-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = article.find('.entry-post-date').text();
      const tags = article
        .find('.post-categories-tags a')
        .map((_, element) => $(element).text())
        .toArray();

      const post: Post = {
        image,
        title,
        href,
        categories: [
          this.DevBlogs,
          this.DevBlog,
        ],
        date: moment(date, 'LL'),
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
        tags,
      };

      return post;
    });
  }

  protected async enrichPost(post: Post): Promise<Post | undefined> {
    return this.readPostFromHtmlPage(post.href, '#main .entry-content', ($, article) => {
      const description = this.getDescription($, article);

      post = {
        ...post,
        description,
      };

      return post;
    });
  }

  private getDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
    const description: string[] = [];

    const elements = article.children();
    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);
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
