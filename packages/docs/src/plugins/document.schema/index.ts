import { resolve } from 'path';
import * as wrap from 'word-wrap';
import {
  Directive,
  DocumentSectionInterface,
  EnumValue,
  Field,
  InputValue,
  PluginInterface,
  Schema,
  SchemaType
} from '../../lib/interface';
import {
  DocumentSection,
  ENUM,
  HTML,
  INPUT_OBJECT,
  INTERFACE,
  OBJECT,
  Plugin,
  SCALAR,
  UNION
} from '../../lib/utility';
import { NON_NULL } from '../../lib/utility/introspection';

const MAX_CODE_LEN = 80;

export default class SchemaPlugin extends Plugin implements PluginInterface {
  private html!: HTML;

  public getHeaders(): string[] {
    return [
      '<link href="https://fonts.googleapis.com/css?family=Ubuntu+Mono:400,700" rel="stylesheet">',
      '<link type="text/css" rel="stylesheet" href="./assets/code.css" />',
      '<script src="./assets/line-link.js"></script>'
    ];
  }

  public getAssets() {
    return [
      resolve(__dirname, 'assets/code.css'),
      resolve(__dirname, 'assets/line-link.js')
    ];
  }

  public getDocuments(buildForType ?: string): DocumentSectionInterface[] {
    this.html = new HTML();

    const code = this.code(buildForType);

    if (code) {
      return [
        new DocumentSection('GraphQL Schema definition', this.html.code(code))
      ];
    }

    return [];
  }

  public code(buildForType ?: string): string {
    if (!buildForType) {
      return this.schema(this.document);
    }

    const directive = this.document
      .directives
      .find((directiveItem: any): boolean => directiveItem.name === (buildForType as string));

    if (directive) {
      return this.directive(directive);
    }

    const type = this.document
      .types
      .find((typeItem: any): boolean => typeItem.name === (buildForType as string));

    if (type) {
      switch (type.kind) {
        case SCALAR:
          return this.scalar(type);
        case OBJECT:
          return this.object(type);
        case INTERFACE:
          return this.interfaces(type);
        case UNION:
          return this.union(type);
        case ENUM:
          return this.enum(type);
        case INPUT_OBJECT:
          return this.inputObject(type);
      }
    }

    throw new TypeError(`Unexpected type: ${buildForType}`);
  }

  public argument(arg: InputValue): string {
    return `${this.html.property(arg.name)}: ${this.html.useIdentifier(arg.type, this.url(arg.type))}`
    ;
  }

  public argumentLength(arg: InputValue): number {
    return arg.name.length + 1 + this.html.useIdentifierLength(arg.type);
  }

  public arguments(fieldOrDirectives: Field | Directive): string {
    if (fieldOrDirectives.args.length === 0) {
      return '';
    }

    return `(${fieldOrDirectives.args.map((arg: any) => this.argument(arg)).join(', ')})`;
  }

  public argumentsLength(fieldOrDirectives: Field | Directive): number {
    if (fieldOrDirectives.args.length === 0) {
      return 0;
    }

    return fieldOrDirectives.args.reduce((sum: number, arg: any) => sum + this.argumentLength(arg), 2);
  }

  public argumentsMultiline(fieldOrDirectives: Field | Directive): string[] {
    if (fieldOrDirectives.args.length === 0) {
      return [];
    }

    const maxIndex = fieldOrDirectives.args.length - 1;

    return fieldOrDirectives.args
      .map((arg: any, index: number) =>
        index < maxIndex
          ? `${this.argument(arg)},`
          : this.argument(arg)
      );
  }

  public argumentDescription(arg: InputValue): string[] {
    const desc = arg.description ? `: ${arg.description}` : '';
    const name = arg.type.kind === NON_NULL ? this.html.highlight(arg.name) : arg.name;

    return this.description(`${name}${desc}`);
  }

  public argumentsDescription(fieldOrDirectives: Field | Directive): string[] {
    if (fieldOrDirectives.args.length === 0 || !fieldOrDirectives.args.find((arg: InputValue): boolean => Boolean(arg.description))) {
      return [];
    }

    const reduceArguments = (descriptions: string[], arg: InputValue) => descriptions.concat(this.argumentDescription(arg));

    return fieldOrDirectives.args.reduce(reduceArguments, [this.html.comment('Arguments')]);
  }

  public deprecated(fieldOrEnumVal: Field | EnumValue): string {
    if (!fieldOrEnumVal.isDeprecated) {
      return '';
    }

    if (!fieldOrEnumVal.deprecationReason) {
      return this.html.keyword('@deprecated');
    }

    return `${this.html.keyword('@deprecated')}( reason: ${this.html.value(`"${fieldOrEnumVal.deprecationReason}" `)} )`;
  }

  public deprecatedLength(fieldOrEnumVal: Field | EnumValue): number {
    if (!fieldOrEnumVal.isDeprecated) {
      return 0;
    }

    if (!fieldOrEnumVal.deprecationReason) {
      return '@deprecated'.length;
    }

    return '@deprecated( reason: "'.length + fieldOrEnumVal.deprecationReason.length + '" )'.length;
  }

  public description(description: string): string[] {
    if (description) {
      return wrap(description, {
          width: MAX_CODE_LEN
        })
        .split('\n')
        .map(l => this.html.comment(l));
    }

    return [];
  }

  public directive(directive: Directive): string {
    return this.html.line(
      `${this.html.keyword('directive')} ${this.html.keyword(`@${directive.name}`)} + ${this.arguments(directive)} on ${directive.locations.map((location: any) => this.html.keyword(location)).join(' | ')}`
    );
  }

  public enum(type: SchemaType): string {
    const reduceEnumValues = (lines: string[], enumValue: EnumValue) => lines
      .concat(
        [''],
        this.description(enumValue.description), [this.html.property(enumValue.name) + this.deprecated(enumValue)],
      );

    return this.html.line(`${this.html.keyword('enum')} ${this.html.identifier(type)} {`) +
      type.enumValues
      .reduce(reduceEnumValues, [])
      .map((line: any) => this.html.line(this.html.tab(line)))
      .join('') +
      this.html.line('}');
  }

  public field(field: Field): string {
    const fieldDescription = this.description(field.description);
    const argumentsDescription = this.argumentsDescription(field);

    if (fieldDescription.length > 0 && argumentsDescription.length) {
      fieldDescription.push(this.html.comment(''));
    }

    const fieldDefinition = field.args.length > 0 && this.fieldLength(field) > MAX_CODE_LEN
      // Multiline definition:
      // fieldName(
      //     argumentName: ArgumentType, \n ...
      // ): ReturnType [@deprecated...]
      ? [
        `${this.html.property(field.name)}(`,
        ...this.argumentsMultiline(field).map(l => this.html.tab(l)),
        `): ${this.html.useIdentifier(field.type, this.url(field.type))} ${this.deprecated(field)}`
      ]

      // Single line
      // fieldName(argumentName: ArgumentType): ReturnType [@deprecated...]
      : [
        `${this.html.property(field.name)}${this.arguments(field)}: ${this.html.useIdentifier(field.type, this.url(field.type))} ${this.deprecated(field)}`
      ];

    return ([] as string[])
      .concat(fieldDescription)
      .concat(argumentsDescription)
      .concat(fieldDefinition)
      .map(line => this.html.line(this.html.tab(line)))
      .join('');
  }

  public fieldLength(field: Field): number {
    return field.name.length + this.argumentsLength(field) +
      ': '.length + this.html.useIdentifierLength(field) + ' '.length +
      this.deprecatedLength(field);
  }

  public fields(type: SchemaType): string {
    let fields = '';

    fields += this.html.line();

    for (const field of type.fields) {
      fields += this.field(field);
      fields += this.html.line();
    }

    return fields;
  }

  public inputObject(type: SchemaType): string {
    return this.html.line(`${this.html.keyword('input')} ${this.html.identifier(type)} {`) +
      this.inputValues(type.inputFields) +
      this.html.line('}');
  }

  public inputValues(inputValues: InputValue[]): string {
    return inputValues
      .map(inputValue => this.html.line(this.html.tab(this.inputValue(inputValue))))
      .join('');
  }

  public inputValue(arg: InputValue): string {
    const argDescription = this.description(arg.description);

    return ([] as string[])
      .concat(argDescription)
      .concat([
        `${this.html.property(arg.name)}: ${this.html.useIdentifier(arg.type, this.url(arg.type))}`
      ])
      .map(line => this.html.line(this.html.tab(line)))
      .join('');
  }

  public interfaces(type: SchemaType): string {
    return this.html.line(`${this.html.keyword('interface')} ${this.html.identifier(type)} {`) +
      this.fields(type) +
      this.html.line('}');
  }

  public object(type: SchemaType): string {
    const interfaces = type.interfaces
      .map(i => this.html.useIdentifier(i, this.url(i)))
      .join(', ');

    const implement = interfaces.length === 0
      ? ''
      : ` ${this.html.keyword('implements')} ${interfaces}`;

    return this.html.line(`${this.html.keyword('type')} ${this.html.identifier(type)}${implement} {`) +
      this.fields(type) +
      this.html.line('}');
  }

  public scalar(type: SchemaType): string {
    return this.html.line(`${this.html.keyword('scalar')} ${this.html.identifier(type)}`);
  }

  public schema(schema: Schema): string {
    let definition = this.html.line(`${this.html.keyword('schema')} {`);

    if (schema.queryType) {
      definition += this.html.line() +
      this.description(schema.queryType.description)
      .map(line => this.html.line(this.html.tab(line)))
      .join('') +

      this.html.line(this.html.tab(
        `${this.html.property('query')}: ${this.html.useIdentifier(schema.queryType, this.url(schema.queryType))}`
      ));
    }

    if (schema.mutationType) {
      definition += this.html.line() +

      this.description(schema.mutationType.description)
      .map(line => this.html.line(this.html.tab(line)))
      .join('') +

      this.html.line(this.html.tab(
        `${this.html.property('mutation')}: ${this.html.useIdentifier(schema.mutationType, this.url(schema.mutationType))}`
      ));
    }

    if (schema.subscriptionType) {
      definition += this.html.line() +
      this.description(schema.subscriptionType.description)
      .map(line => this.html.line(this.html.tab(line)))
      .join('') +

      this.html.line(this.html.tab(
        `${this.html.property('subscription')}: ${this.html.useIdentifier(schema.subscriptionType, this.url(schema.subscriptionType))}`
      ));
    }

    definition += this.html.line('}');

    return definition;
        /* .concat(
          schema.directives
              .map((directive) => {
                  return this.html.line(this.html.comment('DIRECTIVE')) +
                      this.description(directive.description)
                      .map(line => this.html.line(line))
                      .join('') +
                      this.code(directive.name);
              }),
          schema.types
              .sort((a: SchemaType, b: SchemaType) => {
                  return order[a.kind].localeCompare(order[b.kind]);
              })
              .map((type) => {
                  return this.html.line(this.html.comment(type.kind)) +
                      this.description(type.description)
                      .map(line => this.html.line(line))
                      .join('') +
                      this.code(type.name);
              }))*/

    /* return [this.schemaDefinition(schema)]
          .concat(
          directives.map(directive => this.directive(directive)),
          types.map((type) => this.type(type) as string)
          )
          .join('\n\n') + '\n';*/
  }

  public union(type: SchemaType): string {
    return this.html.line(
      `${this.html.keyword('union')} ${this.html.identifier(type)} = ${type.possibleTypes.map((possibleType: any) => this.html.useIdentifier(possibleType, this.url(possibleType))).join(' | ')}`
    );
  }
}
