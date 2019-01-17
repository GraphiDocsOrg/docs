import { execSync } from 'child_process';
import * as Handlebars from 'handlebars';
import * as request from 'request';
import { join } from 'path';

import { readFile, writeFile } from './lib/utility/fs';

Handlebars.registerHelper('bash', (command: string) =>
  execSync(command).toString().replace(/\[\d{1,2}m/gi, '')
)

async function fromGithub (endpoint: string): Promise<String> {
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      url: 'https://api.github.com/' + endpoint,
      json: true,
      headers: { 'User-Agent': 'README generator' }
    }, (error, _response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

Promise
  .all([
    readFile(join(__dirname, '../README.handlebars'), 'utf8'),
    fromGithub('repos/GraphiDocsOrg/docs'),
    fromGithub('repos/GraphiDocsOrg/docs/contributors')
      .then((contributors: any) => contributors.filter((c: any) => c.login !== 'GraphiDocsOrg') ),
  ])
  .then(([template, project, contributors]) =>
    writeFile('README.md',  Handlebars.compile(template)({project, contributors}))
  );
