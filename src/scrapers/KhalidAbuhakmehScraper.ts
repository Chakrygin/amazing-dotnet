import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class KhalidAbuhakmehScraper extends HtmlPageScraper {
  readonly name = 'KhalidAbuhakmeh';
  readonly path = 'khalidabuhakmeh.com';

  private readonly KhalidAbuhakmeh: Link = {
    title: 'Khalid Abuhakmeh',
    href: 'https://khalidabuhakmeh.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.KhalidAbuhakmeh.href)
      .fetchPosts(KhalidAbuhakmehFetchReader, reader => {
        const post: Post = {
          image: reader.getImage(),
          title: reader.title,
          href: this.getFullHref(reader.href),
          categories: [
            this.KhalidAbuhakmeh,
          ],
          date: moment(reader.date, 'LL'),
          description: reader.getDescription(),
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

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.KhalidAbuhakmeh.href + href;
    }

    return href;
  }
}

class KhalidAbuhakmehFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '#page article';

  readonly link = this.article.find('h2.post-title a');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';
  readonly date = this.article.find('time.published').text();
  readonly tags = this.article
    .find('.post-content .post-tags a')
    .map((_, element) => this.$(element).text().replace(/^#/, ''))
    .toArray();

  getImage(): string | undefined {
    let src = this.article.find('.post-thumbnail img').attr('src');

    if (src) {
      const index = src.lastIndexOf('https://');

      if (index > 0) {
        src = src.substring(index);
      }
    }

    return src;
  }

  getDescription(): string[] {
    const description = [];
    const elements = this.article
      .find('.post-content')
      .children();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = this.$(element);

        if (p.hasClass('post-tags') || p.hasClass('read-more')) {
          break;
        }

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
