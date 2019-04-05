import {
  InputValue,
  TypeRef
} from '../interface';

import { LIST, NON_NULL } from './introspection';

export class HTML {
  public index = 0;

  public code(code: string): string {
    return `<code class="highlight"><table class="code"><tbody>${code}</tbody></table></code>`;
  }

  public highlight(text: string): string {
    return `<strong>${text}</strong>`;
  }

  public sup(text: string): string {
    return ` <sup>${text}</sup>`;
  }

  public line(code?: string): string {
    const row = this.index + 1;

    this.index = row;

    return `<tr class="row"><td id="L${row}" class="td-index">${row}</td><td id="LC${row}" class="td-code">${code || ''}</td></tr>`;
  }

  public tab(code: string): string {
    return `<span class="tab">${code}</span>`;
  }

  public keyword(keyword: string): string {
    return `<span class="keyword operator ts">${keyword}</span>`;
  }

  public comment(comment: string): string {
    return `<span class="comment line"># ${comment}</span>`;
  }

  public identifier(type: TypeRef): string {
    return `<span class="identifier">${type.name}</span>`;
  }

  public parameter(arg: InputValue): string {
    return `<span class="variable parameter">${arg.name}</span>`;
  }

  public property(name: string): string {
    return `<span class="meta">${name}</span>`;
  }

  public useIdentifier(type: TypeRef, toUrl: string): string {
    switch (type.kind) {
      case LIST:
        return `[${this.useIdentifier(type.ofType as TypeRef, toUrl)}]`;
      case NON_NULL:
        return `${this.useIdentifier(type.ofType as TypeRef, toUrl)}!`;
      default:
        return `<a class="support type" href="${toUrl}">${type.name}</a>`;
    }
  }

  public useIdentifierLength(type: TypeRef, base: number = 0): number {
    switch (type.kind) {
      case LIST:
        return this.useIdentifierLength(type.ofType as TypeRef, base + 2);
      case NON_NULL:
        return this.useIdentifierLength(type.ofType as TypeRef, base + 1);
      default:
        return base + type.name.length;
    }
  }

  public value(val: string): string {
    return val[0] === '"' ?
      `<span class="string">${val}</span>` :
      `<span class="constant numeric">${val}</span>`;
  }
}

export function split(text: string, len: number): string[] {
  return text
    .split(/\s+/)
    .reduce((result: string[], word: string) => {
        const last = result.length - 1;
        const lineLen = result[last].length;

        if (lineLen === 0) {
          result[last] = word;
        } else if (lineLen < len) {
          result[last] = `${result[last]} ${word}`;
        } else {
            result.push(word);
        }

        return result;
    }, ['']);
}
