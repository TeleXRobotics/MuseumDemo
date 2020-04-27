# Museum App Documentation

# Introduction

This is a minimal technical demo for a public museum project, powered by `Babylon.js`.

You can check out the demo [here](https://www.autoverse.cn/). (In case the embedded link doesn’t work here is the explicit link: https://www.autoverse.cn/)

The main features of this demo are

- FPS navigation around a 3D environment
- Loading 3D models and setting up the collision boundaries
- Displaying dynamic content on click

The target platform of this demo is **mobile**, and thus many features are optimized for mobile display.


# The Stack

This demo uses the following basic stack. You can setup a similar project following [the official guide](https://doc.babylonjs.com/babylon101/first) of `Babylon.js` (this guide is just excellent).

Minimal Stack:

- Front end: bare-bone html and javascript, loading `jQuery` and `Babylon.js`
- Back end: `Express`

This is the simplest possible stack I can come up with. I plan to optimize the footprint even more with `minify`.


# File Structure
    - asset // the 3D model, just put here for storage
    - public
      - icons // the pics
      - babylonScene.js // basically everything
      - index.html
    - server.js // the server
    - package.json // the goodies

Obviously, stuff in the `public/` folder will be served to the client, and everything else is behind the scene.

The server listens on `PORT = 3000` by default. Try not to change this if you can.


# Workflow

So here’s how things work on a very high level, for the front end:

- The `index.html` and `babylonServer.js` are served and initaliazed. The Babylon game engine is created using `new BABYLON.Engine(blah, blah, blah)`.
- A scene is created using `createScene()` function, which creates the player’s camera using `initializePlayerCamera()`, the action manager, the UI’s (mainly the navigation UI and text display UI), and imports the mesh using `BABYLON.SceneLoader.ImportMesh()` and the github `url` to the `asset` folder (because we cannot get a functioning CDN).
- When importing the mesh, update the progress ring in `html` using `setProgressRing()` inside the `BABYLON.SceneLoader.ImportMesh()` function.
- After the mesh is imported, hide the loading html element, and fire up the scene.
- When the user clicks on a clickable UI element, display some content.


# Navigation

The main UI component for navigation is the navigation wheel powered by the `BABYLON.GUI.AdvancedDynamicTexture` of `Babylon.js`.

The UI element has three layers: `outerWheel`, `innerWheel`, and the `puck`. The `outerWheel` is basically a container, the `innerWheel` is just cosmetics (more or less), and the `puck` is the thing that controls the player’s movement.

All the control logic is in `onPointerDownObservable` (which handles user pressing on the controller wheel) and `initControllerUpdate()` (which handles the actual update of player’s position).

Basically, moving the puck changes the `xAddPos` and `yAddPos`, and then these two values (2D vector in the player’s frame) are rotated by the player’s camera rotation to get a vector in the world frame. Then we add this vector to the player’s current position to get the update.

Right now the whole controller is kinda manual, i.e. we have to update the player’s movement ourselves. Some user say it’s clunky, and I agree. So it’d be great if you can optimize it a bit. The wheel is not necessary at all, any sensible UI for navigation is fine.


# Loading 3D Models

There are two pieces: the loading screen and the actual loading process itself.
The loading screen is basically a whole bunch of Chinese characters and a progress ring. Nothing fancy.

The loading process is one function call `BABYLON.SceneLoader.ImportMesh()` inside `createScene()`. Read [here](https://doc.babylonjs.com/how_to/load_from_any_file_type) and [here](https://doc.babylonjs.com/api/classes/babylon.sceneloader) for more information. Again the 3D model is served on github. I know, that sounds very sketchy, but hey, it works.

So how to communicate between these two pieces?
In `js`, get the progress ring html element using


    const progressRingCircle = document.querySelector('.progress-ring__circle');

Then set `progressRingCircle.style.strokeDashoffset` to appropriate values (i.e. `(1 - percent) * circumference`).



# Interaction

I just started working on this part, so not a comprehensive guide at all.
Basically, you can either create a screen-space UI that floats on your face all the time, or a world-space UI that’s basically a mesh with UI textures.

In the `createScene()` function, you can see a large block of code creating this `displayPanel`. This is basically grey text box that floats in air. When you go and click on it, you will see a white box popping up.

The way `Babylon.js` organizes the UI is kinda neat: you can create [a grid system](https://doc.babylonjs.com/how_to/gui#grid) and put everything into this grid (reminds me of `matplotlib`).


# TO DO

A lot.

- Faster content delivery so that we can deliver better models.
- Showing images and videos and animations on click.
- Go to different rooms and loading these rooms in the back.
- Special effects.
- Smooth nagivation, supporting moving and rotating at the same time.
- Animating the player camera.
- etc.

