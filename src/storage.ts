import fs from 'fs';
import { join } from 'path';

const MAX_FILE_COUNT = 20;
const MAX_VALUE_COUNT = 100;

export default class Storage {
  constructor(path: string) {
    this.path = join(process.cwd(), 'data', path);
  }

  private readonly path: string;

  private files?: StorageFile[];
  private dirty?: true;

  get exists(): boolean {
    const path = join(this.path, 'timestamp');
    return fs.existsSync(path);
  }

  has(value: string): boolean {
    const files = this.getFiles();

    for (const file of files) {
      if (file.has(value)) {
        return true;
      }
    }

    return false;
  }

  add(value: string): void {
    const files = this.getFiles();
    const file = files.at(0);

    if (!file) {
      throw new Error('Cannot to add file to storage. File not found.');
    }

    file.add(value);
    this.dirty = true;
  }

  private getFiles(): NonNullable<typeof this.files> {
    if (!this.files) {
      this.files = [];

      const currentFileName = new Date().toISOString().substring(0, 7) + '.txt';
      const currentFilePath = join(this.path, currentFileName);
      const currentFile = new StorageFile(currentFilePath);

      this.files.push(currentFile);

      if (fs.existsSync(this.path)) {
        const regexp = /^\d{4}-\d{2}.txt$/;

        const fileNames = fs.readdirSync(this.path)
          .filter(fileName => regexp.test(fileName))
          .filter(fileName => fileName !== currentFileName)
          .sort()
          .reverse();

        for (const fileName of fileNames) {
          const filePath = join(this.path, fileName);
          const file = new StorageFile(filePath);

          this.files.push(file);
        }
      }
    }

    return this.files;
  }

  save(): boolean {
    let dirty = false;

    if (this.files && this.dirty) {
      if (!fs.existsSync(this.path)) {
        fs.mkdirSync(this.path, { recursive: true });
      }

      let fileCount = 0;
      let valueCount = 0;

      for (const file of this.files) {
        if (fileCount > MAX_FILE_COUNT || valueCount > MAX_VALUE_COUNT) {
          file.delete();
          continue;
        }

        fileCount += 1;
        valueCount += file.size;

        if (file.save()) {
          dirty = true;
        }
      }
    }

    if (dirty) {
      const path = join(this.path, 'timestamp');
      const timestamp = new Date().toISOString();
      fs.writeFileSync(path, timestamp + '\n');
    }

    return dirty;
  }
}

class StorageFile {
  constructor(
    private readonly path: string) { }

  private values?: Set<string>;
  private dirty?: true;

  get size() {
    const values = this.getValues();
    return values.size;
  }

  has(value: string): boolean {
    const values = this.getValues();
    return values.has(value);
  }

  add(value: string): void {
    const values = this.getValues();
    values.add(value);
    this.dirty = true;
  }

  private getValues(): NonNullable<typeof this.values> {
    if (!this.values) {
      this.values = new Set();

      if (fs.existsSync(this.path)) {
        const data = fs.readFileSync(this.path).toString();
        const values = data.split('\n')
          .map(value => value.trim())
          .filter(value => !!value);

        for (const value of values) {
          this.values.add(value);
        }
      }
    }

    return this.values;
  }

  save(): boolean {
    let dirty = false;

    if (this.values && this.dirty) {
      const data = Array.from(this.values).sort().join('\n');
      fs.writeFileSync(this.path, data + '\n');

      delete this.values;
      delete this.dirty;

      dirty = true;
    }

    return dirty;
  }

  delete() {
    fs.rmSync(this.path, { force: true });
  }
}
