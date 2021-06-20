#!/usr/bin/env node

import { rm } from 'node:fs/promises';

const del = async (path) => rm(path, { recursive: true, force: true });

const delAll = async (paths) => Promise.all(paths.map(del));

const help = `
Usage

  $ delete <files|directories>

Examples

  $ delete debug.log dist
  $ delete build coverage
`;

const cli = async (paths) => {
  if (paths.length === 0) {
    console.error(help);
    process.exit(1);
  }
  await delAll(paths);
};

cli(process.argv.slice(2));
