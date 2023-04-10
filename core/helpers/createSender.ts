import { NormalizeSender, Sender, TelegramSender, ThrottleSender, ValidateSender } from '../senders';

export function createSender(token: string, chatId: string): Sender {
  let sender = new TelegramSender(token, chatId) as Sender;

  sender = new ThrottleSender(sender);
  sender = new ValidateSender(sender);
  sender = new NormalizeSender(sender);

  return sender;
}
