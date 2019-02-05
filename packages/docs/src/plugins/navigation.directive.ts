import { NavigationItemInterface, PluginInterface } from '../lib/interface';
import { NavigationItem, NavigationSection, Plugin } from '../lib/utility';

export default class NavigationDirectives extends Plugin implements PluginInterface {
  public getTypes(buildForType?: string): NavigationItemInterface[] {
    return this.document.directives
      .map((directive: any) => new NavigationItem(
        directive.name,
        this.url(directive),
        directive.name === buildForType
      ));
  }

  public getNavigations(buildForType?: string): NavigationSection[] {
    const types: NavigationItemInterface[] = this.getTypes(buildForType);

    if (types.length === 0) {
      return [];
    }

    return [
      new NavigationSection('Directives', types)
    ];
  }
}
