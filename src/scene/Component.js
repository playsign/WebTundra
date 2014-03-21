// For conditions of distribution and use, see copyright notice in LICENSE

var componentTypeNames = {};
var componentTypeIds = {};
var componentFactories = {};

function Component(typeId) {
    this.parentEntity = null;
    this.typeId = typeId;
    this.name = "";
    this.id = 0;
    this.supportsDynamicAttributes = false;
    this.attributes = [];
    this.attributeChanged = new signals.Signal();
    this.attributeAdded = new signals.Signal();
    this.attributeRemoved = new signals.Signal();
}

Component.prototype = {
    // Add a new static attribute at initialization
    addAttribute: function(typeId, id, name, value) {
        var newAttr = createAttribute(typeId);
        if (newAttr != null) {
            newAttr.name = name;
            newAttr.id = id;
            newAttr.owner = this;
            if (value != null)
                newAttr.value = value;
            newAttr.index = this.attributes.length;
            this.attributes.push(newAttr);
            this.registerAttributeAsProperty(id, newAttr);
            return newAttr;
        }
        else
            return null;
    },
    
    // Create a dynamic attribute during runtime
    createAttribute: function(index, typeId, name, value, changeType) {
        if (!this.supportsDynamicAttributes) {
            console.log("Component " + this.typeName + " does not support adding dynamic attributes");
            return null;
        }
        var newAttr = createAttribute(typeId);
        if (newAttr != null) {
            newAttr.name = name;
            newAttr.id = name; // For dynamic attributes name == id
            newAttr.owner = this;
            if (value != null)
                newAttr.value = value;
            newAttr.index = index;
            newAttr.dynamic = true;

            // If needed, make "holes" to the attribute list
            while (this.attributes.length < index)
                this.attributes.push(null);
            if (this.attributes.length == index)
                this.attributes.push(newAttr)
            else
                this.attributes[index] = newAttr;

            this.registerAttributeAsProperty(newAttr.id, newAttr);

            if (changeType == null || changeType == AttributeChange.Default)
                changeType = this.local ? AttributeChange.LocalOnly : AttributeChange.Replicate;
            if (changeType != AttributeChange.Disconnected)
            {
                // Trigger scene level signal
                if (this.parentEntity && this.parentEntity.parentScene)
                    this.parentEntity.parentScene.emitAttributeAdded(this, newAttr, changeType);
                // Trigger component level signal
                this.attributeAdded.dispatch(newAttr, changeType);
            }
            
            return newAttr;
        }
        else
            return null;
    },

    registerAttributeAsProperty : function(id, attr) {
        var propName = sanitatePropertyName(id);
        //based on http://stackoverflow.com/questions/1894792/determining-if-a-javascript-object-has-a-given-property
        //instead of hasOwnProperty to not create confusion if someone creates an EC called 'prototype' or so.
        if (!(propName in this)) {
            Object.defineProperty(this, propName, 
                                  {get: function() { return attr.value; },
                                   set: function(changedVal) { attr.value = changedVal; },
                                   enumerable : true,
                                   configurable : true}); //allows deleting the prop
        }
    },

    // Remove a dynamic attribute during runtime
    removeAttribute : function(index, changeType) {
        if (!this.supportsDynamicAttributes) {
            console.log("Component " + this.typeName + " does not support dynamic attributes");
            return null;
        }
        if (index < this.attributes.length && this.attributes[index] != null) {
            var attr = this.attributes[index];

            // Remove direct named access
            var propName = sanitatePropertyName(attr.id);
            if (this[propName] === attr)
                delete this[propName];
            if (index == this.attributes.length - 1)
                this.attributes.splice(index, 1);
            else
                this.attributes[index] = null; // Leave hole if necessary

            if (changeType == null || changeType == AttributeChange.Default)
                changeType = this.local ? AttributeChange.LocalOnly : AttributeChange.Replicate;
            if (changeType != AttributeChange.Disconnected)
            {
                // Trigger scene level signal
                if (this.parentEntity && this.parentEntity.parentScene)
                    this.parentEntity.parentScene.emitAttributeRemoved(this, attr, changeType);
                // Trigger component level signal
                this.attributeRemoved.dispatch(attr, changeType);
            }
        }
    },
    

    // Look up and return attribute by id
    attributeById : function(id) {
        for (var i = 0; i < this.attributes.length; ++i) {
            if (this.attributes[i] != null && this.attributes[i].id == id)
                return this.attributes[i];
        }
        return null;
    },

    // Look up and return attribute by name
    attributeByName : function(name) {
        for (var i = 0; i < this.attributes.length; ++i) {
            if (this.attributes[i] != null && this.attributes[i].name == name)
                return this.attributes[i];
        }
        return null;
    },

    get typeName(){
        return componentTypeNames[this.typeId];
    },

    get local(){
        return this.id >= cFirstLocalId;
    },

    get unacked(){
        return this.id >= cFirstUnackedId && this.id < cFirstLocalId;
    },
    
    // Trigger attribute change signal. Called by Attribute
    emitAttributeChanged : function(attr, changeType) {
        if (changeType == null || changeType == AttributeChange.Default)
            changeType = this.local ? AttributeChange.LocalOnly : AttributeChange.Replicate;
        if (changeType == AttributeChange.Disconnected)
            return;

        // Trigger scene level signal
        if (this.parentEntity && this.parentEntity.parentScene)
            this.parentEntity.parentScene.emitAttributeChanged(this, attr, changeType);

        // Trigger component level signal
        this.attributeChanged.dispatch(attr, changeType);
    }
}

function registerComponent(typeId, typeName, factory) {
    console.log("Registering component typeid " + typeId + " typename " + typeName);
    componentTypeNames[typeId] = typeName;
    componentTypeIds[typeName] = typeId;
    componentFactories[typeId] = factory;
    console.log("registered: component " + typeId);
}

function createComponent(typeId) {
    // Convert typename to numeric ID if necessary
    if (typeof typeId == 'string' || typeId instanceof String)
        typeId = componentTypeIds[typeId];
    if (componentFactories.hasOwnProperty(typeId))
        return componentFactories[typeId]();
    else
    {
        console.log("Could not create unknown component " + typeId);
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) { //node
    var cLastReplicatedId = 0x3fffffff;
    var cFirstUnackedId = 0x40000000;
    var cFirstLocalId = 0x80000000;
    var signals = require("../util/Signals");
    module.exports.registerComponent = registerComponent;
    module.exports.createComponent = createComponent;
    module.exports.Component = Component;
    var signals = require("../util/Signals");
    var createAttribute = require("./Attribute").createAttribute;
    var sanitatePropertyName = require("./Attribute").sanitatePropertyName;
    var AttributeChange = require("./Attribute").AttributeChange;

}
