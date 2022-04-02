import * as core from '@actions/core'
import * as github from '@actions/github'

import {
  Scraper,
  AndrewLockScraper,
  CodeOpinionScraper,
  DevBlogsScraper,
  DotNetCoreTutorialsScraper,
  KhalidAbuhakmehScraper,
  CodeMazeScraper,
} from './scrapers'

import {
  Sender,
  TelegramSender,
  ThrottleSender,
  ValidateSender,
} from './senders'

import { Storage } from './storage'

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
      new KhalidAbuhakmehScraper(),
    ]

    const publicSender = createSender('public');
    const privateSender = createSender('private');

    for (const scraper of scrapers) {
      await core.group(scraper.name, async () => {

        const storage = new Storage(scraper.path);
        const sender = storage.exists() && github.context.ref === 'refs/heads/main'
          ? publicSender
          : privateSender;

        try {
          await scraper.scrape(storage, sender);
        }
        catch (error: any) {
          core.setFailed(error);
        }

        storage.save();

      });
    }

  }
  catch (error: any) {
    core.setFailed(error);
  }
}

function createSender(type: 'public' | 'private'): Sender {
  var sender: Sender;

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
