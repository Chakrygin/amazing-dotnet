import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Category, Message, Source } from '../models';

const categories = {
  'category/how-tos': 'How-To\'s',
  'category/releases': 'Releases',
  'tag/net-annotated': '.NET Annotated',
};

export default class JetBrainsScraper implements Scraper {
  constructor(
    private readonly id: keyof typeof categories) { }

  readonly name = `JetBrains / ${categories[this.id]}`;
  readonly path = `blog.jetbrains.com/${this.id}`;

  private readonly source: Source = {
    title: 'The JetBrains Blog',
    href: 'https://blog.jetbrains.com/dotnet/',
  };

  private readonly category: Category = {
    title: categories[this.id],
    href: `https://blog.jetbrains.com/dotnet/${this.id}/`,
  };

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.href, post.date)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      const fullPost = await this.readFullPost(post);

      core.info('Sending post...');
      await sender.send(fullPost);

      core.info('Storing post...');
      storage.add(post.href, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Message & Required<Pick<Message, 'date'>>, void> {
    core.info(`Parsing html page by url '${this.category.href}'...`);

    const response = await axios.get(this.category.href);
    const $ = cheerio.load(response.data);
    const cards = $('.card_container a.card').toArray();

    if (cards.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${cards.length} posts found.`);

    for (let index = 0; index < cards.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const card = $(cards[index]);
      const image = card.find('> img.wp-post-image').attr('src');
      const title = card.find('.card__header h3');
      const date = card.find('.card__header time.publish-date').attr('datetime');
      const description = this.getDescription(card);

      const post: Message & Required<Pick<Message, 'date'>> = {
        image: image,
        title: title.text().trim(),
        href: card.attr('href') ?? '',
        source: this.source,
        categories: this.category,
        date: moment(date),
        description: description,
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getDescription(card: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = card.find('.card__body')
      .text()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);

    if (description.length > 0) {
      const text = description[description.length - 1];
      if (!text.endsWith('.')) {
        description[description.length - 1] = text + '…';
      }
    }

    return description;
  }

  private async readFullPost(post: Message & Required<Pick<Message, 'date'>>): Promise<Message & Required<Pick<Message, 'date'>>> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data);

    const image = post.image ?? $('.article-section .content figure.wp-block-image img').attr('src');
    const author = $('.post-info__text a');

    post = {
      image: image,
      title: post.title,
      href: post.href,
      source: post.source,
      categories: post.categories,
      author: {
        title: author.text().trim(),
        href: author.attr('href') ?? '',
      },
      date: post.date,
      description: post.description,
    };

    return post;
  }
}
