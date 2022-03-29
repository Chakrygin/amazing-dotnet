import { Sender } from "../senders/abstractions";
import { Storage } from '../storage';

export interface Scraper {
  readonly name: string;
  readonly path: string;

  scrape(storage: Storage, sender: Sender): Promise<void>;
}
