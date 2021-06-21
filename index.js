#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import isPathInside from 'is-path-inside';

const delAll = async (paths) => {
  paths = paths.map((p) => resolve(p));
  await Promise.all(paths.map(del));
};

const del = async (path) => {
  try {
    await rmrf(path);
  } catch (e) {
    const isSub = isPathInside(e.path, path); // Error could be due to a subpath.
    if (e.path !== path && !isSub) {
      // Uknown case. `e.path` should be either current path or subpath.
      throw e;
    }
    if (e.code === 'EPERM') {
      // Windows throws EPERM for write-protected directories.
      await fixPermissions(e.path); // Fix permissions of the directory causing error.
    } else if (e.code === 'EACCES' && isSub) {
      // Accessing subpaths of write-protected directories throws EACCES.
      const parent = dirname(e.path);
      await fixPermissions(parent); // Fix permissions of the immediate parent directory.
    } else {
      throw e;
    }
    if (isSub) {
      await del(e.path); // Try deleting subpath first.
      await del(path); // Try deleting parent directory again.
    } else {
      await rmrf(path); // Avoid endless recursion.
    }
  }
};

const rmrf = async (path) => fs.rm(path, { recursive: true, force: true });

const fixPermissions = async (path) => {
  try {
    await fs.chmod(path, 0o700);
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
