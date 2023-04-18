import * as core from '@actions/core';

import RssParser from 'rss-parser';

import { Post } from '../models';

export class RssFeedHelper<TFeed, TItem> {
  constructor(
    private readonly url: string,
    private readonly options: RssParser.ParserOptions<TFeed, TItem>) { }

  async * fetchPosts<TReader>(
    readerClass: new (feed: RssParser.Output<TItem> & TFeed, item: RssParser.Item & TItem) => TReader,
    read: (reader: TReader) => Post | undefined,
  ): AsyncGenerator<Post> {
    core.info(`Parsing rss feed by url ${this.url}...`);

    const parser = new RssParser(this.options);
    const feed = await parser.parseURL(this.url);

    if (feed.items.length == 0) {
      throw new Error(`Failed to parse rss feed by url ${this.url}. No posts found.`);
    }

    core.info(`Posts found: ${feed.items.length}.`);

    for (let index = 0; index < feed.items.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const item = feed.items[index];
      const reader = new readerClass(feed, item);
      const post = read(reader);

      if (post) {
        yield post;
      }
    }
  }
}
