import * as core from '@actions/core';

import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class MeziantouScraper extends HtmlPageScraper {
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
      .fetchPosts(MeziantouFetchReader, reader => {
        if (!reader.tags.includes('.NET')) {
          core.info('Post does not have .NET tag. Continue scraping.');
          return;
        }

        const post: Post = {
          title: reader.title,
          href: this.getFullHref(reader.href),
          categories: [
            this.Meziantou,
          ],
          author: this.author,
          date: moment(reader.date, 'MM/DD/YYYY'),
          links: [
            {
              title: 'Read more',
              href: this.getFullHref(reader.href),
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
      .enrichPost(MeziantouEnrichReader, reader => {
        post = {
          ...post,
          description: reader.getDescription(),
        };

        return post;
      });
  }

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.Meziantou.href + href;
    }

    return href;
  }
}

class MeziantouFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = 'main article';

  readonly link = this.article.find('header>a');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';
  readonly date = this.article.find('header>div>div>time').text();
  readonly tags = this.article
    .find('header>div>div>ul a')
    .map((_, element) => this.$(element))
    .map((_, tag) => tag.text().trim())
    .toArray();
}

class MeziantouEnrichReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = 'main article';

  getDescription(): string[] {
    const description = [];
    const elements = this.article
      .find('>div')
      .first()
      .children();

    for (const element of elements) {
      if (element.name === 'p') {
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
