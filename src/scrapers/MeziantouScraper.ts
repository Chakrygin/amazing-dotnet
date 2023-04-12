import * as core from '@actions/core';

import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class MeziantouScraper extends HtmlPageScraper {
  readonly name = 'Meziantou';
  readonly path = 'meziantou.net';
  readonly author = 'Gérald Barré';

  private readonly blog: Link = {
    title: 'Meziantou\'s blog',
    href: 'https://www.meziantou.net',
  };

  protected readPosts(): AsyncGenerator<Post> {
    return this.readPostsFromHtmlPage(this.blog.href, 'main article', ($, article) => {
      const link = article.find('header>a');
      const title = link.text();
      const href = this.getFullHref(link.attr('href')) ?? '';
      const date = article.find('header>div>div>time').text();
      const tags = article
        .find('header>div>div>ul a')
        .map((_, element) => $(element))
        .map((_, tag) => tag.text().trim())
        .toArray();

      if (!tags.includes('.NET')) {
        core.info('Post does not have .NET tag. Continue scraping.');
        return;
      }

      const post: Post = {
        title,
        href,
        categories: [
          this.blog,
        ],
        author: this.author,
        date: moment(date, 'MM/DD/YY'),
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

  private getFullHref(href: string | undefined): string | undefined {
    if (href?.startsWith('/')) {
      href = this.blog.href + href;
    }

    return href;
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this.readPostFromHtmlPage(post.href, 'main article', ($, article) => {
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
      .find('>div')
      .first()
      .children();

    for (const element of elements) {
      if (element.name === 'p') {
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
