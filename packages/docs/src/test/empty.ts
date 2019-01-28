import * as express from 'express';
import * as expressGraphql from 'express-graphql';
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import * as packageJson from '../../package.json';

const app = express();

export const EmptySchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    description: 'Root query',
    fields: {
      version: {
        resolve: () => packageJson.version,
        type: new GraphQLNonNull(GraphQLString),
      }
    },
    name: 'Query',
  })
});

app.use('/graphql', expressGraphql({
  graphiql: true,
  schema: EmptySchema,
}));

app.listen(4000);
