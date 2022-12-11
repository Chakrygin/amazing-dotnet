import { Post } from '../models';
import Sender from './Sender';

export default class ValidateSender implements Sender {
  constructor(
    private readonly sender: Sender) { }

  async send(post: Post): Promise<void> {
    const errors = [];

    if (post.image != undefined) {
      if (!post.image) {
        errors.push('post image is empty');
      }
      else if (!isValidUrl(post.image)) {
        errors.push('post image is not valid url');
      }
      else if (!isValidImageExtension(post.image)) {
        errors.push('post image has invalid extension');
      }
    }

    if (!post.title) {
      errors.push('post title is empty');
    }

    if (!post.href) {
      errors.push('post href is empty');
    }
    else if (!isValidUrl(post.href)) {
      errors.push('post href is not valid url');
    }

    if (post.categories && post.categories.length > 0) {
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
      errors.push('post categories is empty');
    }

    if (post.date) {
      if (!post.date.isValid()) {
        errors.push('post date is not valid');
      }
    }

    if (post.description !== undefined) {
      if (Array.isArray(post.description)) {
        if (post.description.length > 0) {
          for (const description of post.description) {
            if (!description) {
              errors.push('description is empty');
              break;
            }
          }
        }
        else {
          errors.push('description is empty');
        }
      }
      else {
        if (!post.description) {
          errors.push('description is empty');
        }
      }
    }

    if (post.links && post.links.length > 0) {
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

        if (!tag.title) {
          errors.push(`tag title at index ${index} is empty`);
        }

        if (!tag.href) {
          errors.push(`tag href at index ${index} is empty`);
        }
        else if (!isValidUrl(tag.href)) {
          errors.push(`tag href at index ${index} is not valid url`);
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
  let success =
    link.startsWith('https://') ||
    link.startsWith('http://');

  if (!success && !isLowerCase) {
    link = link.toLowerCase();
    success = isValidUrl(link, true);
  }

  return success;
}

function isValidImageExtension(image: string, isLowerCase = false): boolean {
  let success =
    image.endsWith('.png') ||
    image.endsWith('.jpg') ||
    image.endsWith('.jpeg') ||
    image.endsWith('.gif') ||
    image.endsWith('.webp') ||
    image.startsWith('https://lh3.googleusercontent.com/');

  if (!success && !isLowerCase) {
    image = image.toLowerCase();
    success = isValidImageExtension(image, true);
  }

  return success;
}
