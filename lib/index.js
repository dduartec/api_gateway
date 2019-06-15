'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Koa = _interopDefault(require('koa'));
var koaRouter = _interopDefault(require('koa-router'));
var koaLogger = _interopDefault(require('koa-logger'));
var koaBodyparser = _interopDefault(require('koa-bodyparser'));
var cors = _interopDefault(require('@koa/cors'));
var apolloServerKoa = require('apollo-server-koa');
var apolloServerKoa__default = _interopDefault(apolloServerKoa);
var merge = _interopDefault(require('lodash.merge'));
var GraphQLJSON = _interopDefault(require('graphql-type-json'));
var request = _interopDefault(require('request-promise-native'));
var graphql = require('graphql');
var fs = _interopDefault(require('fs'));
var lowdb = _interopDefault(require('lowdb'));
var FileSync = _interopDefault(require('lowdb/adapters/FileSync'));
var mkdirp = _interopDefault(require('mkdirp'));
var shortid = _interopDefault(require('shortid'));
var promisesAll = _interopDefault(require('promises-all'));
require('form-data');
var request$1 = _interopDefault(require('request'));

/**
 * Creates a request following the given parameters
 * @param {string} url
 * @param {string} method
 * @param {object} [body]
 * @param {boolean} [fullResponse]
 * @return {Promise.<*>} - promise with the error or the response object
 */
async function generalRequest(url, method, body, fullResponse) {
	const parameters = {
		method,
		uri: encodeURI(url),
		body,
		json: true,
		resolveWithFullResponse: fullResponse
	};
	if (process.env.SHOW_URLS) {
		// eslint-disable-next-line
		console.log(url);
	}
	
	try {
		return await request(parameters);
	} catch (err) {
		return err;
	}
}

/**
 * Adds parameters to a given route
 * @param {string} url
 * @param {object} parameters
 * @return {string} - url with the added parameters
 */
function addParams(url, parameters) {
	let queryUrl = `${url}?`;
	for (let param in parameters) {
		// check object properties
		if (
			Object.prototype.hasOwnProperty.call(parameters, param) &&
			parameters[param]
		) {
			if (Array.isArray(parameters[param])) {
				queryUrl += `${param}=${parameters[param].join(`&${param}=`)}&`;
			} else {
				queryUrl += `${param}=${parameters[param]}&`;
			}
		}
	}
	return queryUrl;
}

/**
 * Generates a GET request with a list of query params
 * @param {string} url
 * @param {string} path
 * @param {object} parameters - key values to add to the url path
 * @return {Promise.<*>}
 */
function getRequest(url, path, parameters) {
	const queryUrl = addParams(`${url}/${path}`, parameters);
	return generalRequest(queryUrl, 'GET');
}

/**
 * Merge the schemas in order to avoid conflicts
 * @param {Array<string>} typeDefs
 * @param {Array<string>} queries
 * @param {Array<string>} mutations
 * @return {string}
 */
function mergeSchemas(typeDefs, queries, mutations) {
	return `${typeDefs.join('\n')}
    type Query { ${queries.join('\n')} }
    type Mutation { ${mutations.join('\n')} }`;
}

function formatErr(error) {
	const data = graphql.formatError(error);
	const { originalError } = error;
	if (originalError && originalError.error) {
		const { path } = data;
		const { error: { id: message, code, description } } = originalError;
		return { message, code, description, path };
	}
	return data;
}

//AUTH
const usersTypeDef = `
input UserInput {
    name:String!
    email:String!
    password:String!
}
type UserPostOut{
    advise: String
    id :Int
    token: String
    error: String
    email: String
    name:String
}
input UserPutIn{
    id: Int!
    new_name:String!
}
input UserDelIn{
    email: String!
}

type UserPutOut{
    advise:String!
}
input SessionInput{
    email:String!
    password:String!
}
type SessionOut{
    advise:String
    token:String
    email: String
    name:String
}
input TokenInput{
    email:String!
    token:String!    
}

`;
const userMutations = `
    createUser(user: UserInput!):UserPostOut!
    updateUser(user: UserPutIn!):UserPutOut!
    deleteUser(user: UserDelIn!):UserPutOut!
    userSession(user: SessionInput!):SessionOut!
`;

//ORGANIZATION
const organizationTypeDef = `
type Movement {
    move_id: Int
    owner: String
    origin: String
    destiny: String
    date: String
    advise: String
}
type MoveOut {
    list: [Movement]
    advise: String
}
input MovementInput {
    owner: String!
    origin: String!
    destiny: String!
}
type CreateFolder {
    create_id: Int
    owner: String
    path: String
    date: String
    advise:String
}
type CreateOut {
    list:[CreateFolder]
    advise: String
}
input CreateFolderInput {
    owner: String!
    path: String!
}
type Delete {
    del_id: Int
    owner: String
    path: String
    date: String
    advise:String
}
type DeleteOut {
    list:[Delete]
    advise: String
}
input DeleteInput {
    owner: String!
    path: String!
}`;
const organizationQueries = `
    allMovements(input:TokenInput!): MoveOut!
    allCreations(input:TokenInput!): CreateOut!
    allDeletes(input:TokenInput!): DeleteOut!
`;
const organizationMutations = `
    createFolder(create: CreateFolderInput! , input: TokenInput!): CreateFolder!
    moveFile(move: MovementInput!,input:TokenInput!): Movement!
    deleteFile(del: DeleteInput!,input:TokenInput!): Delete!
`;
//DOWNLOAD
const downloadTypeDef = `
type File {
    files: [File],
    name: String
    owner: String
    path: String

}
input Owner{
    owner:String!
}
input DowloadInput{
    path: String!
}
type DownloadOut {
    base64: String
    name: String
}

input Path {
    path: String!
}

`;
const downloadQueries = `
    
`;

const downloadMutations = `
    downloadFile(file: Path!,input:TokenInput!):DownloadOut
    downloadList(owner: Owner!,input:TokenInput!): File
`;



//DOWNLOAD
const uploadTypeDef = `

scalar Upload

input UploadInput {
    uploads: [Upload!]!
    name: String!
    description: String!
    owner: String!
}


  type UploadOut {
    name: String
    description: String
    owner: String
    path: String
    advise:String
  }

`;

const uploadMutations = `
    uploadFiles(files: UploadInput!,input:TokenInput!): UploadOut!
`;

const org_URL = "http://34.73.216.116:8000/organization-ms";
const download_URL = "http://34.73.216.116:8005/api/v1";
const upload_URL = "http://34.73.216.116:3000/posts";
const auth_URL = "http://34.73.216.116:5005";

const UPLOAD_DIR = './uploads';

// Ensure upload directory exists.
mkdirp.sync(UPLOAD_DIR);

const storeFS = ({ stream, filename }) => {
	const path = `${UPLOAD_DIR}/${filename}`;
	return new Promise((resolve, reject) =>
		stream
			.on('error', error => {
				if (stream.truncated)
					// Delete the truncated file.
					fs.unlinkSync(path);
				reject(error);
			})
			.pipe(fs.createWriteStream(path))
			.on('error', error => reject(error))
			.on('finish', () => resolve({ path }))
	)
};


const processUpload = async input => {
	console.log(input);
	var fs$$1 = require("fs");
	var array = [];
	var paths = [];
	const { uploads, name, description, owner } = await input;
	for (let index = 0; index < uploads.length; index++) {
		const upload = uploads[index];
		const { createReadStream, filename, mimetype } = await upload;
		const stream = createReadStream();
		const { path } = await storeFS({ stream, filename });
		array.push(fs$$1.createReadStream(path));
		paths.push(path);
	}

	var request$$1 = require("request");

	var options = {
		method: 'POST',
		url: upload_URL,
		headers:
		{
			'Content-Type': 'multipart/form-data',

		},
		formData:
		{
			'uploads[]': array,
			name: name,
			description: description,
			owner: owner
		}
	};
	return new Promise((resolve, reject) => {
		var EventEmitter = require("events").EventEmitter;
		var body = new EventEmitter();
		request$$1(options, function (error, response, data) {
			if (error) {
				error => reject(error);
			}
			body.data = data;
			body.emit('update');
			for (let index = 0; index < paths.length; index++) {
				fs$$1.unlinkSync(paths[index]);
			}
		});
		body.on('update', () => resolve(body.data));
	})
};

const validate = (input) => {
	var request$$1 = require("request");

	var options = {
		method: 'POST',
		url: auth_URL + "/validateToken",
		headers:
		{
			'Content-Type': 'application/json',
			'email': String(input.email),
			'token': String(input.token)

		}
	};
	return new Promise((resolve, reject) => {
		var EventEmitter = require("events").EventEmitter;
		var body = new EventEmitter();
		request$$1(options, function (error, response, data) {
			if (error) {
				error => reject(error);
			}
			body.data = data;
			body.emit('update');
			//console.log(data)
		});
		body.on('update', () => resolve(body.data));
	})
};
function folder(json, owner) {
	var files = [];
	for (let key in json) {
		var temp = {};
		if(key==="path" || key ==="description" || key==="owner"){
			break;
		}
		temp['name'] = key;
		temp['owner'] = owner;
		temp['path'] = json[key].path;
		temp['files'] =[];
		if (json[key]!=null && !(typeof json[key] === 'string' || json[key] instanceof String)) {
			//console.log(json[key])
			temp['files'] = folder(json[key], owner);
		}
		files.push(temp);
	}
	return files
}

const resolvers = {
	Upload: apolloServerKoa__default.GraphQLUpload,
	Query: {
		//ORGANIZATION
		async allCreations(obj, { input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			return getRequest(org_URL, 'logs/create')
		},
		async allMovements(obj, { input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			return getRequest(org_URL, 'logs/move')
		},
		async allDeletes(obj, { input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			return getRequest(org_URL, 'logs/move')
		},
		//DOWNLOAD
		/*async downloadList(obj, { input }) {
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			return getRequest(download_URL, 'downloads')
		}*/
		//UPLOAD
		//AUTH
	},
	Mutation: {
		//ORGANIZATION
		async createFolder(obj, { create, input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			return generalRequest(`${org_URL}` + "/folder", 'POST', create)
		},
		async moveFile(obj, { move, input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			var res= await generalRequest(`${org_URL}` + "/folder", 'PUT', move);
			console.log(res);
			return res
		},
		async deleteFile(obj, { del, input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			return generalRequest(`${org_URL}` + "/folder", 'DELETE', del)
		},
		//DOWNLOAD
		async downloadFile(obj, { file, input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			return generalRequest(`${download_URL}` + "/downloads/download", 'POST', file)
		},
		async downloadList(obj, { owner, input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			let dw = await generalRequest(`${download_URL}` + "/downloads", 'POST', owner);
			var res = {
				name: owner.owner,
				owner: owner.owner,
				files: folder(dw, owner.owner)
			};
			/*for (let key in dw) {
				var temp = {}
				temp['name'] = key
				temp['owner'] = owner.owner
				temp['path'] = dw[key].path
				temp['files'] = folder(dw[key], owner.owner)
				res.files.push(temp)
			}*/
			return res
			//console.log(await generalRequest(`${download_URL}` + "/downloads", 'POST', owner))
			//return generalRequest(`${download_URL}` + "/downloads/download", 'POST', owner)
		},
		//UPLOAD
		//singleUpload: (obj, { file }) =>processUpload(file),
		//uploadFiles: (_, { input }) => processUpload(input),
		async uploadFiles(obj, { files, input }) {
			const token = JSON.parse(await validate(input));
			console.log(token.advise);
			if (token.advise != "Token accepted") {
				return token
			}
			var res = JSON.parse(await processUpload(files));
			//console.log(res)
			return res
		},
		//AUTH
		async createUser (_, { user }) {
			var res=await generalRequest(auth_URL + "/Users", 'POST', user);
			console.log(res);
			if(res.error){
				return res
			}
			const create={
				owner:user.name,
				path:"/SharedStorage/"+user.name
			};
			console.log(create);
			var xd = generalRequest(`${org_URL}` + "/folder", 'POST', create);	
			return res
		},
		updateUser: (_, { user }) =>
			generalRequest(auth_URL + "/Users", 'PUT', user),
		deleteUser: (_, { user }) =>
			generalRequest(auth_URL + "/Users", 'DELETE', user),
		async userSession(obj, { user }) {
			return await generalRequest(auth_URL + "/Session", 'POST', user)
		}
		/*userSession: (_, { user }) => {
			console.log(await generalRequest(auth_URL + "/Session", 'POST', user))
		},*/

	}

};

// merge the typeDefs
const mergedTypeDefs = mergeSchemas(
	[
		'scalar JSON',
		organizationTypeDef,
		downloadTypeDef,
		uploadTypeDef,
		usersTypeDef
	],
	[
		organizationQueries,
		downloadQueries,
	],
	[
		organizationMutations,
		uploadMutations,
		userMutations,
		downloadMutations
	]
);

// Generate the schema object from your types definition.
var graphQLSchema = apolloServerKoa.makeExecutableSchema({
	typeDefs: mergedTypeDefs,
	resolvers: merge(
		{ JSON: GraphQLJSON }, // allows scalar JSON
		resolvers
	)
});

/*const bodyparser = require("koa-bodyparser-graphql");
import * as bodyParser from 'body-parser-graphql'
var parse = require('co-body');
var multer  = require('multer');*/
const app = new Koa();
const server = new apolloServerKoa__default.ApolloServer({
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
});

server.applyMiddleware({ app });

app.listen(5000, error => {
  if (error) throw error

  // eslint-disable-next-line no-console
  console.info(
    `Serving http://localhost:${5000} for ${process.env.NODE_ENV}.`
  );
});
