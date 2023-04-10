import { Sender } from '../senders';
import { Storage } from '../storages';

export interface Scraper {
  readonly name: string;
  readonly path: string;

  scrape(sender: Sender, storage: Storage): Promise<void>;
}
