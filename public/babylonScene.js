const canvas = document.getElementById("renderCanvas");
const groundHeight = 1000;
const bottomJoystickOffset = -100;
let xAddPos = 0;
let yAddPos = 0;
let translateTransform = BABYLON.Vector3.Zero();

const createWall = (scene, position, rotation, alpha) => {
    const wall = BABYLON.Mesh.CreatePlane('ground', 10000, scene);
    wall.material = new BABYLON.StandardMaterial('groundMat', scene);
    wall.material.alpha = alpha;
    wall.position = position;
    wall.rotation = rotation;
    wall.checkCollisions = true;
};

const initEnvironment = (scene, wallPoses) => {
    scene.createDefaultLight();
    // create ground
    createWall(scene, new BABYLON.Vector3(0, groundHeight, 0), new BABYLON.Vector3(Math.PI / 2, 0, 0), 0.0);
    // create walls
    wallPoses.forEach(element => {
        createWall(scene, element.position, element.rotation, 0.0);
    });
};

const initDefaultEnvironment = (scene) => {
    // initialize a 1000 x 1000 (meters) box with four walls
    initEnvironment(
        scene,
        [
            {
                position: new BABYLON.Vector3(5000, groundHeight, 0),
                rotation: new BABYLON.Vector3(0, Math.PI / 2.0, 0)
            },
            {
                position: new BABYLON.Vector3(-5000, groundHeight, 0),
                rotation: new BABYLON.Vector3(0, -Math.PI / 2.0, 0)
            },
            {
                position: new BABYLON.Vector3(0, groundHeight, 1000),
                rotation: BABYLON.Vector3.Zero()
            },
            {
                position: new BABYLON.Vector3(0, groundHeight, -1000),
                rotation: new BABYLON.Vector3(0, Math.PI, 0)
            }
        ]
    );
}

/**
 * Make a BABYLON wheel UI
 * @param {object} props an object that contains the properties of the wheel
 * @param {string} props.name 
 * @param {string} props.width 
 * @param {number} props.thickness 
 * @param {string} props.color 
 * @param {number} props.alpha 
 * @param {string} props.background
 * @returns BABYLON.GUI.Ellipse
 */
const makeWheel = ( props ) => {
    const rect = new BABYLON.GUI.Ellipse();
    rect.name = props.name;
    rect.height = props.width; // regular circle
    rect.width = props.width;
    rect.thickness = props.thickness;
    rect.color = props.color;
    rect.alpha = props.alpha;
    rect.background = props.background;
    rect.paddingLeft = '0px';
    rect.paddingRight = '0px';
    rect.paddingTop = '0px';
    rect.paddingBottom = '0px';
    rect.isPointerBlocker = true;
    return rect;
  };

const initControllerUpdate = (camera, scene) => {
    // update the camera's position based on
    // controller input
    scene.registerBeforeRender(() => {
      translateTransform = BABYLON.Vector3.TransformCoordinates(
        new BABYLON.Vector3(xAddPos / 100, 0, yAddPos / 100),
        BABYLON.Matrix.RotationY(camera.rotation.y),
      );
      camera.cameraDirection.addInPlace(translateTransform);
    });
  };

/**
 * This function intializes the player's control wheel that allows the
 * player to navigate the 3D environment
 * @param {BABYLON.FreeCamera} camera Babylon Universal Camera object
 * @param {BABYLON.Scene} scene Babylon scene
 * @param {BABYLON.GUI.AdvancedDynamicTexture} UITexture UI advanced dynamic texture element
 * @param {string} color the color of the control wheel
 * @returns An object containing the outer wheel, the inner wheel, and the puck
 */

const initControllerWheels = (camera, scene, UITexture, color) => {
    const controllerWheelContainer = makeWheel({
        name: 'wheel',
        width: '400px',
        thickness: 2,
        color: color,
        alpha: 0.5,
        background: null});
    controllerWheelContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    controllerWheelContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    controllerWheelContainer.top = bottomJoystickOffset;

    const controllerInnerWheelContainer = makeWheel({
        name: 'innerWheel',
        width: '160px',
        thickness: 4,
        color: color,
        alpha: 0.5,
        background: null});
    controllerInnerWheelContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    controllerInnerWheelContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    const controllerPuck = makeWheel({
        name: 'puck',
        width: '160px',
        thickness: 0,
        color: color,
        alpha: 0.5,
        background: color});
    controllerPuck.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    controllerPuck.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    controllerWheelContainer.onPointerDownObservable.add((coordinates) => {
        controllerPuck.isVisible = true;
        controllerPuck.left = coordinates.x - canvas.width * 0.5;
        controllerPuck.top =
            (canvas.height -
            coordinates.y -
            controllerWheelContainer._currentMeasure.height * 0.5 +
            bottomJoystickOffset) *
            -1;
        controllerWheelContainer.alpha = 0.9;
    });

    controllerWheelContainer.onPointerUpObservable.add((coordinates) => {
        // update player movement values
        xAddPos = 0;
        yAddPos = 0;
        controllerPuck.isVisible = false;
        controllerWheelContainer.alpha = 0.4;
    });

    controllerWheelContainer.onPointerMoveObservable.add((coordinates) => {
        if (controllerPuck.isVisible) {
            xAddPos = coordinates.x - canvas.width * 0.5;
            yAddPos =
            canvas.height -
            coordinates.y -
            controllerWheelContainer._currentMeasure.height * 0.5 +
            bottomJoystickOffset;
            controllerPuck.left = xAddPos;
            controllerPuck.top = yAddPos * -1.0;
        }
    });

    // assign controller relationships
    controllerWheelContainer.addControl(controllerInnerWheelContainer);
    controllerWheelContainer.addControl(controllerPuck);
    UITexture.addControl(controllerWheelContainer);
    initControllerUpdate(camera, scene);

    controllerPuck.isVisible = false; // initialize puck to be invisible
    return {
        outerWheel: controllerWheelContainer,
        innerWheel: controllerInnerWheelContainer,
        puck: controllerPuck,
    };
}

/**
 * This function initializes the player's camera, collision detection,
 * and gravity
 * @param {object} env description of the project environment variables,
 * including scene, canvas, and playerHeight
 * @param {BABYLON.Scene} env.scene BABYLON Scene
 * @param {HTMLCanvasElement} env.canvas the html canvas
 * @param {number} env.playerHeight the height of the player
 * @returns {BABYLON.FreeCamera} the player's camera object
 */
const initializePlayer = (env) => {
    const camera = new BABYLON.FreeCamera(
        'PlayerCamera',
        new BABYLON.Vector3(0, groundHeight + env.playerHeight * 2, -5),
        env.scene,
    );

    // navigation
    camera.setTarget(new BABYLON.Vector3(0, groundHeight + env.playerHeight, 0));
    camera.attachControl(env.canvas, true);
    camera.maxZ = 100000;

    // collision detection
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(1, env.playerHeight, 1);
    camera.checkCollisions = true;

    console.log("initializing controller wheels.");
    const UITexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    initControllerWheels(camera, env.scene, UITexture, 'blue');
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
    
	// url = "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/Playground/scenes/BoomBox/";
	// url = "https://raw.githubusercontent.com/caoandong/gov_museum_demo/master/asset/Models/Scene/";
	url = "https://raw.githubusercontent.com/TeleXRobotics/MuseumDemo/master/asset/Models/Scene/";
    fileName = "scene.gltf";
    const scale = 1;

	BABYLON.SceneLoader.ImportMesh("", url, fileName, scene, function (newMeshes) {
        console.log("Loaded " + newMeshes.length + " meshes.");
        // newMeshes.forEach((mesh) => {
        //     mesh.position.copyFromFloats(0, -1 * groundHeight, 0);
        //     mesh.scaling.copyFromFloats(scale,scale,scale);
        // })		
		camera.target = newMeshes[0];
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
