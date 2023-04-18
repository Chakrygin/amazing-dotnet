import * as core from '@actions/core';

import moment from 'moment';
import path from 'path';

import { AppConfig } from './AppConfig';

import { Scraper } from './scrapers';
import { Sender } from './senders';
import { LastErrorStorage, LastUpdateStorage, PostStorage } from './storages';
import { getPostId } from './helpers';

export class AppRunner {
  constructor(
    private readonly config: AppConfig,
    private readonly scrapers: readonly Scraper[],
    private readonly publicSender: Sender,
    private readonly privateSender: Sender) { }

  private readonly lastErrors = new LastErrorStorage(
    path.join(this.config.path, 'errors.json'));

  private readonly lastUpdates = new LastUpdateStorage(
    path.join(this.config.path, 'updates.json'));

  async run(): Promise<string[]> {
    const updatedScraperNames: string[] = [];

    for (const scraper of this.scrapers) {
      await core.group(scraper.name, async () => {
        const lastError = this.lastErrors.get(scraper.name);
        const lastUpdate = this.lastUpdates.get(scraper.name);

        if (lastError) {
          if (!this.config.manual) {
            if (lastError.counter > 10) {
              core.error('This scraper failed more than 10 times.', {
                title: `The '${scraper.name}' scraper permanently disabled.`,
              });

              return;
            }

            if (lastError.counter > 1) {
              if (moment().diff(lastError.timestamp, 'days') < 1) {
                core.warning('This scraper failed less than a day ago.', {
                  title: `The '${scraper.name}' scraper temporarily disabled.`,
                });

                return;
              }
            }
          }

          this.lastErrors.reset(scraper.name);
        }

        if (lastUpdate) {
          if (!this.config.manual) {
            if (moment().diff(lastUpdate.timestamp, 'year') >= 1) {
              core.warning('This scraper has no updates more than 1 year.', {
                title: `The '${scraper.name}' scraper is idle.`,
              });
            }
          }
        }

        const storage = new PostStorage(
          path.join(this.config.path, scraper.path),
          getPostId);

        try {
          const debug = this.config.debug || !lastUpdate || !storage.exists;
          const sender = !debug ? this.publicSender : this.privateSender;

          await scraper.scrape(sender, storage);
        }
        catch (error: unknown) {
          if (error instanceof Error) {
            if (lastError) {
              process.exitCode = 1;

              core.error(error, {
                title: `The '${scraper.name}' scraper failed.`,
              });
            }
            else {
              core.warning(error, {
                title: `The '${scraper.name}' scraper failed.`,
              });
            }

            this.lastErrors.set(scraper.name, error);
          }
        }
        finally {
          if (storage.save()) {
            this.lastUpdates.set(scraper.name);
            updatedScraperNames.push(scraper.name);
          }
        }
      });
    }

    return updatedScraperNames;
  }
}
