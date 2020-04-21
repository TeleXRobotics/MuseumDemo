var canvas = document.getElementById("renderCanvas");


const createWall = (scene, position, rotation, alpha) => {
    const wall = BABYLON.Mesh.CreatePlane('ground', 20.0, scene);
    wall.material = new BABYLON.StandardMaterial('groundMat', scene);
    wall.material.alpha = alpha;
    wall.position = position;
    wall.rotation = rotation;
    wall.checkCollisions = true;
};

const initEnvironment = (scene, wallPoses) => {
    scene.createDefaultLight();
    // create ground
    createWall(scene, BABYLON.Vector3.Zero(), new BABYLON.Vector3(Math.PI / 2, 0, 0), 1.0);
    // create walls
    wallPoses.forEach(element => {
        createWall(scene, element.position, element.rotation, 0.0);
    });
};

const initDefaultEnvironment = (scene) => {
    // initialize a 10 x 5 (meters) box with four walls
    initEnvironment(
        scene,
        [
            {
                position: new BABYLON.Vector3(10, 0, 0),
                rotation: new BABYLON.Vector3(0, Math.PI / 2.0, 0)
            },
            {
                position: new BABYLON.Vector3(-10, 0, 0),
                rotation: new BABYLON.Vector3(0, -Math.PI / 2.0, 0)
            },
            {
                position: new BABYLON.Vector3(0, 0, 5),
                rotation: BABYLON.Vector3.Zero()
            },
            {
                position: new BABYLON.Vector3(0, 0, -5),
                rotation: new BABYLON.Vector3(0, Math.PI, 0)
            }
        ]
    );
}


/**
 * This function initializes the player's camera, collision detection,
 * and gravity
 * @param {object} env description of the project environment variables,
 * including scene, canvas, and playerHeight
 * @param {BABYLON.Scene} env.scene BABYLON Scene
 * @param {HTMLCanvasElement} env.canvas the html canvas
 * @param {number} env.playerHeight the height of the player
 * @returns {BABYLON.UniversalCamera} the player's camera object
 */
const initializePlayer = (env) => {
    const camera = new BABYLON.UniversalCamera(
        'UniversalCamera',
        new BABYLON.Vector3(0, env.playerHeight * 2, -5),
        env.scene,
    );

    camera.setTarget(new BABYLON.Vector3(0, env.playerHeight, 0));
    camera.attachControl(env.canvas, true);
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(1, env.playerHeight, 1);
    camera.checkCollisions = true;
    return camera;
}

var createScene = function () {
    var scene = new BABYLON.Scene(engine);
	const camera = initializePlayer({
        scene: scene,
        canvas: canvas,
        playerHeight: 1
    });
	
    initDefaultEnvironment(scene);

	var url;
	var fileName;
		
//-- BoomBox.gltf
	url = "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/Playground/scenes/BoomBox/";
	fileName = "BoomBox.gltf";

	BABYLON.SceneLoader.ImportMesh("", url, fileName, scene, function (newMeshes) {
		var mesh = newMeshes[0];
			mesh.position.copyFromFloats(0, 1, 0);
			mesh.scaling.copyFromFloats(100,100,100);
			
		camera.target = mesh;
	});
    return scene;
};

var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
var scene = createScene();

engine.runRenderLoop(function () {
	if (scene) {
		scene.render();
	}
});

// Resize
window.addEventListener("resize", function () {
	engine.resize();
});
