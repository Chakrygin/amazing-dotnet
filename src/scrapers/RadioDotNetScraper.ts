import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '../../core/models';
import { HtmlPageScraper } from '../../core/scrapers';

export class RadioDotNetScraper extends HtmlPageScraper {
  readonly name = 'RadioDotNet';
  readonly path = 'radiodotnet.mave.digital';

  private readonly RadioDotNet: Link = {
    title: 'RadioDotNet',
    href: 'https://radiodotnet.mave.digital',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.RadioDotNet.href)
      .fetchPosts(RadioDotNetFetchReader, reader => {
        const post: Post = {
          image: reader.image,
          title: `${reader.release}. ${reader.title}`,
          href: this.getFullHref(reader.href),
          categories: [
            this.RadioDotNet,
          ],
          date: moment(reader.date, 'LL', 'ru'),
          links: [
            {
              title: 'Слушать',
              href: this.getFullHref(reader.href),
            },
          ],
        };

        return post;
      });
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this
      .fromHtmlPage(post.href)
      .enrichPost(RadioDotNetEnrichReader, reader => {
        post = {
          ...post,
          description: [
            reader.getDescription(),
          ],
          links: [
            ...post.links,
            ...reader.getLinks(),
          ],
        };

        return post;
      });
  }

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.RadioDotNet.href + href;
    }

    return href;
  }
}

class RadioDotNetFetchReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly episode: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = '.episodes-season__body a.episode';

  readonly image = this.$('.sidebar__header .img-wrapper img').attr('src') ?? '';
  readonly release = this.episode.find('.episode-body__content .release').text().trim();
  readonly title = this.episode.find('.episode-body__content .description').text().trim();
  readonly href = this.episode.attr('href') ?? '';
  readonly date = this.episode.find('.episode-body__content .date').text();
}

class RadioDotNetEnrichReader {
  constructor(
    private readonly $: cheerio.CheerioAPI,
    private readonly episode: cheerio.Cheerio<cheerio.Element>) { }

  static readonly selector = 'main>div.single-page-wrapper';

  getDescription(): string {
    const description = [];
    const regexp = /^\[\d{2}:\d{2}:\d{2}\]/;
    const elements = this.episode
      .find('div.episodes-info__body>div.description>p')
      .toArray();

    for (const element of elements) {
      const p = this.$(element);
      const line = p.text().trim();

      if (regexp.test(line)) {
        description.push(line);
      }
    }

    if (description.length > 0) {
      return description.join('\n');
    }

    return this.$('.sidebar__body p.description').text().trim();
  }

  getLinks(): Link[] {
    const links: Link[] = [];
    const elements = this.episode
      .find('.listen a.listen-platform-wrapper')
      .filter('.yandex-music, .youtube');

    for (const element of elements) {
      const link = this.$(element);
      const title = link.text();
      const href = link.hasClass('yandex-music')
        ? link.attr('href')?.replace('music.yandex.com', 'music.yandex.ru')
        : link.attr('href');

      if (title && href) {
        links.push({ title, href });
      }
    }

    return links;
  }
}
