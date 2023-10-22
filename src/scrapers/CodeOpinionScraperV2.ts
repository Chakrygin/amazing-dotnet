import moment from 'moment';
import RssParser from 'rss-parser';

import { Link, Post } from '../../core/models';
import { RssFeedScraper } from '../../core/scrapers';

export class CodeOpinionScraperV2 extends RssFeedScraper {
  readonly name = 'CodeOpinion';
  readonly path = 'codeopinion.com';
  readonly author = 'Derek Comartin';

  private readonly CodeOpinion: Link = {
    title: 'CodeOpinion',
    href: 'https://codeopinion.com',
  };

  protected fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromRssFeed(this.CodeOpinion.href + '/feed/', {
        customFields: {
          item: [
            ['content:encoded', 'content:encoded'],
          ],
        },
      })
      .fetchPosts(CodeOpinionFetchReader, reader => {
        const post = {
          image: reader.getImage(),
          title: reader.title,
          href: reader.href,
          categories: [
            this.CodeOpinion,
          ],
          author: this.author,
          date: moment(reader.date),
          description: reader.getDescription(),
          links: [
            {
              title: 'Read more',
              href: reader.href,
            },
          ],
          tags: reader.tags,
        };

        return post;
      });
  }
}


class CodeOpinionFetchReader<T extends { 'content:encoded': string }> {
  constructor(
    private readonly feed: RssParser.Output<T>,
    private readonly item: RssParser.Item & T) { }

  readonly title = this.item.title ?? '';
  readonly href = this.item.link ?? '';
  readonly date = this.item.pubDate ?? '';
  readonly tags = (this.item.categories ?? [])
    .filter(category => category !== 'Uncategorized');

  private content = this.item['content:encoded'] ?? '';
  private lines = this.content
    .split('\n');

  getImage(): string | undefined {
    const lines = this.lines
      .filter(x => x.indexOf('container-youtube') > 0 || x.indexOf('nv-iframe-embed') > 0);

    for (const line of lines) {
      if (line.indexOf('container-youtube') > 0) {
        const search = 'href="https://www.youtube.com/watch?v=';
        const startIndex = line.indexOf(search);
        if (startIndex > 0) {
          const endIndex = line.indexOf('"', startIndex + search.length);
          if (endIndex > startIndex) {
            const id = line.substring(startIndex + search.length, endIndex);
            return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
          }
        }
      }
      else if (line.indexOf('nv-iframe-embed') > 0) {
        const search = 'src="https://www.youtube.com/embed/';
        const startIndex = line.indexOf(search);
        if (startIndex > 0) {
          const endIndex = line.indexOf('"', startIndex + search.length);
          if (endIndex > startIndex) {
            let id = line.substring(startIndex + search.length, endIndex);

            const splitIndex = id.indexOf('?');
            if (splitIndex > 0) {
              id = id.substring(0, splitIndex);
            }

            return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
          }
        }
      }
    }
  }

  getDescription(): string[] {
    const description = [];

    for (let line of this.lines) {
      if (line === '<p></p>') {
        continue;
      }

      if (line.indexOf('wp-block-heading') > 0) {
        break;
      }

      if (line.startsWith('<p>') && line.endsWith('</p>')) {
        line = stripHtml(line).trim();

        if (line) {
          description.push(line);

          if (description.length >= 3) {
            break;
          }
        }
      }
    }

    return description;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+>/gi, '');
};
