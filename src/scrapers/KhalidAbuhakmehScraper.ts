import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class KhalidAbuhakmehScraper implements Scraper {
  readonly name = 'KhalidAbuhakmeh';
  readonly path = 'khalidabuhakmeh.com';

  private readonly blog: Link = {
    title: 'Khalid Abuhakmeh',
    href: 'https://khalidabuhakmeh.com'
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data as string);
    const articles = $('#page article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. Number of posts found is ${articles.length}.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getImage(article);
      const link = article.find('h2.post-title a');
      const title = link.text();
      const href = this.getFullHref(link.attr('href')) ?? '';
      const date = article.find('time.published').text();
      const description = this.getDescription(article, $);
      const tags = article
        .find('.post-content .post-tags a')
        .map((_, element) => $(element).text().replace(/^#/, ''))
        .toArray();

      const post: Post = {
        image: image,
        title: title,
        href: href,
        categories: [
          this.blog,
        ],
        date: moment(date, 'LL'),
        description: description,
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
        tags,
      };

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    let src = article.find('.post-thumbnail img').attr('src');
    if (src) {
      const index = src.lastIndexOf('https://');
      if (index > 0) {
        src = src.substring(index);
      }
    }

    return src;
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = article
      .find('.post-content')
      .children();

    for (const element of elements) {
      if (element.name == 'p') {
        const p = $(element);

        if (p.hasClass('post-tags') || p.hasClass('read-more')) {
          break;
        }

        const text = p.text().trim();
        description.push(text);
      }
      else {
        break;
      }
    }

    return description;
  }

  private getFullHref(href: string | undefined): string | undefined {
    if (href?.startsWith('/')) {
      href = this.blog.href + href;
    }

    return href;
  }
}
