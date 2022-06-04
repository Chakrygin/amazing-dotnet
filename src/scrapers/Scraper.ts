import Storage from '../storage_tmp';
import Sender from '../senders/Sender';

export default interface Scraper {
  readonly name: string;
  readonly path: string;

  scrape(storage: Storage, sender: Sender): Promise<void>;
}
