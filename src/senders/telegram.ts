import { Telegram } from 'telegraf';

import { Sender } from '../senders';
import { Post } from '../models';

export class TelegramSender implements Sender {
  constructor(
    private readonly token: string,
    private readonly chatId: string | number) { }

  private readonly telegram = new Telegram(this.token);

  async sendPost(post: Post): Promise<void> {
    const message = getPostMessage(post);

    if (!post.image || message.length > 1024) {
      await this.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
      });
    }
    else if (post.image.endsWith('.gif')) {
      await this.telegram.sendAnimation(this.chatId, post.image, {
        caption: message,
        parse_mode: 'HTML',
      });
    }
    else {
      await this.telegram.sendPhoto(this.chatId, post.image, {
        caption: message,
        parse_mode: 'HTML',
      });
    }

    function getPostMessage(post: Post): string {
      const lines = [];

      lines.push(
        `<a href="${post.link}"><b>${encode(post.title)}</b></a>`);

      const line = [];

      if (post.blog) {
        line.push(
          `<a href="${post.blog.link}"><b>${encode(post.blog.title)}</b></a>`);
      }

      if (post.company) {
        line.push(
          `<a href="${post.company.link}"><b>${encode(post.company.title)}</b></a>`);
      }

      if (post.author) {
        line.push(
          `<a href="${post.author.link}"><b>${encode(post.author.title)}</b></a>`);
      }

      if (post.date) {
        const locale = post.locale ?? 'en-US';
        const date = post.date.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        line.push(
          `<b>${date}</b>`);
      }

      if (line.length > 0) {
        lines.push(line.join(' | '));
      }

      if (post.description != undefined) {
        if (Array.isArray(post.description)) {
          for (const line of post.description) {
            lines.push(encode(line));
          }
        }
        else {
          lines.push(encode(post.description));
        }
      }

      if (post.tags && post.tags.length > 0) {
        var tagLinks = post.tags
          .sort((a, b) => {
            if (a.title < b.title) {
              return -1;
            }
            if (a.title > b.title) {
              return 1;
            }
            return 0;
          })
          .map(tag => `<a href="${tag.link}">${encode(tag.title)}</a>`);

        lines.push('🏷️ ' + tagLinks.join(', '));
      }

      return lines.join('\n\n');
    }
  }
}

export function encode(html: string) {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
