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

        _mainDefs = XML3D.createElement("defs");
        this.xml3dElement.appendChild(_mainDefs);
    },

    render: function(delta) {
        //this.renderer.render(this.scene, this.camera);
    },

    onComponentAddedOrChanged: function(entity, component, changeType, changedAttr) {
        check(component instanceof Component);
        check(entity instanceof Entity);
        console.log("XML3DJSView onComponentAddedOrChanged");

        var entgroup = XML3D.createElement("group"); //rex entity == xml3d group
        entgroup.id = entity.id;

        if (component instanceof EC_Placeable)
            this.connectToPlaceable(entgroup, component);
        else if (component instanceof EC_Mesh) {
            // console.log("mesh changed or added for o3d " + threeGroup.userData.entityId);
            this.onMeshAddedOrChanged(entgroup, component);
        }
        
        this.xml3dElement.appendChild(entgroup);
    },

    onComponentRemoved: function(entity, component, changeType) {
    },

    onMeshAddedOrChanged: function(entgroup, meshComp) {
        var url = "suzanne.json"; //not worky - i get the same error locally too though"raf22031.ctm"; 
            //meshComp.meshRef.ref;
        if (url !== "") {
            var meshTag = XML3D.createElement("mesh");
            meshTag.src = url;
            entgroup.appendChild(meshTag);
        } else {
            console.log("empty meshref", url, "in ", meshComp);
            debugger
        }
    },

    updateFromTransform: function(entgroup, placeable) {
        var transformTag = XML3D.createElement("transform");
        var trid = "transform-" + entgroup.id;
        transformTag.setAttribute("id", trid);

        var tr = placeable.transform;
        var xml3dPosition = new XML3DVec3(tr.pos.x, tr.pos.y, tr.pos.z);
        var axisAngleRotation = new XML3DRotation(); //TODO
        var xml3dScale = new XML3DVec3(tr.scale.x, tr.scale.y, tr.scale.z);

        transformTag.translation.set(xml3dPosition);
        transformTag.rotation.set(axisAngleRotation);
        transformTag.scale.set(xml3dScale);

        _mainDefs.appendChild(transformTag);
        entgroup.transform = "#" + trid;
    },

    connectToPlaceable: function(entgroup, placeable) {
        //parenting not done yet, see the ThreeView impl for how to do it
        this.updateFromTransform(entgroup, placeable);
        placeable.attributeChanged.add(function(attr, changeType) {
            this.updateFromTransform(entgroup, placeable);
            }.bind(this));
    }
}



