import fs from 'fs';

export function getKnownHosts(path: string): string[] {
  if (fs.existsSync(path)) {
    const knownHosts = fs.readdirSync(path, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name);

    return knownHosts;
  }

  return [];
}
