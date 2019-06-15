import fs from 'fs'
import apolloServerKoa from 'apollo-server-koa'
import lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import mkdirp from 'mkdirp'
import shortid from 'shortid'
import promisesAll from 'promises-all'
import * as FormData from 'form-data';
import request from 'request'

import { generalRequest, getRequest } from '../utilities';
import {
	url,
	org_port,
	org_entryPoint,
	download_port,
	download_entryPoint,
	auth_port,
	auth_entryPoint,
	upload_port,
	upload_entryPoint
} from './server';
const org_URL = `http://${url}:${org_port}/${org_entryPoint}`;
const download_URL = `http://${url}:${download_port}/${download_entryPoint}`;
const upload_URL = `http://${url}:${upload_port}/${upload_entryPoint}`;
const auth_URL = `http://${url}:${auth_port}`;;

const UPLOAD_DIR = './uploads'

// Ensure upload directory exists.
mkdirp.sync(UPLOAD_DIR)

const storeFS = ({ stream, filename }) => {
	const path = `${UPLOAD_DIR}/${filename}`
	return new Promise((resolve, reject) =>
		stream
			.on('error', error => {
				if (stream.truncated)
					// Delete the truncated file.
					fs.unlinkSync(path)
				reject(error)
			})
			.pipe(fs.createWriteStream(path))
			.on('error', error => reject(error))
			.on('finish', () => resolve({ path }))
	)
}


const processUpload = async input => {
	console.log(input)
	var fs = require("fs");
	var array = []
	var paths = []
	const { uploads, name, description, owner } = await input
	for (let index = 0; index < uploads.length; index++) {
		const upload = uploads[index];
		const { createReadStream, filename, mimetype } = await upload
		const stream = createReadStream()
		const { path } = await storeFS({ stream, filename })
		array.push(fs.createReadStream(path))
		paths.push(path)
	}

	var request = require("request");

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
		request(options, function (error, response, data) {
			if (error) {
				error => reject(error)
			};
			body.data = data;
			body.emit('update');
			for (let index = 0; index < paths.length; index++) {
				fs.unlinkSync(paths[index]);
			}
		})
		body.on('update', () => resolve(body.data))
	})
}

const validate = (input) => {
	var request = require("request");

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
		request(options, function (error, response, data) {
			if (error) {
				error => reject(error)
			};
			body.data = data;
			body.emit('update');
			//console.log(data)
		})
		body.on('update', () => resolve(body.data))
	})
}
function folder(json, owner) {
	var files = []
	for (let key in json) {
		var temp = {}
		if(key==="path" || key ==="description" || key==="owner"){
			break;
		}
		temp['name'] = key
		temp['owner'] = owner
		temp['path'] = json[key].path
		temp['files'] =[]
		if (json[key]!=null && !(typeof json[key] === 'string' || json[key] instanceof String)) {
			//console.log(json[key])
			temp['files'] = folder(json[key], owner)
		}
		files.push(temp)
	}
	return files
}

const resolvers = {
	Upload: apolloServerKoa.GraphQLUpload,
	Query: {
		//ORGANIZATION
		async allCreations(obj, { input }) {
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			return getRequest(org_URL, 'logs/create')
		},
		async allMovements(obj, { input }) {
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			return getRequest(org_URL, 'logs/move')
		},
		async allDeletes(obj, { input }) {
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
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
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			return generalRequest(`${org_URL}` + "/folder", 'POST', create)
		},
		async moveFile(obj, { move, input }) {
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			var res= await generalRequest(`${org_URL}` + "/folder", 'PUT', move)
			console.log(res)
			return res
		},
		async deleteFile(obj, { del, input }) {
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			return generalRequest(`${org_URL}` + "/folder", 'DELETE', del)
		},
		//DOWNLOAD
		async downloadFile(obj, { file, input }) {
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			return generalRequest(`${download_URL}` + "/downloads/download", 'POST', file)
		},
		async downloadList(obj, { owner, input }) {
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			let dw = await generalRequest(`${download_URL}` + "/downloads", 'POST', owner)
			var res = {
				name: owner.owner,
				owner: owner.owner,
				files: folder(dw, owner.owner)
			}
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
			const token = JSON.parse(await validate(input))
			console.log(token.advise)
			if (token.advise != "Token accepted") {
				return token
			}
			var res = JSON.parse(await processUpload(files))
			//console.log(res)
			return res
		},
		//AUTH
		async createUser (_, { user }) {
			var res=await generalRequest(auth_URL + "/Users", 'POST', user)
			console.log(res)
			if(res.error){
				return res
			}
			const create={
				owner:user.name,
				path:"/SharedStorage/"+user.name
			}
			console.log(create)
			var xd = generalRequest(`${org_URL}` + "/folder", 'POST', create)	
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

}

export default resolvers;
