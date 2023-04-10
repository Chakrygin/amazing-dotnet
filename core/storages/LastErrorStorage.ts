import fs from 'fs';
import moment from 'moment';
import path from 'path';

export interface LastErrorInfo {
  readonly timestamp: moment.Moment;
  readonly message: string;
  readonly counter: number;
}

export class LastErrorStorage {
  constructor(
    private readonly path: string) { }

  private lastErrors?: Map<string, LastErrorInfo>;
  private lastErrorCounters: Map<string, number> = new Map<string, number>();

  get(name: string): LastErrorInfo | undefined {
    const lastErrors = this.getLastErrors();
    return lastErrors.get(name);
  }

  set(name: string, error: Error): void {
    const lastErrors = this.getLastErrors();
    const lastErrorCounter = this.lastErrorCounters.get(name) ?? 0;

    lastErrors.set(name, {
      timestamp: moment(),
      message: error.message,
      counter: lastErrorCounter + 1,
    });

    this.saveLastErrors();
  }

  reset(name: string): void {
    const lastErrors = this.getLastErrors();

    if (lastErrors.delete(name)) {
      this.saveLastErrors();
    }
  }

  private getLastErrors(): NonNullable<typeof this.lastErrors> {
    if (!this.lastErrors) {
      this.lastErrors = new Map();

      if (fs.existsSync(this.path)) {
        const data = fs.readFileSync(this.path).toString();
        const json = JSON.parse(data) as Readonly<Record<string, {
          readonly timestamp: string;
          readonly message: string;
          readonly counter: number;
        }>>;

        const entries = Object.entries(json);
        for (const [name, entry] of entries) {
          const lastError: LastErrorInfo = {
            timestamp: moment(entry.timestamp),
            message: entry.message,
            counter: entry.counter,
          };

          this.lastErrors.set(name, lastError);
          this.lastErrorCounters.set(name, lastError.counter);
        }
      }
    }

    return this.lastErrors;
  }

  private saveLastErrors(): void {
    if (this.lastErrors) {
      if (this.lastErrors.size) {
        const dir = path.dirname(this.path);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, {
            recursive: true,
          });
        }

        const entries = [...this.lastErrors]
          .map(([name, entry]) => [name, {
            timestamp: entry.timestamp.toISOString(),
            message: entry.message,
            counter: entry.counter,
          }])
          .sort();

        const json = Object.fromEntries(entries) as unknown;
        const data = JSON.stringify(json, null, 2);
        fs.writeFileSync(this.path, data + '\n');
      }
      else {
        fs.rmSync(this.path, {
          force: true,
        });
      }
    }
  }
}
