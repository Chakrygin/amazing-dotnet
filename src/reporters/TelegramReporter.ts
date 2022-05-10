import { Telegram } from 'telegraf';

import Reporter from './Reporter';

export default class TelegramReporter implements Reporter {
  constructor(
    private readonly token: string,
    private readonly chatId: string) { }

  private readonly telegram = new Telegram(this.token);

  async report(message: string, error?: string | Error): Promise<void> {
    const messagePrefix = !error ? '⚠ [WARNING]' : '‼ [ERROR]';
    const messageHtml = getMessageHtml(`${messagePrefix} ${message}`, error);

    await this.telegram.sendMessage(this.chatId, messageHtml, {
      parse_mode: 'HTML',
    });
  }
}

function getMessageHtml(message: string, error?: string | Error): string {
  const lines = new Array<string>();

  lines.push(message);

  if (error) {
    if (error instanceof Error) {
      lines.push(encode(error.message));

      if (error.stack) {
        lines.push(`<pre>${encode(error.stack)}</pre>`);
      }
    }
    else {
      lines.push(encode(error));
    }
  }

  return lines.join('\n\n');
}

function encode(html: string) {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
