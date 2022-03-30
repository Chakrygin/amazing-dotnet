import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { Scraper } from "./abstractions";
import { Sender } from "../senders/abstractions";
import { Storage } from "../storage";
import { Author, Blog, Post, Tag } from "../models";

const blog: Blog = {
  title: '.NET Core Tutorials',
  link: 'https://dotnetcoretutorials.com/page/2/'
}

const author: Author = {
  title: 'Wade Gausden',
  link: 'https://dotnetcoretutorials.com/about/'
}

export class DotNetCoreTutorialsScraper implements Scraper {
  readonly name = 'DotNetCoreTutorials';
  readonly path = 'dotnetcoretutorials.com';

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.link, post.date)) {
        break;
      }

      await sender.sendPost(post);

      storage.add(post.link, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${blog.link}'...`);

    const response = await axios.get(blog.link);
    const $ = cheerio.load(response.data);
    const articles = $('#content article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const title = article.find('h2.entry-title a');
      const date = article.find('time.entry-date').text();
      const content = article.find('div.entry-content');

      if (!date) {
        throw new Error('Failed to parse post. Date is empty.');
      }

      var timestamp = Date.parse(date);
      if (isNaN(timestamp)) {
        throw new Error('Failed to parse post. Date is invalid.');
      }

      const image = this.getImage($, article);
      const description = this.getDescription($, content);

      const post: Post = {
        image: image,
        title: title.text().trim(),
        link: title.attr('href') ?? '',
        blog: blog,
        author: author,
        date: new Date(timestamp),
        description: description,
      };

      core.info(`Post parsed. Title: '${post.title}'.`);

      yield post;
    }
  }

  private getImage($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const img = article.find('img');

    const width = img.attr('width');
    if (!width || parseInt(width) < 320) {
      return undefined;
    }

    const height = img.attr('height');
    if (!height || parseInt(height) < 240) {
      return undefined;
    }

    const src = img.attr('data-lazy-src') ?? img.attr('src') ?? '';
    const success =
      src.startsWith('https://') && (
        src.endsWith('.gif') ||
        src.endsWith('.jpg') ||
        src.endsWith('.jpeg') ||
        src.endsWith('.png'));

    if (!success) {
      return undefined;
    }

    return src;
  }

  private getDescription($: cheerio.CheerioAPI, content: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];

    var length = 0;
    for (const element of content.children()) {
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

      if (length > 500 || description.length > 10) {

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
