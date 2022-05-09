import fs from 'fs';
import moment from 'moment';
import { dirname, join } from 'path';

export function getLastUpdate(name: string, path: string): LastUpdate {
  return new LastUpdate(name, join(process.cwd(), 'data', path, 'updates.json'));
}

export class LastUpdate {
  constructor(
    private readonly name: string,
    private readonly path: string) { }

  private lastUpdates?: Map<string, LastUpdateItem>;

  get exists(): boolean {
    const lastUpdates = this.getLastUpdates();
    return lastUpdates.has(this.name);
  }

  get timestamp(): moment.Moment {
    const lastUpdates = this.getLastUpdate();
    return lastUpdates.timestamp;
  }

  get idle(): boolean {
    const lastUpdates = this.getLastUpdate();
    return !!lastUpdates.idle;
  }

  set() {
    const lastUpdates = this.getLastUpdates();
    const lastUpdate: LastUpdateItem = {
      timestamp: moment(),
    };

    lastUpdates.set(this.name, lastUpdate);
    this.save();
  }

  setIdle() {
    const lastUpdate = this.getLastUpdate();
    lastUpdate.idle = true;
    this.save();
  }

  private getLastUpdate(): LastUpdateItem {
    const lastErrors = this.getLastUpdates();
    const lastError = lastErrors.get(this.name);

    if (!lastError) {
      throw new Error('The last update does not exists.');
    }

    return lastError;
  }

  private getLastUpdates(): Map<string, LastUpdateItem> {
    if (!this.lastUpdates) {
      this.lastUpdates = new Map();

      if (fs.existsSync(this.path)) {
        const text = fs.readFileSync(this.path).toString();
        const json = JSON.parse(text) as {
          readonly [name: string]: {
            readonly timestamp: string,
            readonly idle?: true,
          },
        };

        const entries = Object.entries(json);
        for (const [name, entry] of entries) {
          const lastUpdate: LastUpdateItem = {
            timestamp: moment(entry.timestamp),
            idle: entry.idle,
          };

          this.lastUpdates.set(name, lastUpdate);
        }
      }
    }

    return this.lastUpdates;
  }

  private save(): void {
    const lastUpdates = this.getLastUpdates();
    const entries = Array.from(lastUpdates.entries())
      .map(([name, item]) => [name, {
        timestamp: item.timestamp.toISOString(),
        idle: item.idle,
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

    delete this.lastUpdates;
  }
}

interface LastUpdateItem {
  readonly timestamp: moment.Moment;
  idle?: true;
}
