const canvas = document.getElementById("renderCanvas");
const groundHeight = 1000;
const playerHeight = 1;
const bottomJoystickOffset = -100;
let xAddPos = 0;
let yAddPos = 0;
let translateTransform = BABYLON.Vector3.Zero();
let startFadeIn = false;

const createWall = (scene, position, rotation, alpha) => {
    const wall = BABYLON.Mesh.CreatePlane('ground', 100000, scene);
    wall.material = new BABYLON.StandardMaterial('groundMat', scene);
    wall.material.alpha = alpha;
    wall.position = position;
    wall.rotation = rotation;
    wall.checkCollisions = true;
};

const initSkyBox = (scene) => {
    scene.clearColor = new BABYLON.Color3(1.0, 0.985, 0.96);
}

const initBoxEnvironment = (scene, wallPoses) => {
    scene.createDefaultLight();
    initSkyBox(scene);
    // create ground
    createWall(scene, new BABYLON.Vector3(0, groundHeight, 0), new BABYLON.Vector3(Math.PI / 2, 0, 0), 0.0);
    // create walls
    wallPoses.forEach(element => {
        createWall(scene, element.position, element.rotation, 0.0);
    });
};

// radius = 10000
const initCylinderEnvironment = (scene) => {
    const radius = 10000;
    const height = 10 * groundHeight;
    const groundPosition = new BABYLON.Vector3(0, groundHeight, 0);
    const wallPosition = new BABYLON.Vector3(0, height / 2.0, 0);
    // create ground
    createWall(scene, groundPosition, new BABYLON.Vector3(Math.PI / 2, 0, 0), 0.0);
    // create walls
    const wall = BABYLON.MeshBuilder.CreateCylinder("cone", {height: height, diameter: radius * 2, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    wall.material = new BABYLON.StandardMaterial('groundMat', scene);
    wall.material.alpha = 0;
    wall.position = wallPosition;
    wall.checkCollisions = true;
    scene.createDefaultLight();
    initSkyBox(scene);
}

const initDefaultEnvironment = (scene) => {
    // initialize a 1000 x 1000 (meters) box with four walls
    initBoxEnvironment(
        scene,
        [
            {
                position: new BABYLON.Vector3(50000, groundHeight, 0),
                rotation: new BABYLON.Vector3(0, Math.PI / 2.0, 0)
            },
            {
                position: new BABYLON.Vector3(-50000, groundHeight, 0),
                rotation: new BABYLON.Vector3(0, -Math.PI / 2.0, 0)
            },
            {
                position: new BABYLON.Vector3(0, groundHeight, 10000),
                rotation: BABYLON.Vector3.Zero()
            },
            {
                position: new BABYLON.Vector3(0, groundHeight, -10000),
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
 * This function initializes the player's camera
 * @param {object} env description of the project environment variables,
 * including scene, canvas, and playerHeight
 * @param {BABYLON.Scene} env.scene BABYLON Scene
 * @param {HTMLCanvasElement} env.canvas the html canvas
 * @returns {BABYLON.FreeCamera} the player's camera object
 */
const initializePlayerCamera = (env) => {
    const camera = new BABYLON.FreeCamera(
        'PlayerCamera',
        new BABYLON.Vector3(0, groundHeight + playerHeight * 2, -5),
        env.scene,
    );

    // navigation
    camera.setTarget(new BABYLON.Vector3(0, groundHeight + playerHeight, 0));
    camera.attachControl(env.canvas, true);
    camera.maxZ = 100000;
    return camera
}

/**
 * This function initializes the player camera's collision detection and gravity
 * @param {object} env description of the project environment variables,
 * including scene, canvas, and playerHeight
 * @param {BABYLON.Scene} env.scene BABYLON Scene
 * @param {HTMLCanvasElement} env.canvas the html canvas
 * @param {BABYLON.GUI.AdvancedDynamicTexture} env.AdvancedDynamicTexture the UI texture
 * @param {BABYLON.FreeCamera} env.camera player's camera object
 */
const initializePlayer = (env) => {
    // collision detection
    env.camera.applyGravity = true;
    env.camera.ellipsoid = new BABYLON.Vector3(1, playerHeight, 1);
    env.camera.checkCollisions = true;

    console.log("initializing controller wheels.");
    initControllerWheels(env.camera, env.scene, env.AdvancedDynamicTexture, 'blue');
}

var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    const camera = initializePlayerCamera({
        scene: scene,
        canvas: canvas
    });

    const UITexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    const backgroundRect = new BABYLON.GUI.Rectangle();
    backgroundRect.alpha = 1;
    backgroundRect.background = "White";
    UITexture.addControl(backgroundRect);
    startFadeIn = false;
    scene.registerBeforeRender(() => {
        if (startFadeIn) {
            backgroundRect.alpha -= 0.02;
            if (backgroundRect.alpha <= 0.1) {
                backgroundRect.alpha = 0.0;
                startFadeIn = false;
            }
        }
    });

    const textBlock = new BABYLON.GUI.TextBlock();
    textBlock.text = "Initalizing scene ...";
    textBlock.color = "Black";
    textBlock.fontSize = 24;
    UITexture.addControl(textBlock);
    
	var url;
    var fileName;
    
	// url = "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/Playground/scenes/BoomBox/";
	// url = "https://raw.githubusercontent.com/caoandong/gov_museum_demo/master/asset/Models/Scene/";
	url = "https://raw.githubusercontent.com/TeleXRobotics/MuseumDemo/master/asset/Models/Scene/";
    fileName = "scene.gltf";
    const scale = 1;
    
    BABYLON.SceneLoader.ImportMesh("", url, fileName, scene, function (newMeshes) {
        console.log("Loaded " + newMeshes.length + " meshes.");
		camera.target = newMeshes[0];
        initializePlayer({
            scene: scene,
            canvas: canvas,
            camera: camera,
            AdvancedDynamicTexture: UITexture
        });
        // initDefaultEnvironment(scene);
        initCylinderEnvironment(scene);
        startFadeIn = true;
        textBlock.alpha = 0;
	}, function (progressEvent) {
        textBlock.text = JSON.stringify(100 * (progressEvent.loaded / progressEvent.total).toPrecision(2)) + "%";
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
