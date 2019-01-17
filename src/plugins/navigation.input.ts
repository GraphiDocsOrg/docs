import { INPUT_OBJECT, Plugin, NavigationSection, NavigationItem } from '../lib/utility';
import { PluginInterface, NavigationItemInterface } from '../lib/interface';

export default class NavigationInputs extends Plugin implements PluginInterface {
  getTypes(buildForType?: string): NavigationItemInterface[] {
    return this.document.types
      .filter((type: any): boolean => type.kind === INPUT_OBJECT)
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
      new NavigationSection('Input Objects', types)
    ];
  }
}
