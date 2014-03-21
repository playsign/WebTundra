// For conditions of distribution and use, see copyright notice in LICENSE

var cLoginMessage = 100;
var cLoginReply = 101;

function WebSocketClient() {
    this.webSocket = null;
    this.url = "";
    this.connected = new signals.Signal();
    this.disconnected = new signals.Signal();
    this.messageReceived = new signals.Signal();
    this.loginReplyReceived = new signals.Signal();
    this.loginData = null;
    this.userID = 0;
    this.loginReplyData = null;
}

WebSocketClient.prototype = {
    // Connect to a Tundra server. Specify optional login data map which will be sent after connect
    connect : function(host, port, loginData) {
        this.url = "ws://" + host + ":" + port;
        if (loginData != null)
            this.loginData = loginData;
        this.userID = 0;
        this.loginReplyData = null;

        this.connected.add(this.onConnect, this);
        this.messageReceived.add(this.onMessageReceived, this); // For handling LoginReply

        try {
            if (runningNodeJs)
                this.webSocket = new WebSocket(this.url);
            else if (window.WebSocket)
                this.webSocket = new window.WebSocket(this.url);
            else if (window.MozWebSocket)
                this.webSocket = new window.MozWebSocket(this.url);
            else
            {
                console.log("Browser does not support WebSocket");
                return false;
            }
            this.webSocket.binaryType = 'arraybuffer';
        }
        catch (e) {
            console.error("Exception while connecting WebSocket: " + e.stack);
        }

        this.webSocket.onopen = function(evt) {
            this.connected.dispatch();
            console.log("connection open");
        }.bind(this);

        this.webSocket.onerror = function(evt) {
            console.log("websocket error: " + evt);
        }.bind(this);

        this.webSocket.on('error', function(evt) {
            console.log("websocket error: " + evt);
        }.bind(this));

        this.webSocket.onclose = function(evt) {
            this.disconnected.dispatch();
            this.webSocket = null;
            console.log("closed");
        }.bind(this);

        this.webSocket.onmessage = function(evt) {
            var msgbin;
            if (runningNodeJs) {
                var ab = new ArrayBuffer(evt.data.length);
                var byteview = new Uint8Array(ab);
                for (var i = 0; i < evt.data.length; i++)
                    byteview[i] = evt.data[i];
                msgbin = ab;
            } else
                msgbin = evt.data;
            
            var dd = new DataDeserializer(msgbin);
            var msgId = dd.readU16();
            this.messageReceived.dispatch(msgId, dd);
        }.bind(this);

        this.webSocket.onerror = function(evt) {
            /// \todo Error reporting
        }.bind(this);

        /// \todo use keepalive-timer to avoid disconnection if connection idle for a long time
        return true;
    },

    // Disconnect from a Tundra server
    disconnect : function() {
        if (this.webSocket) {
            this.webSocket.close()
            this.webSocket = null;
        }
    },

    // Begin a new message. Returns the DataSerializer to which the message payload can be written.
    startNewMessage : function(msgId, maxBytes) {
        var ds = new DataSerializer(maxBytes);
        ds.addU16(msgId);
        return ds;
    },

    // Send the message to the server using a filled DataSerializer
    endAndQueueMessage : function(ds) {
        if (this.webSocket) {
            ds.truncate();
            this.webSocket.send(ds.arrayBuffer);
        }
        else
            console.error("No connection, can not send message");
    },

    // If login data has been specified, automatically send it on connect
    onConnect : function() {
        if (this.loginData != null) {
            console.log("Sending login message");
            var ds = this.startNewMessage(cLoginMessage, 1024);
            var loginText = JSON.stringify(this.loginData);
            ds.addUtf8String(loginText);
            this.endAndQueueMessage(ds);
        }
    },

    onMessageReceived : function(msgId, dd) {
        if (msgId == cLoginReply) {
            // Do not need to intercept further events
            this.messageReceived.remove(this.onMessageReceived, this);
            var success = dd.readU8();
            if (success > 0) {
                this.userID = dd.readVLE();
                this.loginReply = JSON.parse(dd.readStringU16()); /// \todo Should use UTF8-encoding
                this.loginReplyReceived.dispatch();
            }
            else {
                console.log("Received login failure reply, disconnecting");
                this.disconnect();
            }
            dd.resetTraversal(); // Reset deserializer in case others want to read the message
        }
    }
};

if (typeof module !== 'undefined' && module.exports) { //node
    var runningNodeJs = true;
    module.exports.WebSocketClient = WebSocketClient;
    var signals = require("../util/Signals");
    var WebSocket = require("../server/node_modules/ws");
    var DataSerializer = require('../network/DataSerializer').DataSerializer;
    var DataDeserializer = require('../network/DataDeserializer').DataDeserializer;

}
