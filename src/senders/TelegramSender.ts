import { Telegram } from 'telegraf';

import Sender from './Sender';

import { Post } from '../models';

export default class TelegramSender implements Sender {
  constructor(
    private readonly token: string,
    private readonly chatId: string) { }

  private readonly telegram = new Telegram(this.token);

  async send(post: Post): Promise<void> {
    const message = getMessage(post);

    if (!post.image || message.length > 1024) {
      await this.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
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
}

function getMessage(post: Post): string {
  const lines = [];

  lines.push(
    link(bold(encode(post.title)), post.href));

  const line = [];

  if (post.categories && post.categories.length > 0) {
    for (const category of post.categories) {
      line.push(
        link(bold(encode(category.title)), category.href));
    }
  }

  if (post.date) {
    line.push(
      bold(post.date.format('LL')));
  }

  if (line.length > 0) {
    lines.push(
      line.join(' | '));
  }

  if (post.description !== undefined) {
    for (const line of post.description) {
      lines.push(encode(line));
    }
  }

  if (post.tags && post.tags.length > 0) {
    const tags = post.tags
      .map(tag => link(encode(tag.title), tag.href));

    lines.push('🏷️ ' + tags.join(', '));
  }

  return lines.join('\n\n');
}

function link(title: string, href: string): string {
  return `<a href="${href}">${title}</a>`;
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
  let success = image.endsWith('.gif');

  if (!success && !isLowerCase) {
    image = image.toLowerCase();
    success = isAnimation(image, true);
  }

  return success;
}
