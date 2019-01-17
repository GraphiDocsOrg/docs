import { OBJECT, Plugin, NavigationSection, NavigationItem } from '../lib/utility';
import { PluginInterface, NavigationItemInterface } from '../lib/interface';

export default class NavigationObjects extends Plugin implements PluginInterface {
  getTypes(buildForType?: string): NavigationItemInterface[] {
    const objects = this.document.types
      .filter((type: any): boolean => {
        return type.kind === OBJECT &&
          (!this.queryType || this.queryType.name !== type.name) &&
          (!this.mutationType || this.mutationType.name !== type.name) &&
          (!this.subscriptionType || this.subscriptionType.name !== type.name);
      });

    return objects
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
      new NavigationSection('Objects', types)
    ];
  }
}
