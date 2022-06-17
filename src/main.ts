import * as core from '@actions/core';
import * as github from '@actions/github';

import moment from 'moment';
import 'moment/locale/ru';

import { createReporter } from './reporters';
import { createSender } from './senders';

import Scraper from './scrapers/Scraper';
import AndrewLockScraper from './scrapers/AndrewLockScraper';
import BookClubDotNetScraper from './scrapers/BookClubDotNetScraper';
import CodeMazeScraper from './scrapers/CodeMazeScraper';
import CodeOpinionScraper from './scrapers/CodeOpinionScraper';
import DevBlogsScraper from './scrapers/DevBlogsScraper';
import DotNetCoreTutorialsScraper from './scrapers/DotNetCoreTutorialsScraper';
import HabrScraper from './scrapers/HabrScraper';
import JetBrainsScraper from './scrapers/JetBrainsScraper';
import KhalidAbuhakmehScraper from './scrapers/KhalidAbuhakmehScraper';
import RadioDotNetScraper from './scrapers/RadioDotNetScraper';

import { getLastError } from './LastErrors';
import { getLastUpdate } from './LastUpdates';

import Storage from './storage_tmp';

async function main() {
  try {

    moment.locale('en');

    const IS_PRODUCTION = github.context.ref === 'refs/heads/main';

    const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
    const TELEGRAM_PUBLIC_CHAT_ID = getInput('TELEGRAM_PUBLIC_CHAT_ID');
    const TELEGRAM_PRIVATE_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

    const reporter = createReporter(TELEGRAM_TOKEN, TELEGRAM_PRIVATE_CHAT_ID);
    const publicSender = createSender(TELEGRAM_TOKEN, TELEGRAM_PUBLIC_CHAT_ID);
    const privateSender = createSender(TELEGRAM_TOKEN, TELEGRAM_PRIVATE_CHAT_ID);

    const scrapers: Scraper[] = [
      new AndrewLockScraper(),
      new BookClubDotNetScraper(),
      new CodeMazeScraper(),
      new CodeOpinionScraper(),
      new DevBlogsScraper('dotnet'),
      new DevBlogsScraper('odata'),
      new DevBlogsScraper('nuget'),
      new DevBlogsScraper('typescript'),
      new DevBlogsScraper('visualstudio'),
      new DevBlogsScraper('commandline'),
      new DotNetCoreTutorialsScraper(),
      new HabrScraper(),
      new JetBrainsScraper('how-tos'),
      new JetBrainsScraper('releases'),
      new JetBrainsScraper('net-annotated'),
      new KhalidAbuhakmehScraper(),
      new RadioDotNetScraper(),
    ];

    for (const scraper of scrapers) {
      await core.group(scraper.name, async () => {

        const lastError = getLastError(scraper.name, scraper.path);
        if (lastError.exists) {
          if (lastError.counter > 10) {
            core.error('This scraper has failed more than 10 times.', {
              title: `The '${scraper.name}' scraper is permanently skipped.`,
            });

            return;
          }

          if (lastError.counter > 1 && moment().diff(lastError.timestamp, 'days') < 1) {
            core.warning('This scraper has failed less than a day ago.', {
              title: `The '${scraper.name}' scraper is temporarily skipped.`,
            });

            return;
          }

          lastError.reset();
        }

        const lastUpdate = getLastUpdate(scraper.name, scraper.path);
        if (lastUpdate.exists) {
          if (moment().diff(lastUpdate.timestamp, 'months') >= 6) {
            core.warning('This scraper has no updates more than 6 months.', {
              title: `The '${scraper.name}' scraper is idle.`,
            });

            if (!lastUpdate.idle) {
              await reporter.reportWarning(`The '${scraper.name}' scraper is idle.`, 'This scraper has no updates more than 6 months.');

              lastUpdate.setIdle();
            }
          }
        }

        const storage = new Storage(scraper.path);
        const sender = IS_PRODUCTION && storage.exists ? publicSender : privateSender;

        try {
          await scraper.scrape(storage, sender);
        }
        catch (error) {
          if (error instanceof Error) {
            process.exitCode = 1;

            core.error(error, {
              title: `The '${scraper.name}' scraper has failed.`,
            });

            lastError.set(error);

            await reporter.reportError(`The '${scraper.name}' scraper has failed.`, error);
          }
        }
        finally {
          if (storage.save() || !lastUpdate.exists) {
            lastUpdate.set();
          }
        }

      });
    }

  }
  catch (error) {
    if (error instanceof Error) {
      core.setFailed(error);
    }
  }
}

function getInput(name: string): string {
  const value = process.env.CI ? core.getInput(name) : process.env[name];

  if (!value) {
    const from = process.env.CI ? 'action inputs' : 'environment variables';
    throw new Error(`Failed to retrieve '${name}' value from ${from}.`);
  }

  return value;
}

main();
