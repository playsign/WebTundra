function XML3DJSView() {
    this.createScene();
}

XML3DJSView.prototype = {

    constructor: XML3DJSView,

    createScene: function() {
        //return new THREE.Scene();
	var xml3dElementId = "xml3d";
        var _xml3dElement = document.getElementById(xml3dElementId);
        if(!_xml3dElement) //is apparently XML3D for me now, html vs xhtml? || _xml3dElement.tagName != "xml3d")
            console.error("[ERROR] (XML3DJSView) : Cannot find XML3D element with id " + xml3dElementId);
        this.xml3dElement = _xml3dElement;
	console.log("XML3DJSView createScene");
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



