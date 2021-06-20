#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import path from 'node:path';

const delAll = async (paths) => {
  paths = paths.map((p) => path.resolve(p));
  await Promise.all(paths.map(del));
};

const del = async (path) => {
  try {
    await rmrf(path);
  } catch (e) {
    // Windows throws EPERM for write-protected directories.
    if (e.code !== 'EPERM') {
      throw e;
    }
    await fixPermissions(e.path);
    // Error might be from subdirectories.
    if (path !== e.path) {
      await del(path);
    }
  }
};

const rmrf = async (path) => fs.rm(path, { recursive: true, force: true });

const fixPermissions = async (path) => {
  try {
    await fs.chmod(path, 0o700);
    await rmrf(path);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
};

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
