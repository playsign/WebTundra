// For conditions of distribution and use, see copyright notice in LICENSE

var cComponentTypeMesh = 17;

if (typeof module !== 'undefined' && module.exports) { //node
    var ComponentModule = require("./Component");
    var Component = ComponentModule.Component;
    var registerComponent = ComponentModule.registerComponent;
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
}

function EC_Mesh() {
    Component.call(this, cComponentTypeMesh);
    this.addAttribute(cAttributeTransform, "nodeTransformation", "Transform");
    this.addAttribute(cAttributeAssetReference, "meshRef", "Mesh ref");
    this.addAttribute(cAttributeAssetReference, "skeletonRef", "Skeleton ref");
    this.addAttribute(cAttributeAssetReferenceList, "meshMaterial", "Mesh materials");
    this.addAttribute(cAttributeReal, "drawDistance", "Draw distance");
    this.addAttribute(cAttributeBool, "castShadows", "Cast shadows", false);
    this.addAttribute(cAttributeBool, "useInstancing", "Use instancing", false);
}

EC_Mesh.prototype = new Component(cComponentTypeMesh);

registerComponent(cComponentTypeMesh, "Mesh", function(){ return new EC_Mesh(); });
