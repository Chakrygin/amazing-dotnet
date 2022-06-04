import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';
import { Category, Post } from '../models';

import ScraperBase from './ScraperBase';

const categories = {
  'how-tos': 'How-To\'s',
  'releases': 'Releases',
  'net-annotated': '.NET Annotated',
};

export default class JetBrainsScraper extends ScraperBase {
  constructor(
    private readonly id: keyof typeof categories) {
    super();
  }

  readonly name = `JetBrains / ${categories[this.id]}`;
  readonly path = `blog.jetbrains.com/${this.id}`;

  private readonly blog: Category = {
    title: 'The JetBrains Blog',
    href: 'https://blog.jetbrains.com/dotnet/',
  };

  private readonly category: Category = {
    title: categories[this.id],
    href: this.id === 'net-annotated'
      ? `https://blog.jetbrains.com/dotnet/tag/${this.id}/`
      : `https://blog.jetbrains.com/dotnet/category/${this.id}/`,
  };

  protected override async *readPosts(): AsyncGenerator<Post, void> {
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
      const href = card.attr('href') ?? '';
      const date = card.find('.card__header time.publish-date').attr('datetime');
      const description = this.getDescription(card);

      const post: Post = {
        image: image,
        title: title.text(),
        href: href,
        categories: [
          this.blog,
          this.category,
        ],
        date: moment(date),
        description: [
          ...description,
          `Read: ${href}`,
        ],
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
      .filter(line => !!line);

    if (description.length > 0) {
      const text = description[description.length - 1];
      if (!text.endsWith('.')) {
        description[description.length - 1] = text + '…';
      }
    }

    return description;
  }

  protected override  async enrichPost(post: Post): Promise<Post> {
    core.info(`Parsing html page by url '${post.href}'...`);

    const response = await axios.get(post.href);
    const $ = cheerio.load(response.data);

    let image = post.image;
    if (!image) {
      image = $('.article-section .content figure.wp-block-image img').attr('src');
    }

    post = {
      image: image,
      title: post.title,
      href: post.href,
      categories: post.categories,
      date: post.date,
      description: post.description,
    };

    return post;
  }
}
