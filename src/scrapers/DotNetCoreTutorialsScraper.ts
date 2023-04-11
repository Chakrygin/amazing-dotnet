import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class DotNetCoreTutorialsScraper extends HtmlPageScraper {
  readonly name = 'DotNetCoreTutorials';
  readonly path = 'dotnetcoretutorials.com';
  readonly author = 'Wade Gausden';

  private readonly blog: Link = {
    title: '.NET Core Tutorials',
    href: 'https://dotnetcoretutorials.com/',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, '#main article.post', ($, article) => {
      const image = article.find('.post-image img').attr('data-lazy-src') ?? '';
      const link = article.find('.entry-title a');
      const title = link.text();
      const href = link.attr('href') ?? '';
      const date = this.getDate(href);

      const post: Post = {
        image: image,
        title: title,
        href: href,
        categories: [
          this.blog,
        ],
        author: this.author,
        date: moment(date, 'YYYY/MM/DD'),
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
      };

      return post;
    });
  }

  private getDate(href: string): string {
    const regex = /\/(\d{4}\/\d{2}\/\d{2})\//;
    const match = href.match(regex);

    if (!match) {
      throw new Error('Failed to parse post. Can not get post date from href: ' + href);
    }

    return match[1];
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this.readPostFromHtmlPage(post.href, '#main article.post', ($, article) => {
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

    const elements = article
      .find('.entry-content')
      .children();

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
