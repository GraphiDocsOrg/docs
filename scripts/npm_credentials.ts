import * as fs from 'fs';
import * as util from 'util';

const fstat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const [, , file, token] = process.argv;
const credRe = /^\/\/registry\.npmjs\.org\/:_authToken=[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/im;
const data = `//registry.npmjs.org/:_authToken=${token}\n`;

(async () => {
  try {
    await fstat(file);

    const source = await readFile(file, 'utf8');

    if (!source.match(credRe)) {
      const trimmed = source.trim();

      await writeFile(`${trimmed}\n${data}`, data);
    }
  } catch (e) {
    await writeFile(file, data);
  }
})();
