import { Telegram } from 'telegraf';

import { Sender } from './Sender';
import { Link, Post } from '../models';

const MAX_CAPTION_LENGTH = 1024;
const MAX_MESSAGE_LENGTH = 4096;

export class TelegramSender implements Sender {
  constructor(
    private readonly token: string,
    private readonly chatId: string) { }

  private readonly telegram = new Telegram(this.token);

  async send(post: Post): Promise<void> {
    const message = this.getMessage(post);

    if (!post.image || message.length > MAX_CAPTION_LENGTH) {
      await this.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        link_preview_options: {
          is_disabled: true,
        },
      });
    }
    else if (isAnimation(post.image)) {
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
  }

  private getMessage(post: Post): string {
    if (!post.description) {
      return this.getMessageInternal(post);
    }

    if (post.description.length < 2) {
      return this.getMessageInternal(post);
    }

    const originalMessage = this.getMessageInternal(post);
    const maxLength = post.image ? MAX_CAPTION_LENGTH : MAX_MESSAGE_LENGTH;

    if (originalMessage.length > maxLength) {
      while (post.description.length > 1) {
        post.description.pop();

        const message = this.getMessageInternal(post);
        if (message.length <= maxLength) {
          return message;
        }
      }
    }

    return originalMessage;
  }

  private getMessageInternal(post: Post): string {
    const lines: string[] = [];

    lines.push(bold(link(post)));

    const line: string[] = [];

    if (post.categories.length > 0) {
      for (const category of post.categories) {
        line.push(link(category));
      }
    }

    if (post.author) {
      line.push(encode(post.author));
    }

    if (post.date) {
      line.push(post.date.format('LL'));
    }

    lines.push(bold(line.join(' | ')));

    if (post.description && post.description.length > 0) {
      for (const description of post.description) {
        lines.push(encode(description));
      }
    }

    if (post.links.length > 0) {
      const links = post.links
        .map(link => `${encode(link.title)}: ${link.href}`);

      lines.push(...links);
    }

    if (post.tags && post.tags.length > 0) {
      const tags = post.tags
        .map(tag => encode(tag))
        .join(', ');

      lines.push('🏷️ ' + tags);
    }

    return lines.join('\n\n');
  }
}

function link(link: Link): string {
  return `<a href="${link.href}">${encode(link.title)}</a>`;
}

function bold(text: string): string {
  return `<b>${text}</b>`;
}

function encode(html: string) {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isAnimation(image: string, isLowerCase = false): boolean {
  let result = image.endsWith('.gif');

  if (!result && !isLowerCase) {
    image = image.toLowerCase();
    result = isAnimation(image, true);
  }

  return result;
}
