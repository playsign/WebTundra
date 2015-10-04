
define([
        "lib/three",
        "core/framework/Tundra",
        "core/framework/CoreStringUtils",
        "core/scene/Scene",
        "entity-components/EC_Sound",
        "core/scene/Attribute",
        "core/math/Transform",
        "core/asset/AssetTransfer",
        "core/asset/IAsset",
        "core/data/DataSerializer"
    ], function(THREE, Tundra, CoreStringUtils, Scene, EC_Sound,
                Attribute, Transform, AssetTransfer, IAsset, DataSerializer) {

/**
    Mesh component implementation for the three.js render system.

    @class EC_Sound_ThreeJs
    @extends EC_Sound
    @constructor
*/
var EC_Sound_ThreeJs = EC_Sound.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        this.soundAsset = null;
        this.soundRequested = false;

        this._loadsEmitted = {
            sound : false
        };
    },

    __classvars__ :
    {
        Implementation : "three.js"
    },

    reset : function()
    {
        Tundra.events.remove("EC_Sound." + this.parentEntity.id + "." + this.id + ".SoundLoaded");
        this.resetSound();

        if (this._componentAddedSub !== undefined)
        {
            Tundra.events.unsubscribe(this._componentAddedSub);
            this._componentAddedSub = undefined;
        }
    },

    attributeChanged : function(index, name, value)
    {
        // soundRef
        if (index === 0)
        {
            this.resetSound();
            this.update();
        }
    /*
        // materialRefs
        else if (index === 3)
        {
            this.materialsRequested = false;
            this.update();
        }
        // drawDistance
        else if (index === 4)
        {
        }
        // castShadows
        else if (index === 5)
        {
            if (this.meshAsset == null)
                return;

            for (var i=0, num=this.meshAsset.numSubmeshes(); i<num; ++i)
            {
                var submesh = this.meshAsset.getSubmesh(i);
                if (submesh === undefined || submesh === null)
                    continue;
                submesh.castShadow = value;
            }
        }
        */
    },

    /**
        Get root scene node for this mesh.
        @method getSceneNode
        @return {THREE.Object3D|null} Root scene node for all submeshes.
    */
    getSceneNode : function()
    {
        return (this.soundAsset != null ? this.soundAsset.getSceneNode() : null);
    },

    ///**
    //    Get submesh.
    //    @method getSubmesh
    //    @return {THREE.Mesh|null} Submesh.
    //*/
    //getSubmesh : function(index)
    //{
    //    return (this.meshAsset != null ? this.meshAsset.getSubmesh(index) : null);
    //},
    //
    ///**
    //    Get number of submeshes.
    //    @method numSubmeshes
    //    @return {Number} Number of submeshes.
    //*/
    //numSubmeshes : function()
    //{
    //    return (this.meshAsset != null ? this.meshAsset.numSubmeshes() : 0);
    //},
    //
    ///**
    //    Get bounding box for this mesh.
    //    @method getBoundingBox
    //    @return {THREE.Box3} Bounding box.
    //*/
    //getBoundingBox : function()
    //{
    //    var box = new THREE.Box3();
    //    if (this.numSubmeshes() > 0)
    //        box.set(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    //
    //    for (var i=0,len=this.numSubmeshes(); i<len; i++)
    //    {
    //        var sm = this.getSubmesh(i);
    //        if (sm != null && sm.geometry != null)
    //        {
    //            if (sm.geometry.boundingBox == null)
    //                sm.geometry.computeBoundingBox();
    //            box.union(sm.geometry.boundingBox);
    //        }
    //    }
    //    return box;
    //},

    update : function()
    {
        // Request mesh
        if (this.soundAsset == null && !this.soundRequested)
        {
            var soundRef = this.attributes.soundRef.get();
            if (soundRef != null && soundRef != "")
            {
                this.soundRequested = true;
                /* skip the tundra asset biz now as three already has the audio file download implemented.
                would the assetapi thing be still useful somehow here?
                var transfer = Tundra.asset.requestAsset(soundRef, forcedType);

                if (transfer != null)
                    transfer.onCompleted(this, this._meshAssetLoaded);
                 */


            }
        }

        // Mesh still loading?
        if (this.meshAsset == null || !this.meshAsset.isLoaded())
            return;

        // Parent this meshes scene node to EC_Placeable scene node
        if (this.meshAsset.mesh && !this.meshAsset.mesh.parent)
        {
            if (this.parentEntity.placeable != null)
                this._onParentEntityComponentCreated(this.parentEntity, this.parentEntity.placeable);
            else
                this._componentAddedSub = this.parentEntity.onComponentCreated(this, this._onParentEntityComponentCreated);
        }
        if (this.meshAsset.mesh)
            Tundra.renderer.updateSceneNode(this.meshAsset.mesh, this.nodeTransformation);
    },

    _onParentEntityComponentCreated : function(entity, component)
    {
        if (component != null && component.typeName === "Placeable")
        {
            if (this._componentAddedSub !== undefined)
            {
                Tundra.events.unsubscribe(this._componentAddedSub);
                this._componentAddedSub = undefined;
            }

            if (component.sceneNode != null)
                this._onParentPlaceableNodeCreated(component, component.sceneNode);
            else
                this._placeableNodeCreatedSub = component.onSceneNodeCreated(this, this._onParentPlaceableNodeCreated);
        }
    },

    _onParentPlaceableNodeCreated : function(placeable, sceneNode)
    {
        if (this._placeableNodeCreatedSub !== undefined)
        {
            Tundra.events.unsubscribe(this._placeableNodeCreatedSub);
            this._placeableNodeCreatedSub = undefined;
        }

        if (this.meshAsset != null && this.meshAsset.mesh != null)
        {
            var parentWasNull = (this.meshAsset.mesh.parent == null);
            placeable.addChild(this.meshAsset.mesh)

            if (parentWasNull && this._loadsEmitted.mesh === false)
            {
                this._loadsEmitted.sound = true;
                Tundra.events.send("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MeshLoaded", this.parentEntity, this, this.meshAsset);
            }
        }
        else
            this.log.error("Mesh not ready but placeable is?!")
    },

    resetSound : function()
    {
        if (this.meshAsset != null)
        {
            var placeable = this.parentEntity.getComponent("Placeable");
            if (placeable != null && placeable.sceneNode != null)
                placeable.sceneNode.remove(this.meshAsset.mesh);

            // Meshes are instantiated per object/usage so its safe to unload this instance here.
            this.meshAsset.unload();
        }
        this.meshAsset = null;
        this.meshRequested = false;
        //this._loadsEmitted.mesh = false;
    },

    /**
        Set mesh reference.
        @method setMesh
        @param {String} meshRef Mesh reference.
        @param {AttributeChange} [change=AttributeChange.Default] Attribute change signaling mode.
        @return {Boolean} If set was successful.
    */
    setMesh : function(meshRef, change)
    {
        if (typeof meshRef !== "string")
        {
            this.log.errorC("setMesh must be called with a string ref, called with:", meshRef);
            return false;
        }
        return this.attributes.meshRef.set(meshRef, change);
    },

    /**
        Registers a callback for when a new mesh has been loaded.
        @example
            ent.mesh.onMeshLoaded(null, function(parentEntity, meshComponent, asset) {
                console.log("Mesh loaded", asset.name);
            });

        @method onMeshLoaded
        @param {Object} context Context of in which the `callback` function is executed. Can be `null`.
        @param {Function} callback Function to be called.
        @return {EventSubscription|null} Subscription data or null if parent entity is not set.
        See {{#crossLink "EventAPI/unsubscribe:method"}}EventAPI.unsubscribe(){{/crossLink}} on how to unsubscribe from this event.
    */
    onMeshLoaded : function(context, callback)
    {
        if (!this.hasParentEntity())
        {
            this.log.error("Cannot subscribe onMeshLoaded, parent entity not set!");
            return null;
        }
        return Tundra.events.subscribe("EC_Mesh." + this.parentEntity.id + "." + this.id + ".MeshLoaded", context, callback);
    },

    _meshAssetLoaded : function(asset)
    {
        if (!this.hasParentEntity())
            return;

        this.meshAsset = asset;
        if (this.meshAsset.mesh != null)
        {
            this.meshAsset.mesh.tundraEntityId = this.parentEntity.id;
            for (var i = 0, numSubmeshes = this.meshAsset.numSubmeshes(); i < numSubmeshes; i++)
            {
                var submesh = this.meshAsset.getSubmesh(i);
                if (submesh != null)
                    submesh.tundraEntityId = this.parentEntity.id;
            }
        }
        this.update();

        if (this.meshAsset.mesh.parent != null && this._loadsEmitted.sound === false)
        {
            this._loadsEmitted.sound = true;
            Tundra.events.send("EC_Sound." + this.parentEntity.id + "." + this.id + ".SoundLoaded", this.parentEntity, this, this.meshAsset);
        }
    },
});

return EC_Sound_ThreeJs;

}); // require js
