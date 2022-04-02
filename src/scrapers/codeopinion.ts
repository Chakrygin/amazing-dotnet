import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { Scraper } from "../scrapers";
import { Sender } from "../senders";
import { Storage } from "../storage";
import { Author, Blog, Post, Tag } from "../models";

export class CodeOpinionScraper implements Scraper {
  readonly name = 'CodeOpinion';
  readonly path = 'codeopinion.com';

  private readonly blog: Blog = {
    title: 'CodeOpinion',
    link: 'https://codeopinion.com/'
  }

  private readonly author: Author = {
    title: 'Derek Comartin',
    link: 'https://mvp.microsoft.com/en-us/PublicProfile/5002380'
  }

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      if (storage.has(post.link, post.date)) {
        core.info('Post already exists in storage. Break scraping.');
        break;
      }

      core.info('Sending post...');
      await sender.sendPost(post);

      core.info('Storing post...');
      storage.add(post.link, post.date);
    }
  }

  private async *readPosts(): AsyncGenerator<Post, void> {
    core.info(`Parsing html page by url '${this.blog.link}'...`);

    const response = await axios.get(this.blog.link);
    const $ = cheerio.load(response.data);
    const articles = $('#main article').toArray();

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

      const image = this.getImage(article);
      const description = this.getDescription($, content);

      const post: Post = {
        image: image,
        title: title.text().trim(),
        link: title.attr('href') ?? '',
        blog: this.blog,
        author: this.author,
        date: new Date(timestamp),
        description: description,
      };

      core.info(`Post parsed.`);
      core.info(`Post title is '${post.title}'.`);
      core.info(`Post link is '${post.link}'.`);

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const link = article.find('.container-youtube a[href^=https://www.youtube.com/]');
    const href = link.attr('href');

    if (href) {
      const index = href.indexOf('?');
      if (index > 0) {
        const query = href.substring(index + 1);
        const pairs = query.split('&');

        for (const pair of pairs) {
          const [name, value] = pair.split('=');
          if (name == 'v') {
            return `https://img.youtube.com/vi/${value}/maxresdefault.jpg`
          }
        }

        return query;
      }
    }
  }

  private getDescription($: cheerio.CheerioAPI, content: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];

    for (const element of content.children()) {
      if (element.name == 'p') {
        const text = $(element).text().trim();
        if (text) {
          description.push(text);
        }
      }
      else {
        break;
      }
    }

    return description;
  }
}
