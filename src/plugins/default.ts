import { Plugin } from '../lib/utility';
import {
  Schema,
  PluginInterface,
  DocumentSectionInterface,
  NavigationSectionInterface,
} from '../lib/interface';
import NavigationSchema from './navigation.schema';
import NavigationScalar from './navigation.scalar';
import NavigationEnum from './navigation.enum';
import NavigationInterfaces from './navigation.interface';
import NavigationUnion from './navigation.union';
import NavigationObject from './navigation.object';
import NavigationIput from './navigation.input';
import NavigationDirective from './navigation.directive';
import DocumentSchema from './document.schema';
import RequireByPlugin from './document.require-by';

export default class NavigationDirectives extends Plugin implements PluginInterface {
  plugins: PluginInterface[];

  constructor(document: Schema, graphidocsPackage: any, projectPackage: any) {
    super(document, graphidocsPackage, projectPackage);

    this.plugins = [
      new NavigationSchema(document, graphidocsPackage, projectPackage),
      new NavigationScalar(document, graphidocsPackage, projectPackage),
      new NavigationEnum(document, graphidocsPackage, projectPackage),
      new NavigationInterfaces(document, graphidocsPackage, projectPackage),
      new NavigationUnion(document, graphidocsPackage, projectPackage),
      new NavigationObject(document, graphidocsPackage, projectPackage),
      new NavigationIput(document, graphidocsPackage, projectPackage),
      new NavigationDirective(document, graphidocsPackage, projectPackage),
      new DocumentSchema(document, graphidocsPackage, projectPackage),
      new RequireByPlugin(document, graphidocsPackage, projectPackage),
    ];
  }

  getNavigations(buildForType?: string): Promise<NavigationSectionInterface[]> {
    return Plugin.collectNavigations(this.plugins, buildForType);
  };

  getDocuments(buildForType?: string): Promise<DocumentSectionInterface[]> {
    return Plugin.collectDocuments(this.plugins, buildForType);
  };

  getHeaders(buildForType?: string): Promise<string[]> {
    return Plugin.collectHeaders(this.plugins, buildForType);
  }

  getAssets(): Promise<string[]> {
    return Plugin.collectAssets(this.plugins);
  }
}
