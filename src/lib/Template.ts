import * as path from 'path';
import { IProjectPackage } from './command';
import { PluginInterface, Schema, TypeRef } from './interface';
import { asyncForEach, createData } from './utility';
import { readFile, writeFile } from './utility/fs';
import { ITemplateData } from './utility/template';

export interface ITemplate {
  graphidocsPackageJSON: any;
  plugins: PluginInterface[];
  projectPackageJSON: IProjectPackage;
  schema: Schema;
}

export interface ITemplateFileMap {
  [name: string]: string;
}

export default class Template {
  public static resolveTemplate(projectPackageJSON: IProjectPackage, graphidocsPackageJSON: any, config: any): Template {
    const { template, templateInstance } = projectPackageJSON.graphidocs;

    if (!templateInstance && typeof template === 'string') {
      const { default: TemplateCls } = require(template);

      return projectPackageJSON.graphidocs.templateInstance = new TemplateCls({
        ...config,
        graphidocsPackageJSON,
        projectPackageJSON,
      });
    }

    if (!templateInstance) {
      throw new Error('Template was not found!');
    }

    return templateInstance;
  }

  protected graphidocsPackageJSON: any;
  protected plugins: PluginInterface[];
  protected projectPackageJSON: IProjectPackage;
  protected schema: Schema;

  protected _templateFiles: any;

  constructor(config: ITemplate) {
    this.graphidocsPackageJSON = config.graphidocsPackageJSON;
    this.plugins = config.plugins;
    this.projectPackageJSON = config.projectPackageJSON;
    this.schema = config.schema;
  }

  get templateFiles() {
    if (this._templateFiles) {
      return this._templateFiles;
    }


    return (async () => {
      const files = await this.getTemplateFiles();
      const map = await this.parseTemplateFiles(files);

      this.templateFiles = map;

      return map;
    })();
  }

  set templateFiles(files) {
    this._templateFiles = files;
  }

  public async parseTemplateFiles(files: string[]): Promise<ITemplateFileMap> {
    const map: ITemplateFileMap = {};
    const { template } = this.projectPackageJSON.graphidocs;

    await asyncForEach(files, async (file: string) => {
      const { name } = path.parse(file);
      const source = await this.readTemplateFile(path.resolve(template, file));

      map[ name ] = source;
    });

    return map;
  }

  public readTemplateFile(file: string): Promise<string> {
    return readFile(file, 'utf8');
  }

  public render(): Promise<void[]> {
    const promises: any[] = [
      this.renderIndex()
    ];

    if (Array.isArray(this.schema.types) && this.schema.types.length) {
      promises.push(...this.schema.types.map((type: TypeRef) => this.renderType(type)));
    }

    if (Array.isArray(this.schema.directives) && this.schema.directives.length) {
      promises.push(...this.schema.directives.map((type: TypeRef) => this.renderDirective(type)));
    }

    return Promise.all(promises);
  }

  public async renderFile(file: string, type?: TypeRef): Promise<void> {
    const templateData = await createData(this.projectPackageJSON, this.graphidocsPackageJSON, this.plugins, type);
    const templateFiles = await this.templateFiles;
    const filepath = path.resolve(this.projectPackageJSON.graphidocs.output, file);

    return writeFile(filepath, this.serialize(templateData, templateFiles));
  }

  /** Subclass required methods */
  public getTemplateFiles(): Promise<string[]> {
    throw new Error('`getTemplateFiles` must be overridden in subclass');
  }

  public renderDirective(_type: TypeRef): Promise<void> {
    throw new Error('`renderDirective` must be overridden in subclass');
  }

  public renderIndex(): Promise<void> {
    throw new Error('`renderIndex` must be overridden in subclass');
  }

  public renderType(_type: TypeRef): Promise<void> {
    throw new Error('`renderType` must be overridden in subclass');
  }

  public serialize(_templateData: ITemplateData, _templateFiles: ITemplateFileMap): string {
    throw new Error('`serialize` must be overridden in subclass');
  }
}
