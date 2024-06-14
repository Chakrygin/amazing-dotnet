import * as core from '@actions/core';

import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class MeziantouScraper extends ScraperBase {
  readonly name = 'Meziantou';
  readonly path = 'meziantou.net';
  readonly author = 'Gérald Barré';

  private readonly Meziantou: Link = {
    title: 'Meziantou\'s blog',
    href: 'https://www.meziantou.net',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.Meziantou.href)
      .fetchPosts('main article', ($, element) => {

        const link = element.find('header>a');
        const title = link.text();
        const href = link.attr('href') ?? '';
        const date = element.find('header>div>div>time').text();
        const tags = element
          .find('header>div>div>ul a')
          .map((_, tag) => $(tag))
          .map((_, tag) => tag.text().trim())
          .toArray();

        if (!tags.includes('.NET')) {
          core.info('Post does not have .NET tag. Continue scraping.');
          return;
        }

        return {
          title,
          href: this.getFullHref(href),
          categories: [this.Meziantou],
          author: this.author,
          date: moment(date, 'MM/DD/YYYY'),
          tags,
        };

      });
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this
      .fromHtmlPage(post.href)
      .enrichPost('main article', ($, element) => {

        const description = this.getDescription($, element);

        return {
          ...post,
          description,
        };

      });
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];
    const children = element
      .find('>div')
      .first()
      .children();

    for (const child of children) {
      if (child.name === 'p') {
        const p = $(child);
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

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.Meziantou.href + href;
    }

    return href;
  }
}
