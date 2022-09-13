import * as core from '@actions/core';

import { Telegram } from 'telegraf';

import Sender from './Sender';

import { Post } from '../models';

const MAX_CAPTION_LENGTH = 1024;

export default class TelegramSender implements Sender {
  constructor(
    private readonly token: string,
    private readonly chatId: string) { }

  private readonly telegram = new Telegram(this.token);

  async send(post: Post): Promise<void> {
    const message = getMessage(post);

    if (!post.image || message.length > MAX_CAPTION_LENGTH) {
      await this.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
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
  if (!post.image || !post.description) {
    return getMessageInternal(post);
  }

  if (!Array.isArray(post.description) || post.description.length == 1) {
    return getMessageInternal(post);
  }

  const originalMessage = getMessageInternal(post);
  if (originalMessage.length > MAX_CAPTION_LENGTH) {
    core.info(`Trim the post description. Message length: ${originalMessage.length}.`);

    while (post.description.length > 1) {
      post.description.pop();

      const message = getMessageInternal(post);
      if (message.length <= MAX_CAPTION_LENGTH) {
        core.info(`The post description has been trimmed. Message length: ${message.length}.`);
        return message;
      }

      core.info(`Trim the post description. Message length: ${message.length}.`);
    }

    core.info(`The post description has not been trimmed. Message length: ${originalMessage.length}.`);
  }

  return originalMessage;
}

function getMessageInternal(post: Post): string {
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
    if (Array.isArray(post.description)) {
      for (const description of post.description) {
        lines.push(encode(description));
      }
    }
    else {
      lines.push(encode(post.description));
    }
  }

  if (post.links && post.links.length > 0) {
    const links = post.links
      .map(link => `${link.title}: ${link.href}`);

    lines.push(links);
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
