import { Telegram } from 'telegraf';

import { Sender } from './abstractions';
import { Post } from '../models';

export class TelegramSender implements Sender {
  constructor(
    private readonly token: string,
    private readonly chatId: string | number) { }

  private readonly telegram = new Telegram(this.token);

  async sendPost(post: Post): Promise<void> {
    const message = getPostMessage(post);

    if (post.image) {
      this.telegram.sendPhoto(this.chatId, post.image, {
        caption: message,
        parse_mode: 'HTML',
      })
    }
    else {
      this.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
      })
    }

    function getPostMessage(post: Post): string {
      const lines = [];

      lines.push(
        `<a href="${post.link}"><b>${post.title}</b></a>`);

      const line = [];

      if (post.blog) {
        line.push(
          `<a href="${post.blog.link}"><b>${post.blog.title}</b></a>`);
      }

      if (post.author) {
        line.push(
          `<a href="${post.author.link}"><b>${post.author.title}</b></a>`);
      }

      if (post.date) {
        const date = post.date.toLocaleDateString('en-US', {
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

      if (post.description) {
        if (Array.isArray(post.description)) {
          for (const line of post.description) {
            lines.push(line);
          }
        }
        else {
          lines.push(post.description);
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
          .map(tag => `<a href="${tag.link}">${tag.title}</a>`);

        lines.push('🏷️ ' + tagLinks.join(', '));
      }

      return lines.join('\n\n');
    }
  }
}
