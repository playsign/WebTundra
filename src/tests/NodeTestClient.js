// For conditions of distribution and use, see copyright notice in LICENSE

var WebSocketClientModule = require('../network/WebSocketClient');
var SyncManagerModule = require('../network/SyncManager.js');
var SceneModule = require('../scene/Scene.js');
var client = new WebSocketClientModule.WebSocketClient();
var scene = new SceneModule.Scene();
var syncManager = new SyncManagerModule.SyncManager(client, scene);
var loginData = {"username": "Test User"};

var registerComponent = require("../scene/Component").registerComponent;
require("../scene/EC_Placeable");
require("../scene/EC_Mesh");

syncManager.logDebug = true;
client.connect("localhost", 2345, loginData);
console.log("connecting");
/*
setTimeout(printEntityNames, 2000);

function printEntityNames() {
    for (var entityId in scene.entities) {
        var entity = scene.entities[entityId];
        console.log(entity.name);
    }
}
*/
