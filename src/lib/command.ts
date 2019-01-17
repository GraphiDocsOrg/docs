///<reference path="./interface.d.ts"/>

import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
import { render } from 'mustache';
import { Output, Plugin, getFilenameOf, createData } from './utility';
import { readFile, writeFile, createBuildDirectory, resolve, removeBuildDirectory } from './utility/fs';
import {
  httpSchemaLoader,
  idlSchemaLoader,
  jsSchemaLoader,
  jsonSchemaLoader
} from './schema-loader';
import {
  PluginInterface,
  Schema,
  TypeRef,
} from './interface';
import {
  Command,
  NoParams,
  ValueFlag,
  ListValueFlag,
  BooleanFlag,
  InputInterface,
  OutputInterface
} from '@2fd/command';

const graphidocsPakageJSON = require(path.resolve(__dirname, '../../package.json'));

export type Params = {};

export type Flags = {
  configFile: string,
  endpoint: string,
  headers: string[],
  queries: string[],
  schemaFile: string,
  plugins: string[],
  template: string,
  data: any,
  output: string,
  force: boolean,
  verbose: boolean,
  version: boolean,
};

export type Partials = {
  [name: string]: string;
  index: string;
};

export type ProjectPackage = {
  graphidocs: Flags
};

export type Input = InputInterface<Flags, Params>;

export class GraphQLDocumentor extends Command<Flags, Params> {
  description = graphidocsPakageJSON.description + ' v' + graphidocsPakageJSON.version;

  params = new NoParams();

  flags = [
    new ValueFlag('configFile', ['-c', '--config'], 'Configuration file [./package.json].', String, './package.json'),
    new ValueFlag('endpoint', ['-e', '--endpoint'], 'Graphql http endpoint ["https://domain.com/graphql"].'),
    new ListValueFlag('headers', ['-x', '--header'], 'HTTP header for request (use with --endpoint). ["Authorization: Token cb8795e7"].'),
    new ListValueFlag('queries', ['-q', '--query'], 'HTTP querystring for request (use with --endpoint) ["token=cb8795e7"].'),
    new ValueFlag('schemaFile', ['-s', '--schema', '--schema-file'], 'Graphql Schema file ["./schema.json"].'),
    new ListValueFlag('plugins', ['-p', '--plugin'], 'Use plugins [default=graphidocs/plugins/default].'),
    new ValueFlag('template', ['-t', '--template'], 'Use template [default=graphidocs/template/slds].'),
    new ValueFlag('output', ['-o', '--output'], 'Output directory.'),
    new ValueFlag('data', ['-d', '--data'], 'Inject custom data.', JSON.parse, {}),
    new ValueFlag('baseUrl', ['-b', '--base-url'], 'Base url for templates.'),
    new BooleanFlag('force', ['-f', '--force'], 'Delete outputDirectory if exists.'),
    new BooleanFlag('verbose', ['-v', '--verbose'], 'Output more information.'),
    new BooleanFlag('version', ['-V', '--version'], 'Show graphidocs version.'),
  ];

  async action(input: Input, out: OutputInterface) {
    const output = new Output(out, input.flags);

    try {
      if (input.flags.version) {
        return output.out.log('graphidocs v%s', graphidocsPakageJSON.version);
      }

      // Load project info
      const projectPackageJSON: ProjectPackage = await this.getProjectPackage(input);

      // Load Schema
      const schema: Schema = await this.getSchema(projectPackageJSON);

      // Load plugins
      const plugins: PluginInterface[] = this.getPluginInstances(
        projectPackageJSON.graphidocs.plugins,
        schema,
        projectPackageJSON,
        graphidocsPakageJSON
      );

      projectPackageJSON.graphidocs.plugins.forEach(plugin => output.info('use plugin', plugin));

      // Collect assets
      const assets: string[] = await Plugin.collectAssets(plugins);

      assets.forEach(asset => output.info('use asset', path.relative(process.cwd(), asset)));

      // Ensure Ourput directory
      output.info('output directory', path.relative(
        process.cwd(),
        projectPackageJSON.graphidocs.output)
      );

      await this.ensureOutputDirectory(
        projectPackageJSON.graphidocs.output,
        projectPackageJSON.graphidocs.force
      );

      // Create Ourput directory
      await createBuildDirectory(
        projectPackageJSON.graphidocs.output,
        projectPackageJSON.graphidocs.template,
        assets
      );

      // Collect partials
      const partials: Partials = await this.getTemplatePartials(
        projectPackageJSON.graphidocs.template
      );

      // Render index.html
      output.info('render', 'index');
      await this.renderFile(
        projectPackageJSON,
        partials,
        plugins
      );

      // Render types
      const renderTypes = ([] as any[])
        .concat(schema.types || [])
        .concat(schema.directives || [])
        .map((type: TypeRef) => {
          output.info('render', type.name);

          return this.renderFile(
            projectPackageJSON,
            partials,
            plugins,
            type
          );
        });

      const files = await Promise.all(renderTypes);

      output.ok('complete', String(files.length + 1 /* index.html */) + ' files generated.');
    } catch (err) {
      output.error(err);
    }
  }

  async ensureOutputDirectory(dir: string, force: boolean) {
    try {
      const stats = fs.statSync(dir);

      if (!stats.isDirectory()) {
        return Promise.reject(
          new Error('Unexpected output: ' + dir + ' is not a directory.')
        );
      }

      if (!force) {
        return Promise.reject(
          new Error(dir + ' already exists (delete it or use the --force flag)')
        );
      }

      return removeBuildDirectory(dir);
    } catch (err) {
      return err.code === 'ENOENT'
        ? Promise.resolve()
        : Promise.reject(err);
    }
  }

  getProjectPackage(input: Input) {
    let packageJSON: any & { graphidocs: any };

    try {
      packageJSON = require(path.resolve(input.flags.configFile));
    } catch (err) {
      packageJSON = {};
    }

    packageJSON.graphidocs = Object.assign(packageJSON.graphidocs || {}, input.flags);

    if (packageJSON.graphidocs.data) {
      const data = packageJSON.graphidocs.data;

      packageJSON.graphidocs = Object.assign(data, packageJSON.graphidocs);
    }

    if (packageJSON.graphidocs.plugins.length === 0) {
      packageJSON.graphidocs.plugins = ['graphidocs/plugins/default'];
    }

    packageJSON.graphidocs.baseUrl = packageJSON.graphidocs.baseUrl || './';
    packageJSON.graphidocs.template = resolve(packageJSON.graphidocs.template || 'graphidocs/template/slds');
    packageJSON.graphidocs.output = path.resolve(packageJSON.graphidocs.output);
    packageJSON.graphidocs.version = graphidocsPakageJSON.version;

    if (!packageJSON.graphidocs.output) {
      return Promise.reject(
        new Error('Flag output (-o, --output) is required')
      );
    }

    return Promise.resolve(packageJSON);
  }

  getPluginInstances(paths: string[], schema: Schema, projectPackageJSON: object, graphidocsPakageJSON: object): PluginInterface[] {
    return paths
      .map(path => {
        const absolutePaths = resolve(path);
        const Plugin = require(absolutePaths).default;

        return typeof Plugin === 'function'
          // plugins as contructor
          ? new Plugin(schema, projectPackageJSON, graphidocsPakageJSON)
          // plugins plain object
          : Plugin;
      });
  }

  async getTemplatePartials(templateDir: string): Promise<Partials> {
    const files = await new Promise<string[]>((resolve, reject) => glob(
      '**/*.mustache',
      { cwd: templateDir },
      (err, files) => err ? reject(err) : resolve(files)
    ));

    const partials = {} as Partials;

    await Promise.all(files.map(file => {
      const name = path.basename(file, '.mustache');

      return readFile(path.resolve(templateDir, file), 'utf8')
        .then(content => partials[name] = content);
    }));

    if (!partials.index) {
      throw new Error(
        'The index partial is missing (file ' +
        path.resolve(templateDir, 'index.mustache') + ' not found).'
      );
    }

    return partials;
  }

  async getSchema(projectPackage: ProjectPackage): Promise<Schema> {
    if (projectPackage.graphidocs.schemaFile) {
      const schemaFileExt = path.extname(projectPackage.graphidocs.schemaFile);

      switch (schemaFileExt) {
        case '.json':
          return jsonSchemaLoader(projectPackage.graphidocs);
        case '.gql':
        case '.gqls':
        case '.graphqls':
        case '.graphql':
          return idlSchemaLoader(projectPackage.graphidocs);
        case '.js':
        case '.ts':
          return jsSchemaLoader(projectPackage.graphidocs);
        default:
          return Promise.reject(new Error(
            'Unexpected schema extension name: ' + schemaFileExt
          ));
      }
    } else if (projectPackage.graphidocs.endpoint) {
      return httpSchemaLoader(projectPackage.graphidocs);
    } else {
      return Promise.reject(
        new Error('Endpoint (--endpoint, -e) or Schema File (--schema, -s) are require.')
      );
    }
  }

  async renderFile(projectPackageJSON: ProjectPackage, partials: Partials, plugins: PluginInterface[], type?: TypeRef) {
    const templateData = await createData(projectPackageJSON, graphidocsPakageJSON, plugins, type);
    const file = type ? getFilenameOf(type) : 'index.html';
    const filepath = path.resolve(projectPackageJSON.graphidocs.output, file);

    return await writeFile(filepath, render(partials.index, templateData, partials));
  }
}
