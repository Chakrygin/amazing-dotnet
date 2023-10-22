import RssParser from 'rss-parser';

import { RssFeedHelper } from './RssFeedHelper';
import { ScraperBase } from './ScraperBase';

export abstract class RssFeedScraper extends ScraperBase {
  protected fromRssFeed<TFeed, TItem>(url: string, options: RssParser.ParserOptions<TFeed, TItem> = {}): RssFeedHelper<TFeed, TItem> {
    return new RssFeedHelper<TFeed, TItem>(url, options);
  }
}
