#!/usr/bin/env bash

VERSION_LIST=(major minor patch premajor preminor prepatch prerelease)
# must be semver n.n.n
VERSION_RE=^[0-9]+\.[0-9]+\.[0-9]+$

# Checks if element "$1" is in array "$2"
# @NOTE:
#   Be sure that array is passed in the form:
#       "${ARR[@]}"
elementIn () {
    local e
    for e in "${@:2}"; do [[ "$e" == "$1" ]] && return 0; done
    return 1
}

# Checks if element $1 matches the regex $2
checkRe () {
  [[ $1 =~ $2 ]] && return 0 || return 1;
}

VERSION=$1

if [[ ! "$VERSION" ]]; then
  VERSION=patch
fi

if elementIn "$VERSION" "${VERSION_LIST[@]}" || checkRe "$VERSION" $VERSION_RE; then
  npm version $VERSION -m "Bumping to %s"

  git push origin master

  git push --tags
else
    echo "'$VERSION' is not a valid value"
fi
