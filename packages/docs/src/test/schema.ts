/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

/**
 * This is designed to be an end-to-end test, demonstrating
 * the full GraphQL stack.
 *
 * We will create a GraphQL schema that describes the major
 * characters in the original Star Wars trilogy.
 *
 * NOTE: This may contain spoilers for the original Star
 * Wars trilogy.
 */

/**
 * Using our shorthand to describe type systems, the type system for our
 * Star Wars example is:
 *
 * enum Episode { NEWHOPE, EMPIRE, JEDI }
 *
 * interface Character {
 *   id: ID
 *   name: String
 *   friends: [Character]
 *   appearsIn: [Episode]
 * }
 *
 * type Human : Character {
 *   id: ID
 *   name: String
 *   friends: [Character]
 *   appearsIn: [Episode]
 *   homePlanet: String
 * }
 *
 * type Droid : Character {
 *   id: ID
 *   name: String
 *   friends: [Character]
 *   appearsIn: [Episode]
 *   primaryFunction: String
 * }
 *
 * type Query {
 *   hero(episode: Episode): Character
 *   human(id: ID): Human
 *   droid(id: ID): Droid
 * }
 *
 * We begin by setting up our schema.
 */

/**
 * The original trilogy consists of three movies.
 *
 * This implements the following type system shorthand:
 *   enum Episode { NEWHOPE, EMPIRE, JEDI }
 */
const episodeEnum = new GraphQLEnumType({
  description: 'One of the films in the Star Wars Trilogy',
  name: 'Episode',
  values: {
    EMPIRE: {
      description: 'Released in 1980.',
      value: 5,
    },
    JEDI: {
      description: 'Released in 1983.',
      value: 6,
    },
    NEWHOPE: {
      description: 'Released in 1977.',
      value: 4,
    },
  }
});

/**
 * Characters in the Star Wars trilogy are either humans or droids.
 *
 * This implements the following type system shorthand:
 *   interface Character {
 *     id: ID
 *     name: String
 *     friends: [Character]
 *     appearsIn: [Episode]
 *     secretBackstory: String
 *   }
 */
const characterInterface: GraphQLInterfaceType = new GraphQLInterfaceType({
  description: 'A character in the Star Wars Trilogy',
  fields: () => ({
    appearsIn: {
      description: 'Which movies they appear in.',
      type: new GraphQLList(episodeEnum),
    },
    friends: {
      description: 'The friends of the character, or an empty list if they have none.',
      type: new GraphQLList(characterInterface),
    },
    id: {
      description: 'The id of the character.',
      type: new GraphQLNonNull(GraphQLID),
    },
    name: {
      description: 'The name of the character.',
      type: GraphQLString,
    },
    secretBackstory: {
      description: 'All secrets about their past.',
      type: GraphQLString,
    },
  }),
  name: 'Character',
  resolveType: _ => humanType,
});

/**
 * We define our human type, which implements the character interface.
 *
 * This implements the following type system shorthand:
 *   type Human : Character {
 *     id: ID
 *     name: String
 *     friends: [Character]
 *     appearsIn: [Episode]
 *     secretBackstory: String
 *   }
 */
const humanType = new GraphQLObjectType({
  description: 'A humanoid creature in the Star Wars universe.',
  fields: () => ({
    appearsIn: {
      description: 'Which movies they appear in.',
      type: new GraphQLList(episodeEnum),
    },
    friends: {
      description: 'The friends of the human, or an empty list if they have none.',
      resolve: human => human,
      type: new GraphQLList(characterInterface),
    },
    homePlanet: {
      description: 'The home planet of the human, or null if unknown.',
      type: GraphQLString,
    },
    id: {
      description: 'The id of the human.',
      type: new GraphQLNonNull(GraphQLID),
    },
    name: {
      description: 'The name of the human.',
      type: GraphQLString,
    },
    secretBackstory: {
      description: 'Where are they from and how they came to be who they are.',
      resolve: () => {
        throw new Error('secretBackstory is secret.');
      },
      type: GraphQLString,
    },
  }),
  interfaces: [characterInterface],
  name: 'Human',
});

/**
 * The other type of character in Star Wars is a droid.
 *
 * This implements the following type system shorthand:
 *   type Droid : Character {
 *     id: ID
 *     name: String
 *     friends: [Character]
 *     appearsIn: [Episode]
 *     secretBackstory: String
 *     primaryFunction: String
 *   }
 */
const droidType = new GraphQLObjectType({
  description: 'A mechanical creature in the Star Wars universe.',
  fields: () => ({
    appearsIn: {
      description: 'Which movies they appear in.',
      type: new GraphQLList(episodeEnum),
    },
    friends: {
      description: 'The friends of the droid, or an empty list if they have none.',
      resolve: droid => droid,
      type: new GraphQLList(characterInterface),
    },
    id: {
      description: 'The id of the droid.',
      type: new GraphQLNonNull(GraphQLID),
    },
    name: {
      description: 'The name of the droid.',
      type: GraphQLString,
    },
    primaryFunction: {
      description: 'The primary function of the droid.',
      type: GraphQLString,
    },
    secretBackstory: {
      description: 'Construction date and the name of the designer.',
      resolve: () => {
        throw new Error('secretBackstory is secret.');
      },
      type: GraphQLString,
    },
  }),
  interfaces: [characterInterface],
  name: 'Droid',
});

/**
 * This is the type that will be the root of our query, and the
 * entry point into our schema. It gives us the ability to fetch
 * objects by their IDs, as well as to fetch the undisputed hero
 * of the Star Wars trilogy, R2-D2, directly.
 *
 * This implements the following type system shorthand:
 *   type Query {
 *     hero(episode: Episode): Character
 *     human(id: ID): Human
 *     droid(id: ID): Droid
 *   }
 *
 */
const queryType = new GraphQLObjectType({
  description: 'Root query',
  fields: () => ({
    droid: {
      args: {
        id: {
          description: 'id of the droid',
          type: new GraphQLNonNull(GraphQLID),
        }
      },
      description: 'Return the Droid by ID.',
      resolve: () => null,
      type: droidType,
    },
    hero: {
      args: {
        episode: {
          description: 'If omitted, returns the hero of the whole saga. If ' +
          'provided, returns the hero of that particular episode.',
          type: episodeEnum
        }
      },
      description: 'Return the hero by episode.',
      resolve: () => null,
      type: characterInterface,
    },
    human: {
      args: {
        id: {
          description: 'id of the human',
          type: new GraphQLNonNull(GraphQLID),
        }
      },
      description: 'Return the Human by ID.',
      resolve: () => null,
      type: humanType,
    },
  }),
  name: 'Query',
});


/**
 *   type Mutation {
 *     favorite(episode: Episode!): Episode
 *   }
 */
const mutationType = new GraphQLObjectType({
  description: 'Root Mutation',
  fields: () => ({
    favorite: {
      args: {
        episode: {
          description: 'Favorite episode.',
          type: new GraphQLNonNull(episodeEnum),
        }
      },
      description: 'Save the favorite episode.',
      resolve: (_, { episode }) => episode,
      type: episodeEnum,
    },
  }),
  name: 'Mutation',
});

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const StarWarsSchema = new GraphQLSchema({
  mutation: mutationType,
  query: queryType,
});
