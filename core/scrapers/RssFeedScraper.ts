import * as core from '@actions/core';

import RssParser from 'rss-parser';

import { Post } from '../models';
import { ScraperBase } from './ScraperBase';

export abstract class RssFeedScraper extends ScraperBase {
  protected async *readPostsFromRssFeed<T, U>(
    parser: RssParser<T, U>,
    url: string,
    readPost: (feed: RssParser.Output<U> & T, item: RssParser.Item & U) => Post,
  ): AsyncGenerator<Post> {

    core.info(`Parsing rss feed by url ${url}...`);

    const feed = await parser.parseURL(url);

    if (feed.items.length == 0) {
      throw new Error(`Failed to parse rss feed by url ${url}. No posts found.`);
    }

    core.info(`Rss feed parsed. Number of posts found is ${feed.items.length}.`);

    for (let index = 0; index < feed.items.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const item = feed.items[index];
      const post = readPost(feed, item);

      yield post;
    }
  }
}
