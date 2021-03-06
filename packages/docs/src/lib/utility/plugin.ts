// tslint:disable:max-classes-per-file
import * as url from 'url';

import {
  Directive,
  DocumentSectionInterface,
  NavigationItemInterface,
  NavigationSectionInterface,
  PluginImplementedInterface,
  PluginInterface,
  Schema,
  SchemaType,
  TypeRef,
} from '../interface';

import { getFilenameOf } from './introspection';

/**
 * Plugin Base implementation
 */
export abstract class Plugin implements PluginInterface, PluginImplementedInterface {
  public static collect<T>(collection: T[][]): T[] {
    let result: T[] = [];

    collection
      .forEach(item => {
        if (Array.isArray(item)) {
          result = result.concat(item);
        }
      });

    return result;
  }

  public static async collectNavigations(plugins: PluginInterface[], buildForType?: string): Promise<NavigationSectionInterface[]> {
    const navigationCollection = await Promise
      .all<NavigationSectionInterface[]>(plugins.map(plugin =>
        plugin.getNavigations
          ? plugin.getNavigations(buildForType)
          : null as any
      ));

    return Plugin.collect(navigationCollection);
  }

  public static async collectDocuments(plugins: PluginInterface[], buildForType?: string): Promise<DocumentSectionInterface[]> {
    const navigationCollection = await Promise
      .all<DocumentSectionInterface[]>(plugins.map(plugin =>
        plugin.getDocuments
          ? plugin.getDocuments(buildForType)
          : null as any
      ));

    return Plugin.collect(navigationCollection);
  }

  public static async collectHeaders(plugins: PluginInterface[], buildForType?: string): Promise<string[]> {
    const headerCollection = await Promise
      .all<string[]>(plugins.map(plugin =>
        plugin.getHeaders
          ? plugin.getHeaders(buildForType)
          : null as any
      ));

    return Plugin.collect(headerCollection);
  }

  public static async collectAssets(plugins: PluginInterface[]): Promise<string[]> {
    const assetCollection = await Promise
      .all<string[]>(plugins.map(plugin =>
        plugin.getAssets
          ? plugin.getAssets()
          : null as any
      ));

    return Plugin.collect(assetCollection);
  }

  public queryType: SchemaType | null = null;

  public mutationType: SchemaType | null = null;

  public subscriptionType: SchemaType | null = null;

  public typeMap: { [name: string]: SchemaType } = {};

  public directiveMap: { [name: string]: Directive } = {};

  // getDocuments?: (buildForType?: string) => DocumentSectionInterface[] | PromiseLike<DocumentSectionInterface[]>;
  // getHeaders?: (buildForType?: string) => string[] | PromiseLike<string[]>;
  // getAssets?: () => string[] | PromiseLike<string[]>;

  constructor(
      public document: Schema,
      public projectPackage: any,
      public graphidocsPackage: any,
  ) {
    this.document.types = this.document.types
      ? this.document.types.sort(sortTypes)
      : [];

    this.document.directives = this.document.directives
        ? this.document.directives.sort((a: any, b: any) => a.name.localeCompare(b.name))
        : [];

    this.document.types.forEach((type: any): void => {
      this.typeMap[type.name] = type;
    });

    this.document.directives.forEach((directive: any): void => {
      this.directiveMap[directive.name] = directive;
    });

    if (document.queryType) {
      this.queryType = this.typeMap[document.queryType.name];
    }

    if (document.mutationType) {
      this.mutationType = this.typeMap[document.mutationType.name];
    }

    if (document.subscriptionType) {
      this.subscriptionType = this.typeMap[document.subscriptionType.name];
    }
  }

  public getNavigations(_buildForType?: string): NavigationSection[] | Promise<NavigationSectionInterface[]> {
    return [];
  }

  public url(type: TypeRef): string {
    return url.resolve(this.projectPackage.graphidocs.baseUrl, getFilenameOf(type));
  }
}

/**
 * NavigationSectionInterface short implementation
 */
export class NavigationSection implements NavigationSectionInterface {
  constructor(
    public title: string,
    public items: NavigationItem[] = []
  ) { }
}

/**
 * NavigationItemInterface short implementation
 */
export class NavigationItem implements NavigationItemInterface {
  constructor(
    public text: string,
    public href: string,
    public isActive: boolean
  ) {}
}

/**
 * DocumentSectionInterface short implementation
 */
export class DocumentSection implements DocumentSectionInterface {
  constructor(
    public title: string,
    public description: string,
  ) {}
}

function priorityType(type: SchemaType): number {
  return (
    // tslint:disable-next-line:no-bitwise
    0 /* initial priority */ |
    (type.name[0] === '_' ? 1 : 0) /* protected type priority */ |
    (type.name[0] === '_' && type.name[1] === '_' ? 2 : 0) /* spec type priority */
  );
}

export function sortTypes(a: SchemaType, b: SchemaType): number {
  const priorityA = priorityType(a);
  const priorityB = priorityType(b);

  if (priorityA === priorityB) {
    return a.name.localeCompare(b.name);
  }

  return priorityA - priorityB;
}
