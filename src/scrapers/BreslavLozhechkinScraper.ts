import * as cheerio from 'cheerio';
import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class BreslavLozhechkinScraper extends ScraperBase {
  readonly name = 'BreslavLozhechkin';
  readonly path = 'breslav-lozhechkin.mave.digital';

  private readonly BreslavLozhechkin: Link = {
    title: 'Бреслав и Ложечкин',
    href: 'https://breslav-lozhechkin.mave.digital',
  };

  protected fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.BreslavLozhechkin.href)
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
          categories: [this.BreslavLozhechkin],
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
          links: [
            ...links,
            {
              title: 'Слушать на Mave',
              href: post.href,
            }
          ],
        };

        return post;
      });
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string {
    const node = element
      .find('div.episodes-info__body>div.description.html-content')
      .contents()
      .first();

    const description = $(node).text();
    return description;
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

    return result;
  }

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.BreslavLozhechkin.href + href;
    }

    return href;
  }
}
