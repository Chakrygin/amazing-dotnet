import * as core from '@actions/core';
import * as github from '@actions/github';

import {
  Scraper,
  AndrewLockScraper,
  CodeOpinionScraper,
  DevBlogsScraper,
  DotNetCoreTutorialsScraper,
  KhalidAbuhakmehScraper,
  CodeMazeScraper,
  HabrScraper,
} from './scrapers';

import {
  Sender,
  TelegramSender,
  ThrottleSender,
  ValidateSender,
} from './senders';

import { Storage } from './storage';
import Metadata from './Metadata';
import moment from 'moment';

async function main() {
  try {

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
      new KhalidAbuhakmehScraper(),
    ];

    const publicSender = createSender('public');
    const privateSender = createSender('private');

    const metadata = new Metadata();

    try {

      for (const scraper of scrapers) {
        await core.group(scraper.name, async () => {

          const lastError = metadata.getLastError(scraper.name);
          if (lastError) {
            if (lastError.counter > 10) {
              core.error('');
              return;
            }

            if (moment().diff(lastError.timestamp, 'days') < 1) {
              core.warning('');
              return;
            }

            metadata.resetLastError(scraper.name);
          }

          const lastUpdate = metadata.getLastUpdate(scraper.name);
          if (lastUpdate && !lastUpdate.idle) {
            if (moment().diff(lastUpdate.timestamp, 'months') >= 6) {
              // TODO: Report...
              // reporter.sendWarning('');

              metadata.setLastUpdateIdle(scraper.name);
            }
          }

          const storage = new Storage(scraper.path);
          const sender = storage.exists() && github.context.ref === 'refs/heads/main'
            ? publicSender
            : privateSender;

          try {
            await scraper.scrape(storage, sender);
          }
          catch (error: any) {
            core.setFailed(error);
            metadata.setLastError(scraper.name, error);
          }
          finally {
            const saved = storage.save();
            if (saved || !lastUpdate) {
              metadata.setLastUpdate(scraper.name);
            }
          }

        });
      }

    }
    finally {
      metadata.save();
    }

  }
  catch (error: any) {
    core.setFailed(error);
  }
}

function createSender(type: 'public' | 'private'): Sender {
  let sender: Sender;

  const token = getInput('TELEGRAM_TOKEN');
  const chatId = getInput(`TELEGRAM_${type.toUpperCase()}_CHAT_ID`);

  sender = new TelegramSender(token, chatId);
  sender = new ThrottleSender(sender, 5000);
  sender = new ValidateSender(sender);

  return sender;
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
