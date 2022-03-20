import * as core from '@actions/core'
import fs from 'fs'

import { join } from 'path';
import { Scraper, Sender } from "../abstractions";

export interface ScraperOptions {
  readonly name: string;
  readonly path: string;
}

export abstract class ScraperBase<TOptions extends ScraperOptions> implements Scraper {

  constructor(
    protected readonly options: TOptions) { }

  protected readonly storage = new ScraperStorage(this.options.path);

  async scrape(sender: Sender): Promise<void> {
    await core.group(this.options.name, async () => {
      try {
        await this.scrapeInternal(sender);
      }
      catch (error: any) {
        core.error(error);
        await sender.sendError(this.options.name, error);
      }

      this.storage.save();
    });
  }

  protected abstract scrapeInternal(sender: Sender): Promise<void>;

}

class ScraperStorage {
  constructor(path: string) {
    this.path = join(process.cwd(), 'data', path);
  }

  private readonly path: string;
  private readonly files = new Map<string, ScraperStorageFile>();

  has(date: Date, link: string): boolean {
    const fileKey = this.getFileKey(date);
    const file = this.getOrAddFile(fileKey);

    return file.links.has(link);
  }

  add(date: Date, link: string) {
    const fileKey = this.getFileKey(date);
    const file = this.getOrAddFile(fileKey);

    file.links.add(link);
    file.dirty = true;
  }

  private getFileKey(date: Date): string {
    return date.toISOString().substring(0, 7);
  }

  private getOrAddFile(key: string): ScraperStorageFile {
    let file = this.files.get(key);
    if (!file) {
      file = {
        path: join(this.path, key + '.txt'),
        links: new Set<string>(),
      }

      if (fs.existsSync(file.path)) {
        var links = fs.readFileSync(file.path)
          .toString()
          .split('\n')
          .map(link => link.trim())
          .filter(link => !!link);

        for (const link of links) {
          file.links.add(link);
        }
      }

      this.files.set(key, file);
    }

    return file;
  }

  save() {
    var dirty = false;

    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path, { recursive: true });
    }

    for (const file of this.files.values()) {
      if (file.dirty) {
        var data = Array.from(file.links).sort().join('\n') + '\n';
        fs.writeFileSync(file.path, data);

        dirty = true;
      }
    }

    if (dirty) {
      var path = join(this.path, 'timestamp');
      var data = new Date().toISOString();
      fs.writeFileSync(path, data);
    }
  }
}

interface ScraperStorageFile {
  readonly path: string;
  readonly links: Set<string>;
  dirty?: true;
}
