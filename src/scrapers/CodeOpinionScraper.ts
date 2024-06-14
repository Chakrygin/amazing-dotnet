import moment from 'moment';

import { Link, Post } from '@core/models';
import { ScraperBase } from '@core/scrapers';

export class CodeOpinionScraper extends ScraperBase {
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
      .fetchPosts((_, item) => {

        const content = item['content:encoded'] as string;
        const lines = content.split('\n');

        const image = this.getImage(lines);
        const title = item.title ?? '';
        const href = item.link ?? '';
        const date = item.pubDate ?? '';
        const description = this.getDescription(lines);
        const tags = (item.categories ?? [])
          .filter(category => category !== 'Uncategorized');

        return {
          image,
          title,
          href,
          categories: [this.CodeOpinion],
          author: this.author,
          date: moment(date),
          description,
          tags,
        };

      });
  }

  private getImage(lines: readonly string[]): string | undefined {
    for (const line of lines) {
      if (line.indexOf('container-youtube') > 0 || line.indexOf('nv-iframe-embed') > 0) {
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
  }

  private getDescription(lines: readonly string[]): string[] {
    const description = [];

    for (let line of lines) {
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

    function stripHtml(html: string): string {
      return html.replace(/<\/?[^>]+>/gi, '');
    };
  }
}
