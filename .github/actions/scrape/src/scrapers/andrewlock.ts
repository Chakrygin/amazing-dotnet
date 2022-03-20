import { ScraperOptions, ScraperBase } from "./base";
import { Sender } from "../abstractions";

export interface AndrewLockOptions extends ScraperOptions {
}

export class AndrewLockScraper extends ScraperBase<AndrewLockOptions>{
  protected async scrapeInternal(sender: Sender): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
