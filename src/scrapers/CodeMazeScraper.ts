import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';

import Scraper from './Scraper';
import Storage from '../Storage';
import Sender from '../senders/Sender';

import { Author, Message, Source } from '../models';

export default class CodeMazeScraper implements Scraper {
  readonly name = 'CodeMaze';
  readonly path = 'code-maze.com';

  private readonly source: Source = {
    title: 'Code Maze',
    href: 'https://code-maze.com/',
  };

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.href)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      core.info('Sending post...');
      await sender.send(post);

      core.info('Storing post...');
      storage.add(post.href);
    }
  }

  private async *readPosts(): AsyncGenerator<Message, void> {
    core.info(`Parsing html page by url '${this.source.href}'...`);

    const response = await axios.get(this.source.href);
    const $ = cheerio.load(response.data);
    const articles = $('.homePage_LatestPost article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const image = this.getImage(article);
      const title = article.find('h2.entry-title a');
      const author = this.getAuthor(article);
      const date = this.getDate(article);
      const description = article.find('.post-content-inner').text().trim();

      const post: Message = {
        image: image,
        title: title.text().trim(),
        href: title.attr('href') ?? '',
        source: this.source,
        author: author,
        date: moment(date, 'LL'),
        description: description,
      };

      core.info(`Post title is '${post.title}'.`);
      core.info(`Post href is '${post.href}'.`);

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    let src = article.find('.et_pb_image_container img').attr('src');
    if (src) {
      src = src.replace(/-\d+x\d+(\.\w+)$/, '$1');
    }

    return src;
  }

  private getDate(article: cheerio.Cheerio<cheerio.Element>): string {
    let date = article.find('.post-meta .published').text();
    if (date) {
      date = date.replace('Updated Date', '');
    }

    return date.trim();
  }

  private getAuthor(article: cheerio.Cheerio<cheerio.Element>): Author | undefined {
    const author = article.find('.post-meta .author a');
    const title = author.text().trim();
    const href = author.attr('href') ?? '';

    if (title !== 'Code Maze') {
      return { title, href };
    }
  }
}
