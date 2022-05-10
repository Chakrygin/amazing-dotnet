import * as core from '@actions/core';
import * as github from '@actions/github';

import moment from 'moment';

import Scraper from './scrapers/Scraper';
import AndrewLockScraper from './scrapers/AndrewLockScraper';
import CodeMazeScraper from './scrapers/CodeMazeScraper';
import CodeOpinionScraper from './scrapers/CodeOpinionScraper';
import DevBlogsScraper from './scrapers/DevBlogsScraper';
import DotNetCoreTutorialsScraper from './scrapers/DotNetCoreTutorialsScraper';
import HabrScraper from './scrapers/HabrScraper';
import JetBrainsScraper from './scrapers/JetBrainsScraper';
import KhalidAbuhakmehScraper from './scrapers/KhalidAbuhakmehScraper';

import { createTelegramSender } from './senders';
import { createTelegramReporter } from './reporters';

import Storage from './storage';
import { getLastError } from './storage/LastErrors';
import { getLastUpdate } from './storage/LastUpdates';

async function main() {
  try {

    const IS_PRODUCTION = github.context.ref === 'refs/heads/main';

    const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
    const TELEGRAM_PUBLIC_CHAT_ID = getInput('TELEGRAM_PUBLIC_CHAT_ID');
    const TELEGRAM_PRIVATE_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

    const scrapers: Scraper[] = [
      new AndrewLockScraper(),
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
    ];

    const publicSender = createTelegramSender(TELEGRAM_TOKEN, TELEGRAM_PUBLIC_CHAT_ID);
    const privateSender = createTelegramSender(TELEGRAM_TOKEN, TELEGRAM_PRIVATE_CHAT_ID);
    const reporter = createTelegramReporter(TELEGRAM_TOKEN, TELEGRAM_PRIVATE_CHAT_ID);

    for (const scraper of scrapers) {
      await core.group(scraper.name, async () => {

        const lastError = getLastError(scraper.name, scraper.path);
        if (lastError.exists) {
          if (lastError.counter > 10) {
            core.error(`The '${scraper.name}' scraper has failed more than 10 times. Skip scraping.`);
            return;
          }

          if (moment().diff(lastError.timestamp, 'days') < 1) {
            core.warning(`The '${scraper.name}' scraper has failed less than a day ago. Temporary skip scraping.`);
            return;
          }

          lastError.reset();
        }

        const lastUpdate = getLastUpdate(scraper.name, scraper.path);
        if (lastUpdate.exists) {
          if (moment().diff(lastUpdate.timestamp, 'months') >= 6) {
            core.warning(`The '${scraper.name}' scraper has no updates more than 6 months.`);

            if (!lastUpdate.idle) {
              await reporter.report(`The '${scraper.name}' scraper has no updates more than 6 months.`);

              lastUpdate.setIdle();
            }
          }
        }

        const storage = new Storage(scraper.path);
        const sender = IS_PRODUCTION && storage.exists() ? publicSender : privateSender;

        try {
          await scraper.scrape(storage, sender);
        }
        catch (error: any) {
          const title = `The '${scraper.name}' scraper has failed.`;
          core.error(error, { title });
          lastError.set(error);
          await reporter.report(title, error);
        }
        finally {
          if (storage.save() || !lastUpdate.exists) {
            lastUpdate.set();
          }
        }

      });
    }

  }
  catch (error: any) {
    core.setFailed(error);
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
