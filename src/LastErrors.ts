import moment from 'moment';

import fs from 'fs';
import { dirname, join } from 'path';

export function getLastError(name: string, path: string): LastError {
  return new LastError(name, join(process.cwd(), 'data', path, 'errors.json'));
}

export class LastError {
  constructor(
    private readonly name: string,
    private readonly path: string) { }

  private lastErrors?: Map<string, LastErrorItem>;
  private lastErrorCounter = 0;

  get exists(): boolean {
    const lastErrors = this.getLastErrors();
    return lastErrors.has(this.name);
  }

  get timestamp(): moment.Moment {
    const lastError = this.getLastError();
    return lastError.timestamp;
  }

  get message(): string {
    const lastError = this.getLastError();
    return lastError.message;
  }

  get counter(): number {
    const lastError = this.getLastError();
    return lastError.counter;
  }

  reset(): void {
    const lastErrors = this.getLastErrors();

    lastErrors.delete(this.name);
    this.save();
  }

  set(error: string | Error) {
    const lastErrors = this.getLastErrors();
    const lastError: LastErrorItem = {
      timestamp: moment(),
      message: error.toString(),
      counter: this.lastErrorCounter + 1,
    };

    lastErrors.set(this.name, lastError);
    this.save();
  }

  private getLastError(): LastErrorItem {
    const lastErrors = this.getLastErrors();
    const lastError = lastErrors.get(this.name);

    if (!lastError) {
      throw new Error('The last error does not exists.');
    }

    return lastError;
  }

  private getLastErrors(): Map<string, LastErrorItem> {
    if (!this.lastErrors) {
      this.lastErrors = new Map();

      if (fs.existsSync(this.path)) {
        const text = fs.readFileSync(this.path).toString();
        const json = JSON.parse(text) as {
          readonly [name: string]: {
            readonly timestamp: string,
            readonly message: string,
            readonly counter: number,
          },
        };

        const entries = Object.entries(json);
        for (const [name, entry] of entries) {
          const lastError: LastErrorItem = {
            timestamp: moment(entry.timestamp),
            message: entry.message,
            counter: entry.counter,
          };

          this.lastErrors.set(name, lastError);

          if (name == this.name) {
            this.lastErrorCounter = Math.max(this.lastErrorCounter, entry.counter);
          }
        }
      }
    }

    return this.lastErrors;
  }

  private save(): void {
    const lastErrors = this.getLastErrors();
    const entries = Array.from(lastErrors.entries())
      .map(([name, item]) => [name, {
        timestamp: item.timestamp.toISOString(),
        message: item.message,
        counter: item.counter,
      }]);

    if (entries.length > 0) {
      const dir = dirname(this.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const json = Object.fromEntries(entries);
      const text = JSON.stringify(json, null, 2);
      fs.writeFileSync(this.path, text + '\n');
    }
    else {
      fs.rmSync(this.path, { force: true });
    }

    delete this.lastErrors;
  }
}

interface LastErrorItem {
  readonly timestamp: moment.Moment;
  readonly message: string;
  readonly counter: number;
}
