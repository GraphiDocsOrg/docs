import * as fs from 'fs';
import * as globby from 'globby';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as util from 'util';

const PUBLIC_RE = /^public\//;

(async () => {
  const copy = util.promisify(fs.copyFile);
  const mkdir = util.promisify(mkdirp);
  const dest = path.resolve(__dirname, '../gh-pages');

  await mkdir(dest);

  const paths = await globby([
    'public/**/*',
    '!public/build.ts',
    'packages/docs/src/template/classic/scripts/*.js',
    'packages/docs/src/template/classic/fonts/**/*',
    'packages/docs/src/template/classic/styles/*.css'
  ]);

  if (paths.length) {
    await Promise.all(
      paths.map(async (file) => {
        const fullPath = path.resolve(__dirname, '..', file);
        const destPath = path.resolve(
          dest,
          file.match(PUBLIC_RE)
            ? file.replace(PUBLIC_RE, '')
            : file
        );

        await mkdir(path.dirname(destPath));

        return copy(fullPath, destPath);
      })
    );

    console.log('GitHub pages successfully built');
  } else {
    throw new Error('No files to copy!');
  }
})();
