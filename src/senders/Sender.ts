import { Message } from '../models';

export default interface Sender {
  send(message: Message): Promise<void>;
}
