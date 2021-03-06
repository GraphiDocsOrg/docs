import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as util from 'util';

/**
 * resolve
 *
 * transform a path relative to absolute, if relative
 * path start with `graphidocs/` return absolute path to
 * plugins directory
 */
const MODULE_BASEPATH = 'graphidocs/';

export function resolve(relativePath: string): string {
  if (relativePath.slice(0, MODULE_BASEPATH.length) === MODULE_BASEPATH) {
    return path.resolve(
      __dirname,
      '../../',
      relativePath.slice(MODULE_BASEPATH.length),
    );
  }

  return path.resolve(relativePath);
}

export function relative(relativePath: string, root: string = process.cwd()): string {
  return path.relative(
    root,
    relativePath
  );
}

/**
 * Execute fs.read as Promise
 */
export const readFile = util.promisify(fs.readFile);
export const writeFile = util.promisify(fs.writeFile);
export const copyAll = util.promisify(fse.copy);
export const readDir = util.promisify(fs.readdir);
export const mkDir = util.promisify(fs.mkdir as any);
export const removeBuildDirectory = util.promisify(fse.remove as any);

const SKIP_COPY_RE = /\.(?:mustache|tsx?)$/i;

/**
 * Create build directory from a template directory
 */
export async function createBuildDirectory(
  buildDirectory: string,
  templateDirectory: string,
  assets: string[],
) {
  // read directory
  const files = await readDir(templateDirectory);

  await Promise.all(
    files
      // ignore certain kinds of files
      .filter(file => !file.match(SKIP_COPY_RE))

      // copy recursive
      .map((file) =>
        copyAll(
          path.resolve(templateDirectory, file),
          path.resolve(buildDirectory, file),
        ),
      ),
  );

  // create assets directory
  await mkDir(path.resolve(buildDirectory, 'assets'));

  await Promise.all(
    assets.map((asset) =>
      copyAll(
        asset,
        path.resolve(buildDirectory, 'assets', path.basename(asset)),
      ),
    ),
  );
}
