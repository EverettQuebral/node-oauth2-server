/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var mongoose = require('mongoose')
	Schema = mongoose.Schema,
	model = module.exports;

//
// Schemas definitions
//
var OAuthAccessTokensSchema = new Schema({
	access_token: { type: String },
	client_id: { type: String },
	user_id: { type: String },
	expires: { type: Date }
});

var OAuthClientsSchema = new Schema({
	client_id: { type: String },
	client_secret: { type: String },
	redirect_uri: { type: String }
});

var OAuthUsersSchema = new Schema({
	id: { type: Number },
	username: { type: String },
	password: { type: String },
	firstname: { type: String },
	lastname: { type: String },
	email: { type: String, default: '' }
});

//
// Authorized Client ID - only for granting password
//
var OAuthAuthorizedClientsSchema = new Schema({
	client_id : {type :String}
});

mongoose.model('OAuthAccessTokens', OAuthAccessTokensSchema);
mongoose.model('OAuthClients', OAuthClientsSchema);
mongoose.model('OAuthUsers', OAuthUsersSchema);
mongoose.model('OAuthAuthorizedClients', OAuthAuthorizedClientsSchema);

var OAuthAccessTokensModel = mongoose.model('OAuthAccessTokens'),
	OAuthClientsModel = mongoose.model('OAuthClients'),
	OAuthUsersModel = mongoose.model('OAuthUsers'),
	OAuthAuthorizedClientsModel = mongoose.model('OAuthAuthorizedClients');

//
// node-oauth2-server callbacks
//
model.getAccessToken = function (bearerToken, callback) {
	console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');

	OAuthAccessTokensModel.findOne({ access_token: bearerToken }, callback);
};

model.getClient = function (clientId, clientSecret, callback) {
	console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');

	OAuthClientsModel.findOne({ client_id: clientId, client_secret: clientSecret }, callback);
};

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
var authorizedClientIds = ['s6BhdRkqt3', 'toto'];
model.grantTypeAllowed = function (clientId, grantType, callback) {
	console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');

	// I'm not checking the client_secret
	if (grantType === 'password') {
		OAuthAuthorizedClientsModel.findOne({client_id:clientId}, function(err, result){
			if (err) return callback(false, false);
			return callback(false, result.client_id === clientId);
		});
	}
	else {
		callback(false, true);
	}
};

model.saveAccessToken = function (accessToken, clientId, userId, expires, callback) {
	console.log('in saveAccessToken (accessToken: ' + accessToken + ', clientId: ' + clientId + ', userId: ' + userId + ', expires: ' + expires + ')');
	
	var a = mongoose.model('OAuthAccessTokens', OAuthAccessTokensSchema);

	a.findOneAndUpdate({clientId:clientId}, {access_token:accessToken, user_id: userId, expires: expires}, {upsert:true}, callback);
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
	console.log('in getUser (username: ' + username + ', password: ' + password + ')');

	OAuthUsersModel.findOne({ username: username, password: password }, callback);
};
