import { Telegram } from 'telegraf'
import { Sender } from '../abstractions';
import { Post } from '../models'

export interface TelegramSenderOptions {
  readonly token: string;
  readonly publicChatId: string | number;
  readonly reportChatId: string | number;
}

export class TelegramSender implements Sender {

  constructor(
    private readonly options: TelegramSenderOptions) { }

  private readonly telegram = new Telegram(this.options.token);
  private delay = Promise.resolve();

  async sendPost(post: Post): Promise<void> {
    const chatId = this.options.publicChatId;
    const message = this.getPostMessage(post);

    await this.telegram.sendPhoto(chatId, post.image, {
      caption: message,
      parse_mode: 'HTML',
    });
  }

  private getPostMessage(post: Post): string {
    const lines = [];

    const postLink = this.getLinkHtml(post, 'bold');
    lines.push(postLink);

    const blogLink = this.getLinkHtml(post.blog, 'bold');
    const authorLink = this.getLinkHtml(post.author, 'bold');
    const date = this.getDateHtml(post.date);
    lines.push([blogLink, authorLink, date].join(' | '));

    if (Array.isArray(post.description)) {
      for (const line of post.description) {
        lines.push(line);
      }
    }
    else {
      lines.push(post.description);
    }

    if (post.tags) {
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
        .map(tag => this.getLinkHtml(tag));

      lines.push('🏷️ ' + tagLinks.join(', '));
    }

    return lines.join('\n\n');
  }

  private getLinkHtml(entity: { title: string, link: string }, style?: 'bold'): string {
    if (style === 'bold') {
      return `<a href="${entity.link}"><b>${entity.title}</b></a>`;
    }

    return `<a href="${entity.link}">${entity.title}</a>`;
  }

  private getDateHtml(date: Date, style?: 'bold' | 'italic') {
    const text = date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `<b>${text}</b>`;
  }
}
