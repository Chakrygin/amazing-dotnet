import fs from 'fs';
import path from 'path';

import { PostStorageFile } from './PostStorageFile';
import { Storage } from './Storage';

const MAX_FILE_COUNT = 10;
const MAX_VALUE_COUNT = 100;

export class PostStorage implements Storage {
  constructor(
    private readonly path: string) { }

  private files?: PostStorageFile[];
  private dirty?: true;

  get exists(): boolean {
    const timestampPath = path.join(this.path, 'timestamp');
    return fs.existsSync(timestampPath);
  }

  has(href: string): boolean {
    const files = this.getFiles();

    for (const file of files) {
      if (file.has(href)) {
        return true;
      }
    }

    return false;
  }

  add(href: string): void {
    const files = this.getFiles();
    const file = files[0];
    file.add(href);
    this.dirty = true;
  }

  private getFiles(): NonNullable<typeof this.files> {
    if (!this.files) {
      this.files = [];

      const currentFileName = new Date().toISOString().substring(0, 7) + '.txt';
      const currentFilePath = path.join(this.path, currentFileName);
      const currentFile = new PostStorageFile(currentFilePath);

      this.files.push(currentFile);

      if (fs.existsSync(this.path)) {
        const fileNameRegExp = /^\d{4}-\d{2}.txt$/;

        const fileNames = fs.readdirSync(this.path, { withFileTypes: true })
          .filter(file => file.isFile())
          .filter(file => fileNameRegExp.test(file.name))
          .filter(file => file.name !== currentFileName)
          .map(file => file.name)
          .sort()
          .reverse();

        for (const fileName of fileNames) {
          const filePath = path.join(this.path, fileName);
          const file = new PostStorageFile(filePath);

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
        fs.mkdirSync(this.path, {
          recursive: true,
        });
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
      const timestampPath = path.join(this.path, 'timestamp');
      const timestamp = new Date().toISOString();
      fs.writeFileSync(timestampPath, timestamp + '\n');
    }

    return dirty;
  }
}
