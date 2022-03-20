import * as core from '@actions/core'
import * as github from '@actions/github'

import { Scraper, Sender } from './abstractions';

import { AndrewLockScraper } from './scrapers/andrewlock'
import { DevBlogsScraper } from './scrapers/devblogs';

import { ConsoleSender } from './senders/console';
import { TelegramSender } from './senders/telegram';

async function main() {
  try {

    const scrapers: Scraper[] = [
      new DevBlogsScraper({
        name: 'DevBlogs / .NET Blog',
        path: 'devblogs.microsoft.com/dotnet',
        url: 'https://devblogs.microsoft.com/dotnet/',
      }),

      new DevBlogsScraper({
        name: 'DevBlogs / OData Blog',
        path: 'devblogs.microsoft.com/odata',
        url: 'https://devblogs.microsoft.com/odata/',
      }),

      new DevBlogsScraper({
        name: 'DevBlogs / NuGet Blog',
        path: 'devblogs.microsoft.com/nuget',
        url: 'https://devblogs.microsoft.com/nuget/',
      }),

      new DevBlogsScraper({
        name: 'DevBlogs / TypeScript Blog',
        path: 'devblogs.microsoft.com/typescript',
        url: 'https://devblogs.microsoft.com/typescript/',
      }),

      new DevBlogsScraper({
        name: 'DevBlogs / Visual Studio Blog',
        path: 'devblogs.microsoft.com/visualstudio',
        url: 'https://devblogs.microsoft.com/visualstudio/',
      }),

      new DevBlogsScraper({
        name: 'DevBlogs / Windows Command Line Blog',
        path: 'devblogs.microsoft.com/commandline',
        url: 'https://devblogs.microsoft.com/commandline/',
      }),

      // new AndrewLockScraper({
      //   name: 'AndrewLock',
      //   path: 'andrewlock.net',
      //   // url: 'https://andrewlock.net/rss.xml',
      // }),
    ];

    const sender = createSender();

    for (const scraper of scrapers) {
      await scraper.scrape(sender);
    }

  }
  catch (error: any) {
    core.setFailed(error);
  }
}

function createSender(): Sender {
  if (!process.env.CI || github.context.ref === 'refs/heads/main') {
    return new TelegramSender({
      token: getInputString('TELEGRAM_TOKEN'),
      publicChatId: getInputString('TELEGRAM_PUBLIC_CHAT_ID'),
      reportChatId: getInputString('TELEGRAM_REPORT_CHAT_ID'),
    });
  }

  return new ConsoleSender();
}

function getInputString(name: string): string {
  const value = process.env.CI
    ? core.getInput(name)
    : process.env[name] ?? '';

  if (!value) {
    const from = process.env.CI ? 'action inputs' : 'environment variables';
    throw new Error(`Failed to retrieve '${name}' value from ${from}.`);
  }

  return value;
}

main();
