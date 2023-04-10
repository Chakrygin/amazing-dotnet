import * as core from '@actions/core';

export function getInput(name: string): string {
  const value = process.env.CI ? core.getInput(name) : process.env[name];

  if (!value) {
    throw process.env.CI
      ? new Error(`The '${name}' value does not defined in action inputs.`)
      : new Error(`The '${name}' value does not defined in environment variables.`);
  }

  return value;
}
