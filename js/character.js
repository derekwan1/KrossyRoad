/**
 *
 * KARS
 * ----
 * Car demonstration, created by Alvin Wan (alvinwan.com)
 *
 * Step 1 -- Customize car colors
 * Step 2 -- Variable assignment to rotate car
 * Step 3 -- += notation
 * Step 4 -- If-else
 */

var Colors = {
    red:0xf25346,
    white:0xffffff,
    orange:0xf47a41,
    gold:0xcc9900,
    yellow:0xe0c921,
    lightGreen:0x60e338,
    blue:0x68c3c0,
    purple:0x6716ba,
    white:0xd8d0d1,
    brown:0x8d5626,
    pink:0xF5986E,
    brownDark:0x23190f,
};

/**
 *
 * STEP 1
 * ------
 * Customize the car colors.
 */

var bodyColor = Colors.brown;
var roofColor = Colors.brown;
var bumperColor = Colors.brownDark;
var grateColor = Colors.brownDark;
var doorColor = Colors.brown;
var handleColor = Colors.brownDark;

/********** End step 1 **********/

function init() {
    // set up the scene, the camera and the renderer
    createScene();

    // add the lights
    createLights();

    // add the objects
    createCar();

    // start a loop that will update the objects' positions
    // and render the scene on each frame
    loop();
}

/**
 *
 * RENDER
 * ------
 * Initial setup for camera, renderer, fog
 *
 * Boilerplate for scene, camera, renderer, lights taken from
 * https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
 */
var scene,
        camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
        renderer, container, car;

function createScene() {
    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera
    // and the size of the renderer.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // Create the scene
    scene = new THREE.Scene();

    // Add a fog effect to the scene; same color as the
    // background color used in the style sheet
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // Create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
        );

    // Set the position of the camera
    /*
    camera.position.x = 100;
    camera.position.z = 70;
    camera.position.y = 150;
    camera.lookAt(0, 100, 0);
    */
    camera.position.x = 0;
    camera.position.z = 0;
    camera.position.y = 500;
    camera.lookAt(0, 100, 0);
    // Create the renderer
    renderer = new THREE.WebGLRenderer({
        // Allow transparency to show the gradient background
        // we defined in the CSS
        alpha: true,

        // Activate the anti-aliasing; this is less performant,
        // but, as our project is low-poly based, it should be fine :)
        antialias: true
    });

    // Define the size of the renderer; in this case,
    // it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    // Enable shadow rendering
    renderer.shadowMap.enabled = true;

    // Add the DOM element of the renderer to the
    // container we created in the HTML
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // Listen to the screen: if the user resizes it
    // we have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

/**
 *
 * LIGHTS
 * ------
 * Utilities for applying lights in scene
 */
var hemisphereLight, shadowLight;

function createLights() {
    // A hemisphere light is a gradient colored light;
    // the first parameter is the sky color, the second parameter is the ground color,
    // the third parameter is the intensity of the light
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

    // A directional light shines from a specific direction.
    // It acts like the sun, that means that all the rays produced are parallel.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // Set the direction of the light
    shadowLight.position.set(150, 350, 350);

    // Allow shadow casting
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better,
    // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // to activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}

/**
 *
 * OBJECTS
 * -------
 * Definitions and constructors for car, fuel, tree, ground
 */
var car, fuel, ground, trees = [], collidableTrees = [], numTrees = 10,
    collidableFuels = [];

/**
 * Generic box that casts and receives shadows
 */
function createBox(dx, dy, dz, color, x, y, z, notFlatShading) {
    var geom = new THREE.BoxGeometry(dx, dy, dz);
    var mat = new THREE.MeshPhongMaterial({color:color, flatShading: notFlatShading != true});
    var box = new THREE.Mesh(geom, mat);
    box.castShadow = true;
    box.receiveShadow = true;
    box.position.set( x, y, z );
    return box;
}

/**
 * Generic cylinder that casts and receives shadows
 */
function createCylinder(radiusTop, radiusBottom, height, radialSegments, color,
                        x, y, z) {
    var geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    var mat = new THREE.MeshPhongMaterial({color:color, flatShading: true});
    var cylinder = new THREE.Mesh(geom, mat);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.position.set( x, y, z );
    return cylinder;
}

/**
 * Cylinder with rotation specific to car
 */
function createTire(radiusTop, radiusBottom, height, radialSegments, color, x, y, z) {
    var cylinder = createCylinder(radiusTop, radiusBottom, height, radialSegments, color, x, y, z);
    cylinder.rotation.x = Math.PI / 2;  // hardcoded for tires in the car below
    return cylinder;
}

function createShell(radius, widthSegments, heightSegments, phiStart, phiLength,
                    thetaStart, thetaLength, color, x, y, z, special) {
    if (special == true) { // For half-spheres
        var geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
    }
    else {
        var geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);
    }
    var material = new THREE.MeshPhongMaterial( {color:color, flatShading: true});
    material.side = THREE.DoubleSide;
    var shell = new THREE.Mesh(geometry, material);
    shell.castShadow = true;
    shell.receiveShadow = true;
    shell.position.set(x, y, z);
    return shell;
}
/**
 * Template for Car with "advanced motion" (i.e., acceleration and deceleration,
 * rotation speed as a function of speed)
 */
function Car() {

    this.mesh = new THREE.Object3D();

    //var shell = createShell(40, 20, 20, 0, 2*Math.PI, 0, Math.PI/2, Colors.brown, 0, 0, 0, true);
    //var head = createShell(15, 20, 20, 0, 0, 0, 0, Colors.lightGreen, 54, 10, 0, false);
    //var body = createBox( 80, 4, 40, Colors.lightGreen, 0, 0, 0 );
    var head = createBox(10, 20, 15, Colors.white, 0, 0, 0);
    var beak = createBox(3, 3, 5, Colors.orange, 0, 7, 10.5);
    var gobble = createBox(3, 4, 3, Colors.red, 0, 3.5, 10.5);

    var roof = createBox( 60, 30, 45, roofColor, 0, 30, 0);
    var bumper = createBox( 90, 10, 45, bumperColor, 0, -10, 0 );
    var headLightLeft = createBox( 5, 5, 5, Colors.white, 40, 5, 15 );
    var headLightRight = createBox( 5, 5, 5, Colors.white, 40, 5, -15 );
    var tailLightLeft = createBox( 5, 5, 10, Colors.red, -40, 5, 21)
    var tailLightRight = createBox( 5, 5, 10, Colors.red, -40, 5, -21)
    var grate = createBox( 5, 5, 15, grateColor, 40, 5, 0 );
    var windshield = createBox( 3, 20, 35, Colors.blue, 30, 25, 0, true );
    var rearshield = createBox( 3, 20, 35, Colors.blue, -30, 25, 0, true );
    var leftWindow = createBox( 40, 20, 3, Colors.blue, 0, 25, 22, true );
    var rightWindow = createBox( 40, 20, 3, Colors.blue, 0, 25, -22, true );
    var leftDoor = createBox( 30, 30, 3, doorColor, 10, 0, 25 );
    var rightDoor = createBox( 30, 30, 3, doorColor, 10, 0, -25 );
    var leftHandle = createBox( 10, 3, 3, handleColor, 5, 8, 27 );
    var rightHandle = createBox( 10, 3, 3, handleColor, 5, 8, -27 );
    var frontLeftTire = createTire( 10, 10, 10, 32, Colors.brownDark, 20, -12, 15 );
    var frontRightTire = createTire( 10, 10, 10, 32, Colors.brownDark, 20, -12, -15 );
    var backLeftTire = createTire( 10, 10, 10, 32, Colors.brownDark, -20, -12, 15 );
    var backRightTire = createTire( 10, 10, 10, 32, Colors.brownDark, -20, -12, -15 );


    //this.mesh.add(body);
    /* 
    this.mesh.add(roof);
    this.mesh.add(bumper);
    this.mesh.add(headLightLeft);
    this.mesh.add(headLightRight);
    this.mesh.add(tailLightLeft);
    this.mesh.add(tailLightRight);
    this.mesh.add(grate);
    this.mesh.add(windshield);
    this.mesh.add(rearshield);
    this.mesh.add(leftWindow);
    this.mesh.add(rightWindow);
    this.mesh.add(leftDoor);
    this.mesh.add(rightDoor);
    this.mesh.add(leftHandle);
    this.mesh.add(rightHandle);
    this.mesh.add(frontLeftTire);
    this.mesh.add(frontRightTire);
    this.mesh.add(backLeftTire);
    this.mesh.add(backRightTire);
    */
    this.mesh.add(head);
    this.mesh.add(beak);
    this.mesh.add(gobble);
    this.mesh.rotation.y = Math.PI;
}


function createCar() {
    car = new Car();
    car.mesh.position.y = 100;
    scene.add(car.mesh);
}

function loop(){
    /**
     *
     * STEP 2
     * ------
     * Rotate the car by a small amount. We have the old
     * rotation, `old_rotation`, and the amount that we want to rotate by
     * in `delta`. Update `new_rotation` with the new rotation.
     */
    
    /*
    var old_angle = car.mesh.rotation.y;

    // Change me
    var new_angle = old_angle + 0.02;

    car.mesh.rotation.y = new_angle;

    /**
     *
     * STEP 3
     * ------
     * Simplify your code.
     */

     /*
    car.mesh.rotation.y = old_angle

    // Change me
    car.mesh.rotation.y = car.mesh.rotation.y + 0.02
    car.mesh.rotation.y += 0.02

    /********** End step 3 **********/
    /*
    if (car.mesh.rotation.y > 2 * Math.PI) {
        car.mesh.rotation.y -= 2 * Math.PI;
    }

    halfway = Math.PI;

    /**
     *
     * STEP 4
     * ------
     * Make the car grow and shrink.
     */

    //if (new_angle < halfway) {
    //    car.mesh.scale.x += 0.01
    //    car.mesh.scale.y += 0.01
    //    car.mesh.scale.z += 0.01
    //}
    //if (new_angle >= halfway) {
    //    car.mesh.scale.x -= 0.01
    //    car.mesh.scale.y -= 0.01
    //    car.mesh.scale.z -= 0.01
    //}

    /********** End step 4 **********/

    // render the scene
    renderer.render(scene, camera);

    // call the loop function again
    requestAnimationFrame(loop);
}

// init();  // uncomment for JSFiddle, wraps code in onLoad eventListener
window.addEventListener('load', init, false);