import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { Scraper } from "../scrapers";
import { Sender } from "../senders";
import { Storage } from "../storage";
import { Blog, Post } from "../models";

const blogs = {
  'dotnet': '.NET Blog',
  'odata': 'OData',
  'nuget': 'The NuGet Blog',
  'typescript': 'TypeScript',
  'visualstudio': 'Visual Studio Blog',
  'commandline': 'Windows Command Line',
}

export class DevBlogsScraper implements Scraper {
  constructor(
    private readonly id: keyof typeof blogs) { }

  readonly name = `DevBlogs / ${blogs[this.id]}`;
  readonly path = `devblogs.microsoft.com/${this.id}`;

  private readonly blog: Blog = {
    title: blogs[this.id],
    link: `https://devblogs.microsoft.com/${this.id}/`,
  };

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
    const entries = $('#content .entry-box').toArray();

    if (entries.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    core.info(`Html page parsed. ${entries.length} posts found.`);

    for (let index = 0; index < entries.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const entry = $(entries[index]);
      const title = entry.find('.entry-title a');
      const image = entry.find('.entry-image img');
      const date = entry.find('.entry-post-date').text();
      const author = entry.find('.entry-author-link a');

      if (!date) {
        throw new Error('Failed to parse post. Date is empty.');
      }

      var timestamp = Date.parse(date);
      if (isNaN(timestamp)) {
        throw new Error('Failed to parse post. Date is invalid.');
      }

      const description = entry
        .find('.entry-content').contents()
        .filter((_, element) => element.type == 'text')
        .text().trim();

      const tags = entry
        .find('.card-tags-links .card-tags-linkbox a')
        .map((_, element) => $(element))
        .toArray();

      const post: Post = {
        image: image.attr('data-src') ?? '',
        title: title.text().trim(),
        link: title.attr('href') ?? '',
        blog: this.blog,
        author: {
          title: author.text().trim(),
          link: author.attr('href') ?? '',
        },
        date: new Date(timestamp),
        description: description,
        tags: tags.map(tag => {
          return {
            title: tag.text().trim(),
            link: tag.attr('href') ?? '',
          };
        }),
      };

      core.info(`Post parsed.`);
      core.info(`Post title is '${post.title}'.`);
      core.info(`Post link is '${post.link}'.`);

      yield post;
    }
  }
}
