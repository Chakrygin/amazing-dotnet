import { Sender } from './Sender';
import { Post } from '../models';

export class ValidateSender implements Sender {
  constructor(
    private readonly sender: Sender) { }

  async send(post: Post): Promise<void> {
    const errors = [];

    if (post.image != undefined) {
      if (!post.image) {
        errors.push('image is empty');
      }
      else if (!isValidUrl(post.image)) {
        errors.push('image is not valid url');
      }
    }

    if (!post.title) {
      errors.push('title is empty');
    }

    if (!post.href) {
      errors.push('href is empty');
    }
    else if (!isValidUrl(post.href)) {
      errors.push('href is not valid url');
    }

    if (post.categories.length > 0) {
      for (let index = 0; index < post.categories.length; index++) {
        const category = post.categories[index];

        if (!category.title) {
          errors.push(`category title at index ${index} is empty`);
        }

        if (!category.href) {
          errors.push(`category href at index ${index} is empty`);
        }
        else if (!isValidUrl(category.href)) {
          errors.push(`category href at index ${index} is not valid url`);
        }
      }
    }
    else {
      errors.push('categories is empty');
    }

    if (post.author !== undefined) {
      if (!post.author) {
        errors.push('author is empty');
      }
    }

    if (post.date) {
      if (!post.date.isValid()) {
        errors.push('date is not valid');
      }
    }

    if (post.description) {
      if (post.description.length > 0) {
        for (let index = 0; index < post.description.length; index++) {
          const description = post.description[index];

          if (!description) {
            errors.push(`description at index ${index} is empty`);
          }
        }
      }
      else {
        errors.push('description is empty');
      }
    }

    if (post.links.length > 0) {
      for (let index = 0; index < post.links.length; index++) {
        const link = post.links[index];

        if (!link.title) {
          errors.push(`link title at index ${index} is empty`);
        }

        if (!link.href) {
          errors.push(`link href at index ${index} is empty`);
        }
        else if (!isValidUrl(link.href)) {
          errors.push(`link href at index ${index} is not valid url`);
        }
      }
    }

    if (post.tags && post.tags.length > 0) {
      for (let index = 0; index < post.tags.length; index++) {
        const tag = post.tags[index];

        if (!tag) {
          errors.push(`tag at index ${index} is empty`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error('Post is not valid: ' + errors.join(', ') + '.');
    }

    await this.sender.send(post);
  }
}

function isValidUrl(link: string, isLowerCase = false): boolean {
  let result =
    link.startsWith('https://') ||
    link.startsWith('http://');

  if (!result && !isLowerCase) {
    link = link.toLowerCase();
    result = isValidUrl(link, true);
  }

  return result;
}
