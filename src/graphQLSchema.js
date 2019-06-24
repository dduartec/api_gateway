import merge from 'lodash.merge';
import GraphQLJSON from 'graphql-type-json';
import { makeExecutableSchema } from 'apollo-server-koa';

import { mergeSchemas } from './utilities';

import {
	organizationMutations,
	organizationQueries,
	organizationTypeDef,
	uploadTypeDef,
	uploadMutations,
	uploadQueries,
	downloadTypeDef,
	downloadQueries,
	usersTypeDef,
	userMutations,
	downloadMutations,
	soapTypeDef,
	soapMutations,
} from './files/typeDefs';

import resolvers from './files/resolvers';

// merge the typeDefs
const mergedTypeDefs = mergeSchemas(
	[
		'scalar JSON',
		organizationTypeDef,
		downloadTypeDef,
		uploadTypeDef,
		usersTypeDef,
		soapTypeDef
	],
	[
		organizationQueries,
		downloadQueries,
	],
	[
		organizationMutations,
		uploadMutations,
		userMutations,
		downloadMutations,
		soapMutations
	]
);

// Generate the schema object from your types definition.
export default makeExecutableSchema({
	typeDefs: mergedTypeDefs,
	resolvers: merge(
		{ JSON: GraphQLJSON }, // allows scalar JSON
		resolvers
	)
});
