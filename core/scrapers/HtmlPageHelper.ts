import * as core from '@actions/core';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { Post } from '../models';
import { writeFileSync } from 'fs';

export class HtmlPageHelper {
  constructor(
    private readonly url: string) { }

  async * fetchPosts<TReader>(
    readerType: (new ($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>) => TReader) & {
      readonly selector: string;
    },
    read: (reader: TReader) => Post | undefined,
  ): AsyncGenerator<Post> {
    core.info(`Parsing html page by url ${this.url}...`);

    const response = await axios.get(this.url);
    const $ = cheerio.load(response.data as string);
    const elements = $<cheerio.Element, string>(readerType.selector);

    writeFileSync('C:\\Users\\igor\\Desktop\\maoni.html', response.data as string);

    if (elements.length == 0) {
      throw new Error(`Failed to parse html page by url ${this.url}. No posts found.`);
    }

    core.info(`Posts found: ${elements.length}.`);

    for (let index = 0; index < elements.length; index++) {
      core.info(`Parsing post at index ${index}...`);

      const element = $(elements[index]);
      const reader = new readerType($, element);
      const post = read(reader);

      if (post) {
        yield post;
      }
    }
  }

  async enrichPost<TReader>(
    readerType: (new ($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>) => TReader) & {
      readonly selector: string;
    },
    read: (reader: TReader) => Post | undefined,
  ): Promise<Post | undefined> {
    core.info(`Parsing html page by url ${this.url}...`);

    const response = await axios.get(this.url);
    const $ = cheerio.load(response.data as string);
    const elements = $<cheerio.Element, string>(readerType.selector);

    if (elements.length == 0) {
      throw new Error(`Failed to parse html page by url ${this.url}. No posts found.`);
    }

    if (elements.length > 1) {
      throw new Error(`Failed to parse html page by url ${this.url}. More than one post found.`);
    }

    const element = $(elements[0]);
    const reader = new readerType($, element);
    const post = read(reader);

    return post;
  }
}

