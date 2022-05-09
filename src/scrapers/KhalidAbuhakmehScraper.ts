import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Message, Source } from '../models';

export default class KhalidAbuhakmehScraper implements Scraper {
  readonly name = 'KhalidAbuhakmeh';
  readonly path = 'khalidabuhakmeh.com';

  private readonly source: Source = {
    title: 'Khalid Abuhakmeh',
    href: 'https://khalidabuhakmeh.com/'
  };

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const message of this.getMessages()) {
      if (storage.has(message.href, message.date)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      core.info('Sending post...');
      await sender.send(message);

      core.info('Storing post...');
      storage.add(message.href, message.date);
    }
  }

  private async *getMessages(): AsyncGenerator<Message & Required<Pick<Message, 'date'>>, void> {
    core.info(`Parsing html page by url '${this.source.href}'...`);

    const response = await axios.get(this.source.href);
    const $ = cheerio.load(response.data);
    const articles = $('#page article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getImage(article);
      const title = article.find('h2.post-title a');
      const date = article.find('time.published').text();
      const description = this.getDescription(article, $);

      const tags = article
        .find('.post-content .post-tags a')
        .map((_, element) => $(element))
        .toArray();

      const post: Message & Required<Pick<Message, 'date'>> = {
        image: image,
        title: title.text().trim(),
        href: this.getFullHref(title.attr('href')) ?? '',
        source: this.source,
        date: moment(date, 'LL'),
        description: description,
        tags: tags.map(tag => ({
          title: tag.text().replace(/^#/, '') ?? '',
          href: this.getFullHref(tag.attr('href')) ?? '',
        })),
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

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
    if (href && href.startsWith('/')) {
      href = this.source.href + href.substring(1);
    }

    return href;
  }
}
