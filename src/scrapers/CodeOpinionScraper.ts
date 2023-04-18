import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class CodeOpinionScraper extends HtmlPageScraper {
  readonly name = 'CodeOpinion';
  readonly path = 'codeopinion.com';
  readonly author = 'Derek Comartin';

  private readonly CodeOpinion: Link = {
    title: 'CodeOpinion',
    href: 'https://codeopinion.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.CodeOpinion.href)
      .fetchPosts(CodeOpinionFetchReader, reader => {
        const post: Post = {
          image: reader.getImage(),
          title: reader.title,
          href: reader.href,
          categories: [
            this.CodeOpinion,
          ],
          author: this.author,
          date: moment(reader.date, 'LL', 'en'),
          description: reader.getDescription(),
          links: [
            {
              title: 'Read more',
              href: reader.href,
            },
          ],
        };

        return post;
      });
  }
}

class CodeOpinionFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly article: cheerio.Cheerio<cheerio.Element>) { }

  static selector = '#main article';

  readonly link = this.article.find('h2.entry-title a');
  readonly title = this.link.text();
  readonly href = this.link.attr('href') ?? '';
  readonly date = this.article.find('time.entry-date').text();

  getImage(): string | undefined {
    const href = this.article
      .find('.container-youtube a[href^=https://www.youtube.com/]')
      .attr('href');

    if (href) {
      const index = href.indexOf('?');

      if (index > 0) {
        const query = href.substring(index + 1);
        const pairs = query.split('&');

        for (const pair of pairs) {
          const [name, value] = pair.split('=');

          if (name == 'v') {
            return `https://img.youtube.com/vi/${value}/maxresdefault.jpg`;
          }
        }
      }
    }
  }

  getDescription(): string[] {
    const description = [];
    const elements = this.article
      .find('div.entry-content')
      .children();

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
