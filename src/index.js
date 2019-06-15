import Koa from 'koa';
import KoaRouter from 'koa-router';
import koaLogger from 'koa-logger';
import koaBody from 'koa-bodyparser';
import koaCors from '@koa/cors';

import { graphiqlKoa, graphqlKoa } from 'apollo-server-koa';
import graphQLSchema from './graphQLSchema';

import { formatErr } from './utilities';

/*const bodyparser = require("koa-bodyparser-graphql");
import * as bodyParser from 'body-parser-graphql'
var parse = require('co-body');
var multer  = require('multer');*/
import apolloServerKoa from 'apollo-server-koa'



const app = new Koa()
const server = new apolloServerKoa.ApolloServer({
  schema: graphQLSchema,
  uploads: {
    // Limits here should be stricter than config for surrounding
    // infrastructure such as Nginx so errors can be handled elegantly by
    // graphql-upload:
    // https://github.com/jaydenseric/graphql-upload#type-uploadoptions
    maxFileSize: 10000000, // 10 MB
    maxFiles: 20
	},
	formatError: formatErr
})

server.applyMiddleware({ app })

app.listen(5000, error => {
  if (error) throw error

  // eslint-disable-next-line no-console
  console.info(
    `Serving http://localhost:${5000} for ${process.env.NODE_ENV}.`
  )
})

