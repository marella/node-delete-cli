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
    // Fix permissions of the directory causing error. It could be a subdirectory.
    await fixPermissions(e.path);
    if (e.path !== path) {
      // `e.path` will be a subdirectory of `path`.
      await del(e.path); // Try deleting subdirectory first.
      await del(path); // Try deleting parent directory again.
    } else {
      await rmrf(path); // Avoid endless recursion.
    }
  }
};

const rmrf = async (path) => fs.rm(path, { recursive: true, force: true });

const fixPermissions = async (path) => {
  try {
    await fs.chmod(path, 0o600);
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
  try {
    await delAll(paths);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
};

cli(process.argv.slice(2));
