const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');

const bin = path.resolve('./index.js');
const tempdir = path.resolve('./tmp-node-delete-cli-test');
const cwd = process.cwd();

const del = async (paths) => execa(bin, paths);

beforeAll(async () => {
  await fs.emptyDir(tempdir);
  await exists(tempdir, true);
  process.chdir(tempdir);
});

afterAll(async () => {
  process.chdir(cwd);
  await fs.remove(tempdir);
  await exists(tempdir, false);
});

it('should delete files', async () => {
  await setupDir('foo/files');
  await del(['foo/files/1.txt', 'foo/files/2.txt']);
  await exists('foo/files/1.txt', false);
  await exists('foo/files/2.txt', false);

  await exists('foo/files/empty', true);
  await exists('foo/files/-', true);
  await exists('foo/files/3.txt', true);
  await exists('foo/files/-.txt', true);
});

it('should delete directories', async () => {
  await setupDir('foo/dirs');
  await del(['foo/dirs/empty']);
  await exists('foo/dirs/empty', false);

  await exists('foo/dirs/-', true);
  await exists('foo/dirs/1.txt', true);
  await exists('foo/dirs/2.txt', true);
  await exists('foo/dirs/3.txt', true);
  await exists('foo/dirs/-.txt', true);

  await setupDir('foo/dirs');
  await del(['foo/dirs']);
  await exists('foo/dirs', false);
});

it('should not throw error if path does not exist', async () => {
  await setupDir('foo/silent');
  await exists('foo/silent/invalid', false);
  await del(['foo/silent/1.txt', 'foo/silent/invalid', 'foo/silent/2.txt']);
  await exists('foo/silent/1.txt', false);
  await exists('foo/silent/2.txt', false);

  await exists('foo/silent/empty', true);
  await exists('foo/silent/-', true);
  await exists('foo/silent/3.txt', true);
  await exists('foo/silent/-.txt', true);
});

it('should delete files and directories starting with -', async () => {
  await setupDir('foo/dash');
  await del(['foo/dash/-']);
  await exists('foo/dash/-', false);

  await exists('foo/dash/-.txt', true);
  await del(['foo/dash/-.txt']);
  await exists('foo/dash/-.txt', false);

  await exists('foo/dash/empty', true);
  await exists('foo/dash/1.txt', true);
  await exists('foo/dash/2.txt', true);
  await exists('foo/dash/3.txt', true);
});

it('should delete write-protected files and directories', async () => {
  await setupDir('foo/perm', 0o400);
  await del(['foo/perm/1.txt']);
  await exists('foo/perm/1.txt', false);

  await del(['foo/perm/empty']);
  await exists('foo/perm/empty', false);

  await exists('foo/perm/-', true);
  await exists('foo/perm/2.txt', true);
  await exists('foo/perm/3.txt', true);
  await exists('foo/perm/-.txt', true);
});

it('should delete directories having write-protected files and directories', async () => {
  await setupDir('foo/permsub', 0o400);
  await del(['foo/permsub']);
  await exists('foo/permsub', false);
});

it('should delete write-protected directories having files and directories', async () => {
  await setupDir('foo/permparent');
  await fs.chmod('foo/permparent', 0o400);
  await del(['foo/permparent']);
  await exists('foo/permparent', false);
});

it('should delete write-protected directories having write-protected files and directories', async () => {
  await setupDir('foo/permparentsub', 0o400);
  await fs.chmod('foo/permparentsub', 0o400);
  await del(['foo/permparentsub']);
  await exists('foo/permparentsub', false);
});

const setupDir = async (p, mode) => {
  await mkdir(p + '/empty', mode);
  await mkdir(p + '/-', mode);
  await touch(p + '/1.txt', mode);
  await touch(p + '/2.txt', mode);
  await touch(p + '/3.txt', mode);
  await touch(p + '/-.txt', mode);
};

const mkdir = async (p, mode) => {
  await fs.ensureDir(p);
  if (mode) {
    await fs.chmod(p, mode);
  }
  await exists(p, true);
};

const touch = async (p, mode) => {
  await fs.ensureFile(p);
  if (mode) {
    await fs.chmod(p, mode);
  }
  await exists(p, true);
};

const exists = async (p, expected) => {
  expect(await fs.pathExists(p)).toBe(expected);
};
