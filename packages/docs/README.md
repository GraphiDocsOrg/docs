# Static page generator for documenting GraphQL Schema

[![Build Status](https://travis-ci.org/GraphiDocsOrg/docs.svg?branch=master)](https://travis-ci.org/GraphiDocsOrg/docs)
[![Coverage Status](https://coveralls.io/repos/github/GraphiDocsOrg/docs/badge.svg?branch=master)](https://coveralls.io/github/GraphiDocsOrg/docs?branch=master)
![npm (scoped)](https://img.shields.io/npm/v/@graphidocs/docs.svg?style=flat-square)
![GitHub tag](https://img.shields.io/github/tag/GraphiDocsOrg/docs.svg?style=flat-square)

* [install](#install)
* [use](#use)
* [plugin](#plugin)
* [template](#template)
* [contributors](#contributors)

## Install

```bash
    npm install -g @graphidocs/docs
```

## Use

### Generate documentation from live endpoint

```bash
    > graphidocs -e http://localhost:8080/graphql -o ./doc/schema
```

### Generate documentation from IDL file

```bash
    > graphidocs -s ./schema.graphql -o ./doc/schema
```

### Generate documentation from for the ["modularized schema"](http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#modularizing) of graphql-tools

```bash
    > graphidocs -s ./schema.js -o ./doc/schema
```

> [`./schema.graphql`](https://github.com/GraphiDocsOrg/docs/blob/master/test/starwars.graphql) must be able to be interpreted with [graphql-js/utilities#buildSchema](http://graphql.org/graphql-js/utilities/#buildschema)


### Generate documentation from json file

```bash
    > graphidocs -s ./schema.json -o ./doc/schema
```

> `./schema.json` contains the result of [GraphQL introspection query](https://github.com/GraphiDocsOrg/docs/blob/gh-pages/introspection.graphql)

### Puts the options in your `package.json`

```javascript
     // package.json

    {
        "name": "project",
        // [...]
        "graphidocs": {
            "endpoint": "http://localhost:8080/graphql",
            "output": "./doc/schema",
        }
    }
```

And execute

```bash
    > graphidocs
```

### Help

```bash

    > graphidocs -h
    
    Static page generator for documenting GraphQL Schema v1.0.2

    Usage: node bin/graphidocs.ts [OPTIONS] 

    
    [OPTIONS]:
    -c, --config                   Configuration file [./package.json].
    -e, --endpoint                 Graphql http endpoint ["https://domain.com/graphql"].
    -x, --header                   HTTP header for request (use with --endpoint). ["Authorization: Token cb8795e7"].
    -q, --query                    HTTP querystring for request (use with --endpoint) ["token=cb8795e7"].
    -s, --schema, --schema-file    Graphql Schema file ["./schema.json"].
    -p, --plugin                   Use plugins [default=graphidocs/plugins/default].
    -t, --template                 Use template [default=classic].
    -o, --output                   Output directory.
    -d, --data                     Inject custom data.
    -b, --base-url                 Base url for templates.
    -f, --force                    Delete outputDirectory if exists.
    -v, --verbose                  Output more information.
    -V, --version                  Show graphidocs version.
    -h, --help                     Print this help


```

## Plugin

In graphidocs a plugin is simply an object that controls the content that is displayed
on every page of your document.

This object should only implement the [`PluginInterface`](https://github.com/GraphiDocsOrg/docs/blob/master/lib/interface.d.ts#L12-L117).

### Make a Plugin

To create your own plugin you should only create it as a `plain object`
or a `constructor` and export it as `default`

If you export your plugin as a constructor, when going to be initialized,
will receive three parameters

* `schema`: The full the result of [GraphQL instrospection query](https://github.com/GraphiDocsOrg/docs/blob/gh-pages/introspection.graphql)
* `projectPackage`: The content of `package.json` of current project (or the content of file defined with `--config` flag).
* `graphidocsPackag`: The content of `package.json` of graphidocs.

> For performance reasons all plugins receive the reference to the same object
> and therefore should not modify them directly as it could affect the behavior
> of other plugins (unless of course that is your intention)

#### Examples

```typescript

    // es2015 export constructor
    export default class MyPlugin {
        constructor(schema, projectPackage, graphidocsPackage){}
        getAssets() { /* ... */ }
        /* ... */
    }

```

```typescript
    // es2015 export plain object
    export default cost myPlugin = {
        getAssets() { /* ... */ },
        /* ... */
    }
```

```javascript

    // export constructor
    function MyPlugin(schema, projectPackage, graphidocsPackage) { /* ... */ }

    MyPlugin.prototype.getAssets =  function() { /* ... */ };
    /* ... */

    exports.default = MyPlugin;
```

```javascript

    // export plain object

    exports.default = {
        getAssets: function() { /* ... */ },
        /* ... */
    }

```

### Use plugin

You can use the plugins in 2 ways.


#### Use plugins with command line

```bash
    > graphidocs -p graphidocs/plugins/default \
                -p some-dependencie/plugin \
                -p ./lib/plugin/my-own-plugin \
                -s ./schema.json -o ./doc/schema
```

#### Use plugins with `package.json`

```javascript
     // package.json

    {
        "name": "project",
        // [...]
        "graphidocs": {
            "endpoint": "http://localhost:8080/graphql",
            "output": "./doc/schema",
            "plugins": [
                "graphidocs/plugins/default",
                "some-dependencie/plugin",
                "./lib/plugin/my-own-plugin"
            ]
        }
    }
```

### Built-in plugin

> TODO

## Template

You can specify which template to use via the CLI:

```bash
    > graphidocs -t classic \
                -s ./schema.json -o ./doc/schema
```

Or via 'package.json':

```javascript
     // package.json

    {
        "name": "project",
        // [...]
        "graphidocs": {
            "endpoint": "http://localhost:8080/graphql",
            "output": "./doc/schema",
            "template": "classic"
        }
    }
```

The current built-in templates are:

- `classic`

### Relative Path

The template can also take a relative path (from where command is executed):

```bash
    > graphidocs -t ./my-template \
                -s ./schema.json -o ./doc/schema
```

```javascript
     // package.json

    {
        "name": "project",
        // [...]
        "graphidocs": {
            "endpoint": "http://localhost:8080/graphql",
            "output": "./doc/schema",
            "template": "./my-template"
        }
    }
```

### Node Module

To specify a node module as a template, specify the name as the template:

```bash
    > graphidocs -t my-graphidocs-template \
                -s ./schema.json -o ./doc/schema
```

```javascript
     // package.json

    {
        "name": "project",
        // [...]
        "graphidocs": {
            "endpoint": "http://localhost:8080/graphql",
            "output": "./doc/schema",
            "template": "my-graphidocs-template"
        }
    }
```

### Create a Template

All rendering is done within the template. It's up to the template to pick what and how to render.
In order to render, you should extend the [`Template`](src/lib/Template) class. There are a few methods
you must use:

- `getTemplateFiles` A way to get all the template files. Should return a promise of strings to the files.
- `serialize` The method that will turn the data into text that will get written out.
- `renderDirective` The method that will render the GraphQL directives.
- `renderIndex` The method that will render the index file like `index.html`.
- `renderType` The method that will render the GraphQL types.

An example of this is (from the classic toolkit):

```javascript
import * as glob from 'glob';
import { render } from 'mustache';
import { TypeRef } from '../../lib/interface';
import Template, { ITemplateFileMap } from '../../lib/Template';
import { getFilenameOf } from '../../lib/utility';
import { ITemplateData } from '../../lib/utility/template';

export default class ClassicTemplate extends Template {
  public async getTemplateFiles(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => glob(
      '**/*.mustache',
      { cwd: __dirname },
      (error, files) => error ? reject(error) : resolve(files)
    ));
  }

  public serialize(templateData: ITemplateData, templateFiles: ITemplateFileMap): string {
    return render(templateFiles.index, templateData, templateFiles);
  }

  public renderDirective(type: TypeRef): Promise<void> {
    return this.renderFile(getFilenameOf(type), type);
  }

  public renderIndex(): Promise<void> {
    return this.renderFile('index.html');
  }

  public renderType(type: TypeRef): Promise<void> {
    return this.renderFile(getFilenameOf(type), type);
  }
}

```
## Contributors

- [<img src="https://avatars1.githubusercontent.com/u/208789?v=4" width="40"> 2fd](https://github.com/2fd)
- [<img src="https://avatars1.githubusercontent.com/u/325473?v=4" width="40"> mitchellsimoens](https://github.com/mitchellsimoens)
- [<img src="https://avatars2.githubusercontent.com/u/1301838?v=4" width="40"> bitliner](https://github.com/bitliner)
- [<img src="https://avatars0.githubusercontent.com/u/605742?v=4" width="40"> kbariotis](https://github.com/kbariotis)
- [<img src="https://avatars1.githubusercontent.com/u/1359202?v=4" width="40"> gavinhenderson](https://github.com/gavinhenderson)
- [<img src="https://avatars1.githubusercontent.com/u/1648214?v=4" width="40"> Joatin](https://github.com/Joatin)
- [<img src="https://avatars0.githubusercontent.com/u/226612?v=4" width="40"> shiroyuki](https://github.com/shiroyuki)
- [<img src="https://avatars1.githubusercontent.com/u/2903325?v=4" width="40"> dnalborczyk](https://github.com/dnalborczyk)
