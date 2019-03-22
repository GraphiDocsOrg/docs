import { resolve } from 'path';
import * as striptags from 'striptags';
import {
  DocumentSectionInterface,
  PluginInterface,
  Schema,
  SchemaType,
} from '../../lib/interface';
import {
  ENUM,
  getTypeOf,
  INPUT_OBJECT,
  INTERFACE,
  OBJECT,
  Plugin,
  SCALAR,
  UNION,
} from '../../lib/utility';

export default class RequireByPlugin extends Plugin implements PluginInterface {
  public requireBy: Map<string, SchemaType[]>;

  constructor(
      public document: Schema,
      public projectPackage: any,
      public graphidocsPackage: any,
  ) {
    super(document, projectPackage, graphidocsPackage);

    this.requireBy = new Map();

    if (Array.isArray(document.types)) {
      document.types.forEach((type: SchemaType) => {
        switch (type.kind) {
          // Scalars and enums have no dependencies
          case SCALAR:
          case ENUM:
            return;
          case OBJECT:
          case INTERFACE:
          case UNION:
          case INPUT_OBJECT:
            this.getDependencies(type)
              .forEach((curr: string) => {
                const deps = this.requireBy.get(curr) || [];

                deps.push(type);

                this.requireBy.set(curr, deps);
              });
            break;
        }
      });
    }
  }

  public getAssets() {
    return [
      resolve(__dirname, 'require-by.css')
    ];
}

  public getDependencies(type: SchemaType): string[] {
    const deps: string[] = [];

    if (Array.isArray(type.interfaces) && type.interfaces.length > 0) {
      type.interfaces.forEach((i: any) => deps.push(i.name));
    }

    if (Array.isArray(type.fields) && type.fields.length > 0) {
      type.fields
        .forEach((field: any): void => {
          deps.push(getTypeOf(field.type).name);

          if (Array.isArray(field.args) && field.args.length > 0) {
            field.args.forEach((arg: any) => {
              deps.push(getTypeOf(arg.type).name);
            });
          }
        });
    }

    if (Array.isArray(type.inputFields) && type.inputFields.length > 0) {
      type.inputFields.forEach((field: any): void => {
        deps.push(getTypeOf(field.type).name);
      });
    }

    if (type.kind !== INTERFACE && Array.isArray(type.possibleTypes) && type.possibleTypes.length > 0) {
      type.possibleTypes.forEach((t: any): void => {
        deps.push(getTypeOf(t).name);
      });
    }

    return deps;
  }

  public getDescription(type: SchemaType): string {
    return `<li>
      <a href="${this.url(type)}" title="
        ${type.name} - ${striptags(type.description).replace(/"/gi, '&quot;')}
      ">
        ${type.name}<em>${type.description}</em>
      </a>
    <li>`;
  }

  public getDocuments(buildForType?: string): DocumentSectionInterface[] {
    if (!buildForType) {
      return [];
    }

    const requireBy = this.requireBy.get(buildForType);

    if (!Array.isArray(requireBy) || requireBy.length === 0) {
      return [
        {
          description: '<div class="require-by anyone">This element is not required by anyone</div>',
          title: 'Required by',
        }
      ];
    }

    const used = new Set();

    return [
      {
        description: `<ul class="require-by">
          ${requireBy
              .filter((t) => used.has(t.name) ? false : used.add(t.name))
              .map(t => this.getDescription(t))
              .join('')}
          </ul>`,
        title: 'Required by',
      }
    ];
  }

  public getHeaders(): string[] {
    return [
      '<link type="text/css" rel="stylesheet" href="./assets/require-by.css" />',
    ];
  }
}
