import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import { Scraper } from 'core/scrapers';
import { Post, Link } from 'core/posts';

export default class EnterpriseCraftsmanshipScraper implements Scraper {
  readonly name = 'EnterpriseCraftsmanship';
  readonly path = 'enterprisecraftsmanship.com';

  private readonly blog: Link & Required<Pick<Post, 'author'>> = {
    title: 'Enterprise Craftsmanship',
    href: 'https://enterprisecraftsmanship.com/posts',
    author: 'Vladimir Khorikov',
  };

  async *scrape(): AsyncGenerator<Post> {
    core.info(`Parsing html page by url '${this.blog.href}'...`);

    const response = await axios.get(this.blog.href);
    const $ = cheerio.load(response.data as string);
    const articles = $('main .catalogue a.catalogue-item').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. Number of posts found is ${articles.length}.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const title = article.find('h1.catalogue-title').text();
      const href = article.attr('href') ?? '';
      const date = article.find('time.catalogue-time').text();
      const description = article.find('p')
        .map((_, p) => $(p).text().trim())
        .filter((_, text) => !!text)
        .toArray();

      const post: Post = {
        title,
        href,
        categories: [
          this.blog,
        ],
        author: this.blog.author,
        date: moment(date, 'LL'),
        description,
        links: [
          {
            title: 'Read more',
            href: href,
          },
        ],
      };

      yield post;
    }
  }
}
