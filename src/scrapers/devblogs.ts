import axios from 'axios';
import * as cheerio from 'cheerio';

import { Scraper } from "./abstractions";
import { Sender } from "../senders/abstractions";
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
  constructor(id: keyof typeof blogs) {
    this.name = `DevBlogs / ${blogs[id]}`;
    this.path = `devblogs.microsoft.com/${id}`;
    this.blog = {
      title: blogs[id],
      link: `https://devblogs.microsoft.com/${id}/`,
    }
  }

  readonly name: string;
  readonly path: string;

  private readonly blog: Blog;

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
    console.log(`Download html page by url '${this.blog.link}'.`);

    const response = await axios.get(this.blog.link);
    const $ = cheerio.load(response.data);
    const entries = $('#content .entry-box').toArray();

    if (entries.length == 0) {
      throw new Error('Failed to parse html page. No posts found.');
    }

    for (let index = 0; index < entries.length; index++) {
      console.log(`Parse post at index ${index}.`);

      const entry = $(entries[index]);
      const title = entry.find('.entry-title a');
      const image = entry.find('.entry-image img');
      const date = entry.find('.entry-post-date');
      const author = entry.find('.entry-author-link a');

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
        date: new Date(date.text()),
        description: description,
        tags: tags.map(tag => {
          return {
            title: tag.text().trim(),
            link: tag.attr('href') ?? '',
          };
        }),
      };

      yield post;
    }
  }
}
