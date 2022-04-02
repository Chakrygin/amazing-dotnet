import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { Scraper } from "../scrapers";
import { Sender } from "../senders";
import { Storage } from "../storage";
import { Blog, Post, Tag } from "../models";

export class KhalidAbuhakmehScraper implements Scraper {
  readonly name = 'Khalid Abuhakmeh';
  readonly path = 'khalidabuhakmeh.com';

  private readonly blog: Blog = {
    title: 'Khalid Abuhakmeh',
    link: 'https://khalidabuhakmeh.com/'
  }

  async scrape(storage: Storage, sender: Sender): Promise<void> {
    for await (const post of this.readPosts()) {
      core.info('Post already exists in storage. Break scraping.');
      if (storage.has(post.link, post.date)) {
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
    const articles = $('#page article').toArray();

    if (articles.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${articles.length} posts found.`);

    for (let index = 0; index < articles.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const article = $(articles[index]);
      const title = article.find('h2.post-title a');
      const date = article.find('time.published').text();

      if (!date) {
        throw new Error('Failed to parse post. Date is empty.');
      }

      var timestamp = Date.parse(date);
      if (isNaN(timestamp)) {
        throw new Error('Failed to parse post. Date is invalid.');
      }

      const image = this.getImage(article);
      const link = this.getLink(title);
      const description = this.getDescription($, article);
      const tags = this.getTags($, article);

      const post: Post = {
        image: image,
        title: title.text().trim(),
        link: link,
        blog: this.blog,
        date: new Date(timestamp),
        description: description,
        tags: tags,
      };

      core.info(`Post parsed.`);
      core.info(`Post title is '${post.title}'.`);
      core.info(`Post link is '${post.link}'.`);

      yield post;
    }
  }

  private getImage(article: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const img = article.find('.post-thumbnail img');

    let src = img.attr('src');
    if (src) {
      const index = src.lastIndexOf('https://');
      if (index > 0) {
        src = src.substring(index);
      }
    }

    return src;
  }

  private getLink(title: cheerio.Cheerio<cheerio.Element>): string {
    let href = title.attr('href');
    if (href && href.startsWith('/')) {
      href = this.blog.link + href.substring(1);
    }

    return href ?? '';
  }

  private getDescription($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];
    const content = article
      .find('.post-content')
      .children();

    for (const element of content) {
      if (element.name == 'p') {
        const p = $(element);

        if (p.hasClass('post-tags') || p.hasClass('read-more')) {
          break;
        }

        const text = p.text().trim();
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

  private getTags($: cheerio.CheerioAPI, article: cheerio.Cheerio<cheerio.Element>): Tag[] | undefined {
    const tags = article
      .find('.post-content .post-tags a')
      .map((_, element) => $(element));

    if (tags.length > 0) {
      const result = [];

      for (const tag of tags) {
        let text = tag.text().trim();
        if (text.startsWith('#')) {
          text = text.substring(1);
        }

        let href = tag.attr('href');
        if (href && href.startsWith('/')) {
          href = this.blog.link + href.substring(1);
        }

        result.push({
          title: text,
          link: href ?? '',
        });
      }

      return result;
    }
  }
}
