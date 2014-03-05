function XML3DJSView() {
}

XML3DJSView.prototype = {

    constructor: XML3DJSView,

    createScene: function() {
        //return new THREE.Scene();
    },

    render: function(delta) {
        //this.renderer.render(this.scene, this.camera);
    },

    onComponentAddedOrChanged: function(entity, component, changeType, changedAttr) {
        check(component instanceof Component);
        check(entity instanceof Entity);
	console.log("XML3DJSView onComponentAddedOrChanged");
    },

    onComponentRemoved: function(entity, component, changeType) {
    },
}



