import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Author, Message, Source } from '../models';

export default class DotNetCoreTutorialsScraper implements Scraper {
  readonly name = 'DotNetCoreTutorials';
  readonly path = 'dotnetcoretutorials.com';

  private readonly source: Source = {
    title: '.NET Core Tutorials',
    href: 'https://dotnetcoretutorials.com/',
  };

  private readonly author: Author = {
    title: 'Wade Gausden',
    href: 'https://dotnetcoretutorials.com/about/',
  };

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.href, post.date)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      core.info('Sending post...');
      await sender.send(post);

      core.info('Storing post...');
      storage.add(post.href, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Message & Required<Pick<Message, 'date'>>, void> {
    core.info(`Parsing html page by url '${this.source.href}'...`);

    const response = await axios.get(this.source.href);
    const $ = cheerio.load(response.data);
    const articles = $('#content article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getImage(article);
      const title = article.find('h2.entry-title a');
      const date = article.find('time.entry-date').text();
      const description = this.getDescription(article, $);

      const post: Message & Required<Pick<Message, 'date'>> = {
        image: image,
        title: title.text().trim(),
        href: title.attr('href') ?? '',
        source: this.source,
        author: this.author,
        date: moment(date, 'LL'),
        description: description,
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const img = article.find('img');
    const width = img.attr('width');
    const height = img.attr('height');

    if (width && height) {
      if (parseInt(width) >= 320 && parseInt(height) >= 240) {
        return img.attr('data-lazy-src') ?? img.attr('src');
      }
    }
  }

  private getDescription(article: cheerio.Cheerio<cheerio.Element>, $: cheerio.CheerioAPI): string[] {
    const description = [];

    const elements = article
      .find('div.entry-content')
      .children();

    let length = 0;
    for (const element of elements) {
      if (element.type != 'tag') {
        continue;
      }

      let text = '';

      if (element.name == 'p') {
        if ($('br', element).length == 0) {
          text = $(element).text().trim();
        }
      }
      else if (element.name == 'ul') {
        text = $(element).children()
          .filter((_, e) => e.type == 'tag' && e.name == 'li')
          .map((_, e) => '- ' + $(e).text().trim())
          .toArray().join('\n');
      }

      if (!text) {
        break;
      }

      length += text.length;
      description.push(text);

      if (length >= 500 || description.length >= 10) {
        break;
      }
    }

    if (description.length > 0) {
      const text = description[description.length - 1];

      if (text.endsWith(':')) {
        description.push('…');
      }
    }

    return description;
  }
}
