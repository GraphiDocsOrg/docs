import { NavigationItemInterface, PluginInterface } from '../lib/interface';
import { NavigationItem, NavigationSection, Plugin, SCALAR } from '../lib/utility';

export default class NavigationScalars extends Plugin implements PluginInterface {

  public getTypes(buildForType?: string): NavigationItemInterface[] {
    return this.document.types
      .filter((type: any): boolean => type.kind === SCALAR)
      .map((type: any) => new NavigationItem(
        type.name,
        this.url(type),
        type.name === buildForType
      ));
  }

  public getNavigations(buildForType?: string): NavigationSection[] {
    const types: NavigationItemInterface[] = this.getTypes(buildForType);

    if (types.length === 0) {
      return [];
    }

    return [
      new NavigationSection('Scalars', types)
    ];
  }
}
