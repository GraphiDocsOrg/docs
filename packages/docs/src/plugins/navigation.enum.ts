import { NavigationItemInterface, PluginInterface } from '../lib/interface';
import { ENUM, NavigationItem, NavigationSection, Plugin } from '../lib/utility';

export default class NavigationEnums extends Plugin implements PluginInterface {
  public getTypes(buildForType?: string): NavigationItemInterface[] {
    return this.document.types
      .filter((type: any): boolean => type.kind === ENUM)
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
      new NavigationSection('Enums', types)
    ];
  }
}
