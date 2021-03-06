# Static page generator for documenting GraphQL Schema

[![Build Status](https://travis-ci.org/GraphiDocsOrg/docs.svg?branch=master)](https://travis-ci.org/GraphiDocsOrg/docs)
[![Coverage Status](https://coveralls.io/repos/github/GraphiDocsOrg/docs/badge.svg?branch=master)](https://coveralls.io/github/GraphiDocsOrg/docs?branch=master)
![GitHub tag](https://img.shields.io/github/tag/GraphiDocsOrg/docs.svg?style=flat-square)

* [release](#release)
* [publish](#publish)
* [contributors](#contributors)

## Release

To release to the [npm registry](https://www.npmjs.com/), a travis job to deploy is setup to occur
on a tag being pushed to the [GitHub repo](https://github.com/GraphiDocsOrg/docs). We can use
the `lerna version` command that will increment the version in `package.json` in each package and
add a git tag. To handle this, there is a `release` script (that uses the `release.sh` script).
By default, this will increment the patch version:

```bash
yarn release
```

If you want to define which version to increment, you can pass in an argument:

```bash
yarn release major
```

If you wanted to take over exactly which version, you can use specify a semver:

```bash
yarn release 1.1.1
```

This should automatically push the new tag to GitHub and a Travis build will get triggered.
This will also use the `NPM_API_KEY` environment variable.

## Publish

To publish all the modules to the [npm registry](https://www.npmjs.com/), a travis job can be used
to react to a git tag being pushed to the [GitHub repo](https://github.com/GraphiDocsOrg/docs) from
the [release](#release) section. This will execute the `yarn do:publish` command which will in turn
execute the `lerna publish --contents dist from-git`. The `from-git` part tells lerna to use the
git tag that was push. The `--contents dist` is used since we have to compile from TypeScript. This
also requires that each package has a `dist` directory to be published with.

Also note, it may be a good idea to copy a README over to the `dist` directory so npm will show this.

The reason of `yarn do:publish` and not just `yarn publish` is due to this
[yarn issue](https://github.com/yarnpkg/yarn/issues/5334).

## Contributors

- [<img src="https://avatars1.githubusercontent.com/u/208789?v=4" width="40"> 2fd](https://github.com/2fd)
- [<img src="https://avatars1.githubusercontent.com/u/325473?v=4" width="40"> mitchellsimoens](https://github.com/mitchellsimoens)
- [<img src="https://avatars2.githubusercontent.com/u/1301838?v=4" width="40"> bitliner](https://github.com/bitliner)
- [<img src="https://avatars0.githubusercontent.com/u/605742?v=4" width="40"> kbariotis](https://github.com/kbariotis)
- [<img src="https://avatars1.githubusercontent.com/u/1359202?v=4" width="40"> gavinhenderson](https://github.com/gavinhenderson)
- [<img src="https://avatars1.githubusercontent.com/u/1648214?v=4" width="40"> Joatin](https://github.com/Joatin)
- [<img src="https://avatars0.githubusercontent.com/u/226612?v=4" width="40"> shiroyuki](https://github.com/shiroyuki)
- [<img src="https://avatars1.githubusercontent.com/u/2903325?v=4" width="40"> dnalborczyk](https://github.com/dnalborczyk)
