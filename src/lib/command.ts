import {
  BooleanFlag,
  Command,
  InputInterface,
  ListValueFlag,
  NoParams,
  OutputInterface,
  ValueFlag
} from '@2fd/command';
import * as fs from 'fs';
import * as path from 'path';
import {
  PluginInterface,
  Schema,
} from './interface';
import {
  httpSchemaLoader,
  idlSchemaLoader,
  jsonSchemaLoader,
  jsSchemaLoader
} from './schema-loader';
import Template from './Template';
import { Output, Plugin } from './utility';
import { createBuildDirectory, removeBuildDirectory, resolve } from './utility/fs';

// tslint:disable-next-line:no-var-requires
const graphidocsPackageJSON = require(path.resolve(__dirname, '../../package.json'));

const defaultTemplate = 'classic';

// tslint:disable-next-line:no-empty-interface
export interface IParams {}

export interface IFlags {
  configFile: string;
  endpoint: string;
  headers: string[];
  queries: string[];
  schemaFile: string;
  plugins: string[];
  template: string;
  templateInstance?: Template;
  data: any;
  output: string;
  force: boolean;
  verbose: boolean;
  version: boolean;
}

export interface IPartials {
  [name: string]: string;
  index: string;
}

export interface IProjectPackage {
  graphidocs: IFlags;
}

export type Input = InputInterface<IFlags, IParams>;

export class GraphQLDocumentor extends Command<IFlags, IParams> {
  public description = `${graphidocsPackageJSON.description} v${graphidocsPackageJSON.version}`;

  public params = new NoParams();

  public flags = [
    new ValueFlag('configFile', ['-c', '--config'], 'Configuration file [./package.json].', String, './package.json'),
    new ValueFlag('endpoint', ['-e', '--endpoint'], 'Graphql http endpoint ["https://domain.com/graphql"].'),
    new ListValueFlag('headers', ['-x', '--header'], 'HTTP header for request (use with --endpoint). ["Authorization: Token cb8795e7"].'),
    new ListValueFlag('queries', ['-q', '--query'], 'HTTP querystring for request (use with --endpoint) ["token=cb8795e7"].'),
    new ValueFlag('schemaFile', ['-s', '--schema', '--schema-file'], 'Graphql Schema file ["./schema.json"].'),
    new ListValueFlag('plugins', ['-p', '--plugin'], 'Use plugins [default=graphidocs/plugins/default].'),
    new ValueFlag('template', ['-t', '--template'], `Use template [default=graphidocs/template/${defaultTemplate}].`),
    new ValueFlag('output', ['-o', '--output'], 'Output directory.'),
    new ValueFlag('data', ['-d', '--data'], 'Inject custom data.', JSON.parse, {}),
    new ValueFlag('baseUrl', ['-b', '--base-url'], 'Base url for templates.'),
    new BooleanFlag('force', ['-f', '--force'], 'Delete outputDirectory if exists.'),
    new BooleanFlag('verbose', ['-v', '--verbose'], 'Output more information.'),
    new BooleanFlag('version', ['-V', '--version'], 'Show graphidocs version.'),
  ];

  public async action(input: Input, out: OutputInterface) {
    const output = new Output(out, input.flags);

    try {
      if (input.flags.version) {
        return output.out.log('graphidocs v%s', graphidocsPackageJSON.version);
      }

      // Load project info
      const projectPackageJSON: IProjectPackage = await this.getProjectPackage(input);

      // Load Schema
      const schema: Schema = await this.getSchema(projectPackageJSON);

      // Load plugins
      const plugins: PluginInterface[] = this.getPluginInstances(
        projectPackageJSON.graphidocs.plugins,
        schema,
        projectPackageJSON,
        graphidocsPackageJSON
      );

      projectPackageJSON.graphidocs.plugins.forEach(plugin => output.info('use plugin', plugin));

      // Collect assets
      const assets: string[] = await Plugin.collectAssets(plugins);

      assets.forEach(asset => output.info('use asset', path.relative(process.cwd(), asset)));

      // Ensure Output directory
      output.info('output directory', path.relative(
        process.cwd(),
        projectPackageJSON.graphidocs.output)
      );

      await this.ensureOutputDirectory(
        projectPackageJSON.graphidocs.output,
        projectPackageJSON.graphidocs.force
      );

      // Create Output directory
      await createBuildDirectory(
        projectPackageJSON.graphidocs.output,
        projectPackageJSON.graphidocs.template,
        assets
      );

      const renderResult = await this.renderTemplate(projectPackageJSON, plugins, schema);

      output.ok('complete', `${renderResult.length} files generated.`);
    } catch (err) {
      output.error(err);
    }
  }

  public async ensureOutputDirectory(dir: string, force: boolean) {
    try {
      const stats = fs.statSync(dir);

      if (!stats.isDirectory()) {
        return Promise.reject(
          new Error(`Unexpected output: ${dir} is not a directory.`)
        );
      }

      if (!force) {
        return Promise.reject(
          new Error(`${dir} already exists (delete it or use the --force flag)`)
        );
      }

      return removeBuildDirectory(dir);
    } catch (err) {
      return err.code === 'ENOENT'
        ? Promise.resolve()
        : Promise.reject(err);
    }
  }

  public getProjectPackage(input: Input) {
    let packageJSON: any & { graphidocs: any };

    try {
      packageJSON = require(path.resolve(input.flags.configFile));
    } catch (err) {
      packageJSON = {};
    }

    packageJSON.graphidocs = {...(packageJSON.graphidocs || {}), ...input.flags};

    if (packageJSON.graphidocs.data) {
      const data = packageJSON.graphidocs.data;

      packageJSON.graphidocs = {...data, ...packageJSON.graphidocs};
    }

    if (packageJSON.graphidocs.plugins.length === 0) {
      packageJSON.graphidocs.plugins = ['graphidocs/plugins/default'];
    }

    packageJSON.graphidocs.baseUrl = packageJSON.graphidocs.baseUrl || './';
    packageJSON.graphidocs.template = resolve(packageJSON.graphidocs.template || `graphidocs/template/${defaultTemplate}`);
    packageJSON.graphidocs.output = path.resolve(packageJSON.graphidocs.output);
    packageJSON.graphidocs.version = graphidocsPackageJSON.version;

    if (!packageJSON.graphidocs.output) {
      return Promise.reject(
        new Error('Flag output (-o, --output) is required')
      );
    }

    return Promise.resolve(packageJSON);
  }

  public getPluginInstances(paths: string[], schema: Schema, projectPackageJSON: object, packageJSON: object): PluginInterface[] {
    return paths
      .map((pathItem: any) => {
        const absolutePaths = resolve(pathItem);
        const plugin = require(absolutePaths).default;

        return typeof plugin === 'function'
          // plugins as constructor
          ? new plugin(schema, projectPackageJSON, packageJSON)
          // plugins plain object
          : plugin;
      });
  }

  public async getSchema(projectPackage: IProjectPackage): Promise<Schema> {
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
            `Unexpected schema extension name: ${schemaFileExt}`
          ));
      }
    }  if (projectPackage.graphidocs.endpoint) {
      return httpSchemaLoader(projectPackage.graphidocs);
    }

    return Promise.reject(
      new Error('Endpoint (--endpoint, -e) or Schema File (--schema, -s) are require.')
    );
  }

  public async renderTemplate(projectPackageJSON: IProjectPackage, plugins: PluginInterface[], schema: Schema) {
    const templateInstance = Template.resolveTemplate(projectPackageJSON, graphidocsPackageJSON, {
      plugins, schema
    });

    return templateInstance.render();
  }
}
