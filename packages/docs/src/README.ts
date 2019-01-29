import { execSync } from 'child_process';
import * as Handlebars from 'handlebars';
import { join } from 'path';
import * as request from 'request';

import { readFile, writeFile } from './lib/utility/fs';

Handlebars.registerHelper('bash', (command: string) =>
  execSync(command).toString().replace(/\[\d{1,2}m/gi, '')
);

async function fromGithub (endpoint: string): Promise<string> {
  return new Promise((resolve, reject) => {
    request({
      headers: { 'User-Agent': 'README generator' },
      json: true,
      method: 'GET',
      url: `https://api.github.com/${endpoint}`
    }, (error, _response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

const cwd = process.cwd();

Promise
  .all([
    readFile(join(cwd, 'README.handlebars'), 'utf8'),
    fromGithub('repos/GraphiDocsOrg/docs'),
    fromGithub('repos/GraphiDocsOrg/docs/contributors')
      .then((contributors: any) => contributors.filter((c: any) => c.login !== 'GraphiDocsOrg') ),
  ])
  .then(([template, project, contributors]) =>
    writeFile(join(cwd, 'README.md'),  Handlebars.compile(template)({project, contributors}))
  );
