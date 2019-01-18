import {
  DocumentSectionInterface,
  NavigationSectionInterface,
  PluginInterface,
  Schema,
} from '../lib/interface';
import { Plugin } from '../lib/utility';
import documentRequireBy from './document.require-by';
import documentSchema from './document.schema';
import navigationDirective from './navigation.directive';
import navigationEnum from './navigation.enum';
import navigationInput from './navigation.input';
import navigationInterface from './navigation.interface';
import navigationObject from './navigation.object';
import navigationScalar from './navigation.scalar';
import navigationSchema from './navigation.schema';
import navigationUnion from './navigation.union';

export default class NavigationDirectives extends Plugin implements PluginInterface {
  public plugins: PluginInterface[];

  constructor(document: Schema, graphidocsPackage: any, projectPackage: any) {
    super(document, graphidocsPackage, projectPackage);

    this.plugins = [
      new navigationSchema(document, graphidocsPackage, projectPackage),
      new navigationScalar(document, graphidocsPackage, projectPackage),
      new navigationEnum(document, graphidocsPackage, projectPackage),
      new navigationInterface(document, graphidocsPackage, projectPackage),
      new navigationUnion(document, graphidocsPackage, projectPackage),
      new navigationObject(document, graphidocsPackage, projectPackage),
      new navigationInput(document, graphidocsPackage, projectPackage),
      new navigationDirective(document, graphidocsPackage, projectPackage),
      new documentSchema(document, graphidocsPackage, projectPackage),
      new documentRequireBy(document, graphidocsPackage, projectPackage),
    ];
  }

  public getNavigations(buildForType?: string): Promise<NavigationSectionInterface[]> {
    return Plugin.collectNavigations(this.plugins, buildForType);
  }

  public getDocuments(buildForType?: string): Promise<DocumentSectionInterface[]> {
    return Plugin.collectDocuments(this.plugins, buildForType);
  }

  public getHeaders(buildForType?: string): Promise<string[]> {
    return Plugin.collectHeaders(this.plugins, buildForType);
  }

  public getAssets(): Promise<string[]> {
    return Plugin.collectAssets(this.plugins);
  }
}
