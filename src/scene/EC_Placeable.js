// For conditions of distribution and use, see copyright notice in LICENSE


if (typeof module !== 'undefined' && module.exports) { //node
    var signals = require("../util/Signals");
    var ComponentModule = require("./Component");
    var AttributeModule = require("./Attribute");
    var Component = ComponentModule.Component;
    var registerComponent = ComponentModule.registerComponent;
    console.log("zz " + AttributeModule);
    var cAttributeNone = 0;
    var cAttributeString = 1;
    var cAttributeInt = 2;
    var cAttributeReal = 3;
    var cAttributeColor = 4;
    var cAttributeFloat2 = 5;
    var cAttributeFloat3 = 6;
    var cAttributeFloat4 = 7;
    var cAttributeBool = 8;
    var cAttributeUInt = 9;
    var cAttributeQuat = 10;
    var cAttributeAssetReference = 11;
    var cAttributeAssetReferenceList = 12;
    var cAttributeEntityReference = 13;
    var cAttributeQVariant = 14;
    var cAttributeQVariantList = 15;
    var cAttributeTransform = 16;
    var cAttributeQPoint = 17;
    var cNumAttributeTypes = 18;
    for (var i = 0; i < AttributeModule.length; i++) {
        var key = AttributeModule[i];
        console.log(key);
        if (AttributeModule.hasOwnProperty(key) && key[0] == "c") {
            eval(key + " = " + AttributeModule[key]);
            console.log("setting " + key);
            //global[key] = AttributeModule[key];
        }
    }
}

var cComponentTypePlaceable = 20;

function EC_Placeable() {
    Component.call(this, cComponentTypePlaceable);
    this.addAttribute(cAttributeTransform, "transform", "Transform");
    this.addAttribute(cAttributeBool, "drawDebug", "Show bounding box", false);
    this.addAttribute(cAttributeBool, "visible", "Visible", true);
    this.addAttribute(cAttributeInt, "selectionLayer", "Selection layer", 1);
    this.addAttribute(cAttributeEntityReference, "parentRef", "Parent entity ref");
    this.addAttribute(cAttributeString, "parentBone", "Parent bone name");
    
    this.attributeChanged.add(this.checkParent.bind(this));

    this.parentRefReady = new signals.Signal(); 
}

EC_Placeable.prototype = new Component(cComponentTypePlaceable);

EC_Placeable.prototype.checkParent = function(attr, changeType) {
    //console.log(this + " - " + this.parentRef + " : " + attr.id); // + " == " + this.parentRef.id);
    if (attr.id == "parentRef") {
        //console.log("parentRef: " + this.parentRef);
        if (this.parentRef) {
            var parentEnt = this.parentEntity.parentScene.entityById(this.parentRef);
            if (parentEnt && parentEnt.componentByType(cComponentTypePlaceable)) {
                //console.log("placeable parent was there immediately");
                this.parentRefReady.dispatch();
                //XXX TODO: may break if the parent placeable is not ready yet
                //if there is a deeper hierarchy with multiple levels of parents
                //an ugly way to fix would be to add a 'ready' boolean.
                //same problem is in the waitParent case below
            } else {
                this.parentEntity.parentScene.entityCreated.add(this.waitParent);
            }
        } else {
            this.parentRefReady.dispatch();
        }
    }
}               

EC_Placeable.prototype.waitParent = function(addedEntity, changeType) {
    if (addedEntity.id === this.parentRef.id) {        
        //console.log("placeable parent was there later");
        this.parentRefReady.dispatch();
        this.parentEntity.parentScene.entityCreated.remove(this.waitParent);
    }
};

registerComponent(cComponentTypePlaceable, "Placeable", function(){ return new EC_Placeable(); });

