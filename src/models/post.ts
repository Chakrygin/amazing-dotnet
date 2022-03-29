import { Author } from "./author";
import { Blog } from "./blog";
import { Tag } from "./tag";

export interface Post {
  readonly image?: string;
  readonly title: string;
  readonly link: string;
  readonly blog?: Blog;
  readonly author?: Author;
  readonly date?: Date;
  readonly description?: string | string[];
  readonly tags?: Tag[];
}
