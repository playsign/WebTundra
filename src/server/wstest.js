"use strict";

/* jshint node: true */

function check(thing) {
    if (!thing)
        throw("fail: " + thing);
    else
        return thing;
}

var ws = require('../server/node_modules/ws');
var SyncManagerModule = require('../network/SyncManager');
var TundraWsServerModule = require('../network/WebSocketServer');
var SceneModule = require('../scene/Scene');
//var DataSerializer = require('../network/DataSerializer');
var DataDeserializerModule = require('../network/DataDeserializer');

var ServerSyncManager = function(nodeWsServer) {
    var scene;
    this.scene = scene = new SceneModule.Scene();
    this.wsServer = nodeWsServer;    
    this.logDebug = true;

    this.wsServer.on("connection", this.onWsConnection.bind(this));

    // Attach to scene change signals for determining what changes to send to the server
    scene.attributeChanged.add(this.onAttributeChanged, this);
    scene.attributeAdded.add(this.onAttributeAdded, this);
    scene.attributeRemoved.add(this.onAttributeRemoved, this);
    scene.componentAdded.add(this.onComponentAdded, this);
    scene.componentRemoved.add(this.onComponentRemoved, this);
    scene.entityCreated.add(this.onEntityCreated, this);
    scene.entityRemoved.add(this.onEntityRemoved, this);
    scene.actionTriggered.add(this.onActionTriggered, this);
};

ServerSyncManager.prototype = Object.create(check(SyncManagerModule.SyncManager));

ServerSyncManager.prototype.onWsConnetion = function(wsConn) {
    wsConn.on("message", this.onWsMessage.bind(this, wsConn));
};

ServerSyncManager.prototype.onWsMessage = function(wsConn, wsMsg, wsFlags) {
    var dd = new DataDeserializer(nodeBufferToArrayBuffer(wsMsg));
    var msgId = dd.readU16();
    this.messageReceived.dispatch(msgId, dd);    
};

function nodeBufferToArrayBuffer(nodeBuf) {
    var ab = new ArrayBuffer(nodeBuf.length);
    var byteview = new Uint8Array(ab);
    for (var i = 0; i < nodeBuf.length; i++)
        byteview[i] = nodeBuf[i];
    return ab;
}

var serverOpts = {
    host: "localhost",
    port: 2345
};
var wserv = new TundraWsServerModule.WebSocketServer(new ws.Server(serverOpts));
wserv.serve();

function run() {

    var myserver = new ws.Server({port: 2345});

    myserver.on("connection", function(csock) {
        csock.on("message", function(inmsg, flags) {
            // msg is a node Buffer
            if (!flags.binary)
                throw "got non-binary msg from knet websocket";
            var ab = new ArrayBuffer(inmsg.length);
            var byteview = new Uint8Array(ab);
            for (var i = 0; i < inmsg.length; i++)
                byteview[i] = inmsg[i];
            var dd = new DataDeserializer(ab);
            console.log("incoming bytes:", inmsg.length);
            var msgId = dd.readU16();
            switch (msgId) {
            case 100:
                // login
                console.log("msg id", msgId);
                var loginString = dd.readUtf8String();
                console.log("login string", loginString);
                var highestProtoVer = dd.readVLE();
                console.log("proto", highestProtoVer);
                break;

            case 110:
                // CreateEntity
                dd.readVLE(); // skip scene id
                var entityId = dd.readVLE();
                var isTemp = dd.readU8();
                var compCount = dd.readVLE();
                for (var i = 0; i < compCount; i++) {
                    var compId = dd.readVLE();
                    var typeId = dd.readVLE();
                    var compName = dd.readString();
                    var compBytes = dd.readVLE();
                    console.log("incoming component, cid/tid", compId, typeId);
                    var cab = dd.readArrayBuffer(compBytes);
                    var compDd = new DataDeserializer(cab);
                    if (compId == 26 ) /* name, 3 string attrs */ {
                        // ...
                    }
                }
                break;
            }            
        });    
    });
}
