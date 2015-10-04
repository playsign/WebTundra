
define([
        "lib/three",
        "core/framework/Tundra",
        "core/asset/IAsset"
    ], function(THREE, Tundra, IAsset) {

/**
    Represents a three.js audio asset. The input data is processed and Three.js rendering engine audio object is generated.

    @class ThreeAudioAsset
    @extends IAsset
    @constructor
    @param {String} name Unique name of the asset, usually this is the asset reference.
*/
var ThreeAudioAsset = IAsset.$extend(
{
    __init__ : function(name)
    {
        this.$super(name, "ThreeAudioAsset");

        this.requiresCloning = true;
        /**
            THREE.Object3D scene node where all the submeshes with the actual geometry are parented to.
            @property mesh
            @type THREE.Object3D
        */
        this.mesh = undefined; //note: this should be called 'node' or 'object3d' or something both in Mesh & here, keeping .mesh for consistency now
    },

    isLoaded : function()
    {
        return (this.mesh !== undefined);
    },

    unload : function()
    {
        /*
        // If this is the source of cloning don't unload it.
        // This would break the mesh if refs with it are added back during runtime.
        if (this.requiresCloning && this.isCloneSource)
            return;

        var numSubmeshes = this.numSubmeshes();
        if (this.logging && this.mesh != null && numSubmeshes > 0)
            this.log.debug("unload", this.name);

        if (this.mesh != null && this.mesh.parent != null)
            this.mesh.parent.remove(this.mesh);

        for (var i = 0; i < numSubmeshes; i++)
        {
            if (this.logging) console.log("  submesh " + i);
            var submesh = this.getSubmesh(i);
            if (submesh.geometry != null)
            {
                if (this.logging) console.log("    geometry");
                if (this.isGeometryInUse(submesh.geometry) === false)
                    submesh.geometry.dispose();
                else if (this.logging)
                    this.log.debug("      Still in use, not unloading");
                submesh.geometry = null;
            }
            submesh.material = null;
            submesh = null;
        }
        if (this.mesh != null)
            this.mesh.children = [];
        this.mesh = undefined;
        */
    },

    _cloneImpl : function(newAssetName)
    {
        /*
        // Clone the three.js Object3D so that they get their own transform etc.
        // but don't clone the geometry, just reference to the existing geometry.
        // The unloading mechanism will check when the geometry uuid is no longer used and
        // is safe to unload.

        var meshAsset = new ThreeJsonAsset(newAssetName);
        meshAsset.mesh = Tundra.framework.renderer.createSceneNode();
        for (var i=0, len=this.numSubmeshes(); i<len; ++i)
        {
            var existingSubmesh = this.getSubmesh(i);
            var clonedSubmesh = null;

            if (existingSubmesh instanceof THREE.SkinnedMesh)
                clonedSubmesh = new THREE.SkinnedMesh(existingSubmesh.geometry, Tundra.framework.renderer.materialWhite, false);
            else
                clonedSubmesh = new THREE.Mesh(existingSubmesh.geometry, Tundra.framework.renderer.materialWhite);

            clonedSubmesh.name = meshAsset.name + "_submesh_" + i;
            clonedSubmesh.tundraSubmeshIndex = existingSubmesh.tundraSubmeshIndex;

            meshAsset.mesh.add(clonedSubmesh);
        }
        return meshAsset;
        */
    },

    deserializeFromData : function(data, dataType)
    {
        try
        {
            this.log.error("data");
            /*
            var threejsData = ThreeJsonAsset.Loader.parse(data);

            if (threejsData !== undefined && threejsData.geometry !== undefined)
            {
                /// @todo Check if a .json mesh can even return a single material and if this code is valid in that case.
                var material = undefined;
                if (threejsData.materials !== undefined)
                    material = (threejsData.materials.length === 1 ? threejsData.materials[0] : new THREE.MeshFaceMaterial(threejsData.materials));

                this.mesh = Tundra.framework.renderer.createSceneNode();
                this.mesh.add(new THREE.Mesh(threejsData.geometry, material));
            }
            else
                this.log.error("Parsing failed, three.js didnt return a valid geometry for", this.name);
            */
        }
        catch(e)
        {
            this.log.error("Failed to load sound", this.name, e.toString());
            this.mesh = undefined;
        }

        if (this.mesh === undefined || this.mesh === null)
            this.mesh = Tundra.framework.renderer.createSceneNode();

        // Placeable will update the matrix when changes occur.
        this.mesh.name = this.name;

        return this.isLoaded();
    }
});

return ThreeAudioAsset;

}); // require js
