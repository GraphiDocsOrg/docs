import * as marked from 'marked';
import * as slug from 'slug';
import {
  DocumentSectionInterface,
  NavigationSectionInterface,
  PluginInterface,
  TypeRef
} from '../interface';
import { Plugin } from './plugin';

export function slugTemplate() {
  return (text: any, render: any): string => slug(render(text)).toLowerCase();
}

export interface ITemplateData {
  title: string;
  type?: TypeRef;
  description: string;
  headers: string;
  navigations: NavigationSectionInterface[];
  documents: DocumentSectionInterface[];
  projectPackage: any;
  graphidocsPackage: any;
  slug: typeof slugTemplate;
}

type Headers = string[];
type Navs = NavigationSectionInterface[];
type Docs = DocumentSectionInterface[];

export async function createData(
  projectPackage: any,
  graphidocsPackage: any,
  plugins: PluginInterface[],
  type?: TypeRef
): Promise<ITemplateData> {
  const name = type && type.name;
  const [headers, navigations, documents]: [Headers, Navs, Docs] = await Promise.all([
    Plugin.collectHeaders(plugins, name),
    Plugin.collectNavigations(plugins, name),
    Plugin.collectDocuments(plugins, name),
  ]);

  const title = name ||
    projectPackage.graphidocs.title ||
    'Graphql schema documentation';

  const description = type
    ? marked(type.description || '')
    : projectPackage.description;

  return {
    description,
    documents,
    graphidocsPackage,
    navigations,
    projectPackage,
    title,
    type,
    // tslint:disable-next-line:object-literal-sort-keys
    headers: headers.join(''),
    slug: slugTemplate,
  };
}
