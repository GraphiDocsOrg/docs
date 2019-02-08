// tslint:disable:no-implicit-dependencies no-console
import { createReadStream, createWriteStream } from 'fs';
import * as globby from 'globby';
import * as mkdirp from 'mkdirp';
import { dirname, relative, resolve } from 'path';

const root = resolve(__dirname, '..');
const globs = [
  resolve(root, '**/*'),
];
const dest = resolve(__dirname, '../dist');

console.log(`Root: ${root}`);
console.log(`Destination: ${dest}`);

const mkdir = (path: string) =>
  new Promise((resolveFn, rejectFn) =>
    mkdirp(path, (error) => error ? rejectFn(error) : resolveFn())
  );

(async () => {
  const paths = await globby(globs, {
    ignore: [
      resolve(root, 'coverage'),
      resolve(root, 'dist'),
      resolve(root, 'examples'),
      resolve(root, 'gh-pages'),
      resolve(root, 'node_modules'),
      resolve(root, '**/*.{handlebars,json,lock,scss,sh,ts,tsx}'),
      resolve(root, '**/{test,__tests__}/**/*'),
    ]
  });

  paths.forEach(async (path: string) => {
    const destPath = resolve(dest, relative(root, path));

    console.log(`Copying '${path}' to '${destPath}'`);

    await mkdir(dirname(destPath));

    createReadStream(path)
      .pipe(
        createWriteStream(destPath)
      );
  });
})();
