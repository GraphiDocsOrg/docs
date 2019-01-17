import { SCALAR, Plugin, NavigationSection, NavigationItem } from '../lib/utility';
import { PluginInterface, NavigationItemInterface } from '../lib/interface';

export default class NavigationScalars extends Plugin implements PluginInterface {

  getTypes(buildForType?: string): NavigationItemInterface[] {
    return this.document.types
      .filter((type: any): boolean => type.kind === SCALAR)
      .map((type: any) => new NavigationItem(
        type.name,
        this.url(type),
        type.name === buildForType
      ));
  }

  getNavigations(buildForType?: string): NavigationSection[] {
    const types: NavigationItemInterface[] = this.getTypes(buildForType);

    if (types.length === 0) {
      return [];
    }

    return [
      new NavigationSection('Scalars', types)
    ];
  }
}
