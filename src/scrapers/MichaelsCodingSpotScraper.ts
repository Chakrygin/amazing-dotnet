import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class MichaelsCodingSpotScraper extends HtmlPageScraper {
  readonly name = 'MichaelsCodingSpot';
  readonly path = 'michaelscodingspot.com';
  readonly author = 'Michael Shpilt';

  private readonly MichaelsCodingSpot: Link = {
    title: 'Michael\'s Coding Spot',
    href: 'https://michaelscodingspot.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.MichaelsCodingSpot.href)
      .fetchPosts(MichaelsCodingSpotFetchReader, reader => {
        const post: Post = {
          image: this.getFullHref(reader.image),
          title: reader.title,
          href: this.getFullHref(reader.href),
          categories: [
            this.MichaelsCodingSpot,
          ],
          author: this.author,
          date: moment(reader.getDate(), 'MMM DD, YYYY', 'en'),
          description: [
            reader.description,
          ],
          links: [
            {
              title: 'Read more',
              href: this.getFullHref(reader.href),
            },
          ],
        };

        return post;
      });
  }

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.MichaelsCodingSpot.href + href;
    }

    return href;
  }
}

class MichaelsCodingSpotFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = 'main section.article-list';

  readonly image = this.article.find('>a>img').attr('src') ?? '';
  readonly title = this.article.find('>a>h2').text();
  readonly href = this.article.find('>a').attr('href') ?? '';
  readonly description = this.article.find('>.summary').text().trim();

  getDate(): string {
    const text = this.article.find('.post-meta-list').text().trim();
    const match = text.match(/\w+ \d+, \d+$/);
    const date = match?.at(0) ?? '';

    return date;
  }
}
