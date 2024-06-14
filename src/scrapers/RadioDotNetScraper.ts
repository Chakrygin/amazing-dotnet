import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class RadioDotNetScraper extends ScraperBase {
  readonly name = 'RadioDotNet';
  readonly path = 'radiodotnet.mave.digital';

  private readonly RadioDotNet: Link = {
    title: 'RadioDotNet',
    href: 'https://radiodotnet.mave.digital',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.RadioDotNet.href)
      .fetchPosts('.episodes-season__body a.episode', ($, element) => {

        const image = $('.sidebar__header .img-wrapper img').attr('src') ?? '';
        const release = element.find('.episode-body__content .release').text().trim();
        const title = element.find('.episode-body__content .description').text().trim();
        const href = element.attr('href') ?? '';
        const date = element.find('.episode-body__content .date').text();

        return {
          image,
          title: `${release}. ${title}`,
          href: this.getFullHref(href),
          categories: [this.RadioDotNet],
          date: moment(date, 'LL', 'ru'),
        };

      });
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this
      .fromHtmlPage(post.href)
      .enrichPost('main>div.single-page-wrapper', ($, element) => {

        const description = this.getDescription($, element);
        const links = this.getLinks($, element);

        post = {
          ...post,
          description: [description],
          links: links,
        };

        return post;
      });
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string {
    const description = [];
    const regexp = /^\[\d{2}:\d{2}:\d{2}\]/;
    const lines = element
      .find('div.episodes-info__body>div.description>p')
      .map((_, line) => $(line).text().trim());

    for (const line of lines) {
      if (regexp.test(line)) {
        description.push(line);
      }
    }

    if (description.length > 0) {
      return description.join('\n');
    }

    return $('.sidebar__body p.description').text().trim();
  }

  private getLinks($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): Link[] {
    const result: Link[] = [];
    const links = element
      .find('.listen a.listen-platform-wrapper')
      .filter('.yandex-music, .youtube')
      .map((_, link) => $(link));

    for (const link of links) {
      const href = link.hasClass('yandex-music')
        ? link.attr('href')?.replace('music.yandex.com', 'music.yandex.ru')
        : link.attr('href');

      if (href) {
        if (link.hasClass('yandex-music')) {
          result.push({
            title: 'Слушать на Яндекс.Музыке',
            href
          });
        }
        else if (link.hasClass('youtube')) {
          result.push({
            title: 'Слушать на YouTube',
            href
          });
        }
      }
    }

    result.push({
      title: 'Поддержать на Boosty',
      href: 'https://boosty.to/radiodotnet'
    });

    return result;
  }

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.RadioDotNet.href + href;
    }

    return href;
  }
}
