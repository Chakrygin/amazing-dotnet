import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { Post } from '../models';
import { ScraperBase } from './ScraperBase';

export abstract class HtmlPageScraper extends ScraperBase {
  protected async *readPostsFromHtmlPage(
    url: string,
    selector: string,
    readPost: ($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>) => Post,
  ): AsyncGenerator<Post> {
    core.info(`Parsing html page by url ${url}...`);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data as string);
    const elements = $<cheerio.Element, string>(selector).toArray();

    if (elements.length == 0) {
      throw new Error(`Failed to parse html page by url ${url}. No posts found.`);
    }

    core.info(`Html page parsed. Number of posts found is ${elements.length}.`);

    for (let index = 0; index < elements.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const element = $(elements[index]);
      const post = readPost($, element);

      yield post;
    }
  }

  protected async readPostFromHtmlPage(
    url: string,
    selector: string,
    readPost: ($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>) => Post,
  ): Promise<Post> {
    core.info(`Parsing html page by url ${url}...`);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data as string);
    const elements = $<cheerio.Element, string>(selector).toArray();

    if (elements.length == 0) {
      throw new Error(`Failed to parse html page by url ${url}. No post found.`);
    }

    if (elements.length > 1) {
      throw new Error(`Failed to parse html page by url ${url}. More than one post found.`);
    }

    const element = $(elements[0]);
    const post = readPost($, element);

    return post;
  }
}
