import * as glob from 'glob';
import { render } from 'mustache';
import { TypeRef } from '../../lib/interface';
import Template, { ITemplateFileMap } from '../../lib/Template';
import { getFilenameOf } from '../../lib/utility';
import { ITemplateData } from '../../lib/utility/template';

export default class ClassicTemplate extends Template {
  public async getTemplateFiles(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => glob(
      '**/*.mustache',
      { cwd: __dirname },
      (error, files) => error ? reject(error) : resolve(files)
    ));
  }

  public serialize(templateData: ITemplateData, templateFiles: ITemplateFileMap): string {
    return render(templateFiles.index, templateData, templateFiles);
  }

  public renderDirective(type: TypeRef): Promise<void> {
    return this.renderFile(getFilenameOf(type), type);
  }

  public renderIndex(): Promise<void> {
    return this.renderFile('index.html');
  }

  public renderType(type: TypeRef): Promise<void> {
    return this.renderFile(getFilenameOf(type), type);
  }
}
