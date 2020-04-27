// main stuff
const canvas = document.getElementById("renderCanvas");
let playerCamera;
const loadingScreen = document.getElementById("loadingScreen");

// progress ring
const progressRingCircle = document.querySelector('.progress-ring__circle');
const progressRingCircleRadius = progressRingCircle.r.baseVal.value;
const progressRingCircleCircumference = progressRingCircleRadius * 2 * Math.PI;
progressRingCircle.style.strokeDasharray = `${progressRingCircleCircumference} ${progressRingCircleCircumference}`;
progressRingCircle.style.strokeDashoffset = `${progressRingCircleCircumference}`;

// environment
const groundHeight = 1000;
const playerHeight = 1;
const bottomJoystickOffset = -100;

// navigation
let xAddPos = 0;
let yAddPos = 0;
let translateTransform = BABYLON.Vector3.Zero();

// UI elements
let constrollerWheelContainer;
let displayPanel;
let textBlock;
let textContainer;

/* --- loading screen section start --- */
const setProgressRing = (percent) => {
    percent = (percent > 1.0) ? 1.0 : percent;
    const offset = (1.0 - percent) * progressRingCircleCircumference;
    progressRingCircle.style.strokeDashoffset = offset;
}

const displayLoadingScreen = () => {
    loadingScreen.style.display = "block";
    console.log("display loading screen ...");
}

const hideLoadingScreen = () => {
    loadingScreen.style.display = "none";
    console.log("hide loading screen ...");
}

BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = displayLoadingScreen;

BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = hideLoadingScreen;

/* --- loading screen section end --- */

/* --- environment section start --- */

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

const initCylinderEnvironment = (scene) => {
    // radius = 10000 
    const radius = 13784.7;
    const centerX = -3094.73;
    const centerZ = -1783.03;
    const height = 10 * groundHeight;
    const groundPosition = new BABYLON.Vector3(0, groundHeight, 0);
    const wallPosition = new BABYLON.Vector3(centerX, height / 2.0, centerZ);
    // create ground
    createWall(scene, groundPosition, new BABYLON.Vector3(Math.PI / 2, 0, 0), 0.0);
    // create walls
    const wall = BABYLON.MeshBuilder.CreateCylinder("wall", {height: height, diameter: radius * 2, sideOrientation: BABYLON.Mesh.BACKSIDE}, scene);
    wall.material = new BABYLON.StandardMaterial('groundMat', scene);
    wall.material.alpha = 0.0;
    wall.position = wallPosition;
    wall.checkCollisions = true;
    scene.createDefaultLight();
    initSkyBox(scene);
}

/* --- environment section end --- */

/* --- UI section start --- */

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
        // console.log(camera.position);
        translateTransform = BABYLON.Vector3.TransformCoordinates(
            new BABYLON.Vector3(xAddPos / 80, 0, yAddPos / 80),
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

/* --- UI section end --- */

/* --- player section start --- */

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
    camera.speed = 100;
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
    const wheels = initControllerWheels(env.camera, env.scene, env.AdvancedDynamicTexture, 'blue');
    constrollerWheelContainer = wheels.outerWheel;
}

/* --- player section end --- */

/**
 * Handles the event when a mesh is picked up
 * @param {BABYLON.ActionEvent} actionEvent 
 */
const handlePickUp = (actionEvent) => {
    if (!actionEvent || !actionEvent.source) return;
    const distanceThreashold = 5000;
    const distance = playerCamera.position.subtract(actionEvent.source.position).length();
    console.log(playerCamera.position.subtract(actionEvent.source.position).length());
    if (distance <= distanceThreashold) {
        if (displayPanel) {
            displayPanel.isVisible = true;
        }
        if (constrollerWheelContainer) {
            constrollerWheelContainer.isVisible = false;
        }
    }
}

var createScene = function () {
    engine.displayLoadingUI();
    var scene = new BABYLON.Scene(engine);
    const camera = initializePlayerCamera({
        scene: scene,
        canvas: canvas
    });
    mainScene = scene;
    playerCamera = camera;

    const actionManager = new BABYLON.ActionManager(scene);

    const textMeshWidth = 1200;
    const textMeshHeight = 500;
    const textMesh = BABYLON.MeshBuilder.CreatePlane(
        'textMesh',
        {
            width: textMeshWidth,
            height: textMeshHeight
        },
        scene
    );
    textMesh.position = new BABYLON.Vector3(-7214.95, groundHeight + playerHeight, -7508.475);
    textMesh.isPickable = true;
    textMesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    textMesh.actionManager = actionManager;
    actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, handlePickUp));
    
    const textMesh_Material = new BABYLON.StandardMaterial('mtextMesh_Mat', scene);
    const textMesh_DynamicTexture = new BABYLON.DynamicTexture('textMesh_DTX', {width: textMeshWidth/100 * 64, height: textMeshHeight/100 * 64}, scene);
    textMesh_Material.diffuseColor = new BABYLON.Color3(0.91, 0.929, 0.961);
    textMesh_Material.emissiveTexture = textMesh_DynamicTexture;
    textMesh.material = textMesh_Material;
    textMesh_DynamicTexture.drawText('Text', null, null, 'bold 96px Arial', 'white', null, true, true);

    const UITexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    displayPanel = new BABYLON.GUI.Rectangle();
    displayPanel.height = "80%";
    displayPanel.width = "80%";
    displayPanel.color = "white";
    displayPanel.background = "white";
    displayPanel.cornerRadius = 20;

    UITexture.addControl(displayPanel);

    const displayPanelGrid = new BABYLON.GUI.Grid();
    displayPanelGrid.width = 0.9;
    displayPanelGrid.height = 0.9;
    displayPanelGrid.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    displayPanelGrid.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    displayPanelGrid.addRowDefinition(0.1);
    displayPanelGrid.addRowDefinition(0.9);
    displayPanel.addControl(displayPanelGrid);

    const displayPanelNavGrid = new BABYLON.GUI.Grid();
    displayPanelNavGrid.width = 1;
    displayPanelNavGrid.height = "60px";
    displayPanelNavGrid.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    displayPanelNavGrid.addColumnDefinition(0.2);
    displayPanelNavGrid.addColumnDefinition(0.6);
    displayPanelNavGrid.addColumnDefinition(0.2);
    displayPanelGrid.addControl(displayPanelNavGrid, 0, 0);

    const displayPanelNavClose = BABYLON.GUI.Button.CreateImageOnlyButton("close", "icons/close.png");
    displayPanelNavClose.width = "38px";
    displayPanelNavClose.height = "38px";
    displayPanelNavClose.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    displayPanelNavClose.onPointerClickObservable.add(() => {
        displayPanel.isVisible = false;
        constrollerWheelContainer.isVisible = true;
    });
    displayPanelNavGrid.addControl(displayPanelNavClose, 0, 2);

    let displayPanelNavText = new BABYLON.GUI.TextBlock();
    displayPanelNavText.text = "党建信息";
    displayPanelNavText.color = "black";
    displayPanelNavText.fontSize = 38;
    displayPanelNavText.fontStyle = "bold";
    displayPanelNavText.paddingTop = "5%";
    displayPanelNavText.paddingBottom = "5%";
    displayPanelNavText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    displayPanelNavGrid.addControl(displayPanelNavText, 0, 1);

    textContainer = new BABYLON.GUI.ScrollViewer();
    textContainer.height = "100%";
    textContainer.width = "100%";
    textContainer.color = "white";
    textContainer.cornerRadius = 20;
    displayPanelGrid.addControl(textContainer, 1, 0);

    textBlock = new BABYLON.GUI.TextBlock();
    textBlock.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    textBlock.text = "你好";
    textBlock.color = "black";
    textBlock.fontSize = 24;
    textBlock.paddingTop = "5%";
    textBlock.paddingLeft = "30px";
    textBlock.paddingRight = "20px"
    textBlock.paddingBottom = "5%";
    textContainer.addControl(textBlock);
    
    displayPanel.isVisible = false;

	var url;
    var fileName;
    
	// url = "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/Playground/scenes/BoomBox/";
	// url = "https://raw.githubusercontent.com/caoandong/gov_museum_demo/master/asset/Models/Scene/";
	url = "https://raw.githubusercontent.com/TeleXRobotics/MuseumDemo/master/asset/Models/Scene/";
    fileName = "scene.gltf";
    
    BABYLON.SceneLoader.ImportMesh("", url, fileName, scene, function (newMeshes) {
        // onSuccess
        console.log("Loaded " + newMeshes.length + " meshes.");
        camera.target = newMeshes[0];
        initializePlayer({
            scene: scene,
            canvas: canvas,
            camera: camera,
            AdvancedDynamicTexture: UITexture
        });
        initCylinderEnvironment(scene);
        engine.hideLoadingUI();
	}, function (progressEvent) {
        // onProgress
        let loadedPercent = 0;
        if (progressEvent.lengthComputable) {
            loadedPercent = (progressEvent.loaded * 100 / progressEvent.total).toFixed();
        } else {
            var dlCount = progressEvent.loaded / (1024 * 1024);
            loadedPercent = Math.floor(dlCount * 100.0) / 100.0;
        }
        setProgressRing(loadedPercent);
    });
    return scene;
};

// here is when things actually happen ...

var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
var scene = createScene();

engine.runRenderLoop(function () {
	if (scene) {
		scene.render();
	}
});

window.addEventListener("resize", function () {
	engine.resize();
});
