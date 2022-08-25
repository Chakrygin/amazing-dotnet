
import Sender from './Sender';

import { Category, Link, Post, Tag } from '../models';

export default class NormalizeSender implements Sender {
  constructor(
    private readonly sender: Sender) { }

  async send(post: Post): Promise<void> {
    post = {
      image: post.image?.trim(),
      title: post.title.trim(),
      href: post.href.trim(),
      categories: normalizeCategories(post.categories),
      date: post.date,
      description: post.description,
      links: normalizeLinks(post.links),
      tags: normalizeTags(post.tags),
    };

    await this.sender.send(post);
  }
}

function normalizeCategories(categories: Category[]): Category[] {
  if (categories && categories.length > 0) {
    categories = categories
      .map(category => ({
        title: category.title.trim(),
        href: category.href.trim(),
      }));
  }

  return categories;
}


function normalizeLinks(links?: Link[]): Link[] | undefined {
  if (links && links.length > 0) {
    links = links
      .map(link => ({
        title: link.title.trim(),
        href: link.href.trim(),
      }));
  }

  return links;
}

function normalizeTags(tags?: Tag[]): Tag[] | undefined {
  if (tags && tags.length > 0) {
    tags = tags
      .map(tag => ({
        title: tag.title.trim(),
        href: tag.href.trim(),
      }))
      .sort((a, b) => {
        if (a.title < b.title) {
          return -1;
        }
        if (a.title > b.title) {
          return 1;
        }
        return 0;
      });

    return tags;
  }
}
