import * as core from '@actions/core'
import * as github from '@actions/github'

import { Scraper, Sender } from './abstractions';

import { AndrewLockScraper } from './scrapers/andrewlock'
import { DevBlogsScraper } from './scrapers/devblogs';

import { ConsoleSender } from './senders/console';
import { TelegramSender } from './senders/telegram';
import { ThrottleSender } from './senders/throttle'

async function main() {
  try {

    const scrapers: Scraper[] = [
      new AndrewLockScraper({
        name: 'andrewlock.net',
        blog: {
          title: '.NET Escapades',
          link: 'https://andrewlock.net/',
        },
        author: {
          title: 'Andrew Lock',
          link: 'https://andrewlock.net/about/',
        },
      }),

      new DevBlogsScraper({
        name: 'devblogs.microsoft.com/dotnet',
        blog: {
          title: '.NET Blog',
          link: 'https://devblogs.microsoft.com/dotnet/',
        },
      }),

      new DevBlogsScraper({
        name: 'devblogs.microsoft.com/odata',
        blog: {
          title: 'OData',
          link: 'https://devblogs.microsoft.com/odata/',
        },
      }),

      new DevBlogsScraper({
        name: 'devblogs.microsoft.com/nuget',
        blog: {
          title: 'The NuGet Blog',
          link: 'https://devblogs.microsoft.com/nuget/',
        },
      }),

      new DevBlogsScraper({
        name: 'devblogs.microsoft.com/typescript',
        blog: {
          title: 'TypeScript',
          link: 'https://devblogs.microsoft.com/typescript/',
        },
      }),

      new DevBlogsScraper({
        name: 'devblogs.microsoft.com/visualstudio',
        blog: {
          title: 'Visual Studio Blog',
          link: 'https://devblogs.microsoft.com/visualstudio/',
        },
      }),

      new DevBlogsScraper({
        name: 'devblogs.microsoft.com/commandline',
        blog: {
          title: 'Windows Command Line',
          link: 'https://devblogs.microsoft.com/commandline/',
        },
      }),
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
    const sender = new TelegramSender({
      token: getInput('TELEGRAM_TOKEN'),
      publicChatId: getInput('TELEGRAM_PUBLIC_CHAT_ID'),
      reportChatId: getInput('TELEGRAM_REPORT_CHAT_ID'),
    });

    return new ThrottleSender(sender, 5000);
  }

  return new ConsoleSender();
}

function getInput(name: string): string {
  const value = process.env.CI
    ? core.getInput(name)
    : process.env[name];

  if (!value) {
    const from = process.env.CI ? 'action inputs' : 'environment variables';
    throw new Error(`Failed to retrieve '${name}' value from ${from}.`);
  }

  return value;
}

main();
