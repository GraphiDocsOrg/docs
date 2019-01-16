import * as Handlebars from 'handlebars';
import * as request from 'request';
import * as util from 'util';

import { readFile, writeFile } from './lib/utility/fs';

import { execSync } from 'child_process';

Handlebars.registerHelper('bash', (command: string) =>
  execSync(command).toString().replace(/\[\d{1,2}m/gi, '')
)

async function fromGithub (endpoint: string) {
  return util
    .promisify(request)({
      method: 'GET',
      url: 'https://api.github.com/' + endpoint,
      json: true,
      headers: { 'User-Agent': 'README generator' }
    })
    .then(response => response.body)
}

Promise
  .all([
    readFile('./README.handlebars', 'utf8'),
    fromGithub('repos/GraphiDocsOrg/docs'),
    fromGithub('repos/GraphiDocsOrg/docs/contributors')
      .then(contributors => contributors.filter(c => c.login !== 'GraphiDocsOrg') ),
  ])
  .then(([template, project, contributors]) =>
    writeFile('README.md',  Handlebars.compile(template)({project, contributors}))
  )
