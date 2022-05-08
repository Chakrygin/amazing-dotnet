import Sender from './Sender';

import { Message } from '../models';

export default class ValidateSender implements Sender {
  constructor(
    private readonly sender: Sender) { }

  async send(message: Message): Promise<void> {
    const errors = new Array<string>();

    if (message.image != undefined) {
      if (!message.image) {
        errors.push('image is empty');
      }
      else if (!message.image.startsWith('https://')) {
        errors.push('image is not valid url');
      }
      else if (!isValidImageExtension(message.image)) {
        errors.push('image has not valid extension');
      }
    }

    if (!message.title) {
      errors.push('title is empty');
    }

    if (!message.href) {
      errors.push('href is empty');
    }
    else if (!message.href.startsWith('https://')) {
      errors.push('href is not valid url');
    }

    if (message.source) {
      if (!message.source.title) {
        errors.push('source title is empty');
      }

      if (!message.source.href) {
        errors.push('source href is empty');
      }
      else if (!message.source.href.startsWith('https://')) {
        errors.push('source href is not valid url');
      }
    }

    if (message.author) {
      if (!message.author.title) {
        errors.push('author title is empty');
      }

      if (!message.author.href) {
        errors.push('author href is empty');
      }
      else if (!message.author.href.startsWith('https://')) {
        errors.push('author href is not valid url');
      }
    }

    if (message.categories !== undefined) {
      if (Array.isArray(message.categories)) {
        for (let index = 0; index < message.categories.length; index++) {
          const category = message.categories[index];

          if (!category.title) {
            errors.push(`link title at index ${index} is empty`);
          }

          if (!category.href) {
            errors.push(`link href at index ${index} is empty`);
          }
        }
      }
      else {
        const category = message.categories;

        if (!category.title) {
          errors.push('link title is empty');
        }

        if (!category.href) {
          errors.push('link href is empty');
        }
      }
    }

    if (message.date) {
      if (!message.date.isValid()) {
        errors.push('date is not valid');
      }
    }

    if (message.description != undefined) {
      if (Array.isArray(message.description)) {
        for (const description of message.description) {
          if (!description) {
            errors.push('description is empty');
            break;
          }
        }
      }
      else {
        if (!message.description) {
          errors.push('description is empty');
        }
      }
    }

    if (message.links && message.links.length > 0) {
      for (let index = 0; index < message.links.length; index++) {
        const link = message.links[index];

        if (!link.title) {
          errors.push(`link title at index ${index} is empty`);
        }

        if (!link.href) {
          errors.push(`link href at index ${index} is empty`);
        }
      }
    }

    if (message.tags && message.tags.length > 0) {
      for (let index = 0; index < message.tags.length; index++) {
        const tag = message.tags[index];

        if (!tag.title) {
          errors.push(`tag title at index ${index} is empty`);
        }

        if (!tag.href) {
          errors.push(`tag href at index ${index} is empty`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error('Message is not valid: ' + errors.join(', ') + '.');
    }

    await this.sender.send(message);
  }
}

function isValidImageExtension(image: string): boolean {
  const result =
    image.endsWith('.png') ||
    image.endsWith('.jpg') ||
    image.endsWith('.jpeg') ||
    image.endsWith('.gif');

  return result;
}
