import { Telegram } from 'telegraf';

import Sender from './Sender';

import { Message } from '../models';

export default class TelegramSender implements Sender {
  constructor(
    private readonly token: string,
    private readonly chatId: string) { }

  private readonly telegram = new Telegram(this.token);

  async send(message: Message): Promise<void> {
    const messageHtml = getMessageHtml(message);

    if (!message.image || messageHtml.length > 1024) {
      await this.telegram.sendMessage(this.chatId, messageHtml, {
        parse_mode: 'HTML',
      });
    }
    else if (message.image.endsWith('.gif')) {
      await this.telegram.sendAnimation(this.chatId, message.image, {
        caption: messageHtml,
        parse_mode: 'HTML',
      });
    }
    else {
      await this.telegram.sendPhoto(this.chatId, message.image, {
        caption: messageHtml,
        parse_mode: 'HTML',
      });
    }
  }
}

function getMessageHtml(message: Message): string {
  const lines = new Array<string>();

  lines.push(
    link(bold(encode(message.title)), message.href));

  const line = [];

  if (message.source) {
    lines.push(
      link(bold(encode(message.source.title)), message.source.href));
  }

  if (message.author) {
    lines.push(
      link(bold(encode(message.author.title)), message.author.href));
  }

  if (message.categories != undefined) {
    if (Array.isArray(message.categories)) {
      for (const category of message.categories) {
        lines.push(
          link(bold(encode(category.title)), category.href));
      }
    }
    else {
      const category = message.categories;
      lines.push(
        link(bold(encode(category.title)), category.href));
    }
  }

  if (message.date) {
    line.push(
      bold(message.date.format('LL')));
  }

  if (line.length > 0) {
    lines.push(
      line.join(' | '));
  }

  if (message.description != undefined) {
    if (Array.isArray(message.description)) {
      for (const line of message.description) {
        lines.push(encode(line));
      }
    }
    else {
      lines.push(encode(message.description));
    }
  }

  if (message.links && message.links.length > 0) {
    const tags = message.links
      .map(tag => link(encode(tag.title), tag.href));

    lines.push('🔗 ' + tags.join(', '));
  }

  if (message.tags && message.tags.length > 0) {
    const tags = message.tags
      .sort((a, b) => {
        if (a.title < b.title) {
          return -1;
        }
        if (a.title > b.title) {
          return 1;
        }
        return 0;
      })
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
