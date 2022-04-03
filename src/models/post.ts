import { Author } from "./author";
import { Blog } from "./blog";
import { Company } from "./company";
import { Tag } from "./tag";

export interface Post {
  readonly image?: string;
  readonly title: string;
  readonly link: string;
  readonly blog?: Blog;
  readonly company?: Company;
  readonly author?: Author;
  readonly date?: Date;
  readonly locale?: 'en-US' | 'ru-RU';
  readonly description?: string | string[];
  readonly tags?: Tag[];
}
