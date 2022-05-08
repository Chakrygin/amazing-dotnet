import moment from 'moment';

import { Author } from './Author';
import { Category } from './Category';
import { Link } from './Link';
import { Source } from './Source';
import { Tag } from './Tag';

export interface Message {
  readonly image?: string;
  readonly title: string;
  readonly href: string;
  readonly source?: Source;
  readonly author?: Author;
  readonly categories?: Category | Category[];
  readonly date?: moment.Moment;
  readonly description?: string | string[];
  readonly links?: Link[];
  readonly tags?: Tag[];
}


