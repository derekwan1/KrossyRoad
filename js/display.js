/**
 *
 * KROSSY ROAD
 * ----
 * Simple game for education purposes, by Derek Wan
 *
 */

var Colors = {
    red:0xff0000,
    white:0xffffff,
    roadBlack: 0x112222,
    orange:0xf47a41,
    black: 0x000000, 
    silver: 0x999999,
    redDark: 0xb00000,
    white:0xd8d0d1,
    brown:0x59332e,
    pink:0xF5986E,
    brownDark:0x23190f,
    blue:0x68c3c0,
    green:0x669900,
    greenDark:0x496d01,
    golden:0xff9900,
    darkBlue: 0x1341c1
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
var cars = [];
var carsPerRoad = 9;
var score = 0;
/********** End step 1 **********/

function init() {
    // set up the scene, the camera and the renderer
    createScene();

    // add the lights
    createLights();

    // add the objects

    createGround();
    createCar(9, 3);
    createChicken();
    // start a loop that will update the objects' positions
    // and render the scene on each frame
    createControls();
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
    WIDTH = window.innerWidth - 325;

    // Create the scene
    scene = new THREE.Scene();

    // Add a fog effect to the scene; same color as the
    // background color used in the style sheet
    //scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

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
    
    camera.position.x = -150;
    camera.position.z = 150;
    camera.position.y = 500;
    camera.lookAt(150, 0, 125);
    /*
    camera.position.x = -50;
    camera.position.z = 100;
    camera.position.y = 30;
    
    camera.lookAt(0, 30, 0);
    */
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

/**
 * Template objects
 */
 function Chicken() {

    this.mesh = new THREE.Object3D();

    var head = createBox(20, 40, 30, Colors.white, 0, 40, 0);
    var beak = createBox(6, 6, 10, Colors.orange, 0, 50, 20);
    var gobble = createBox(6, 8, 6, Colors.red, 0, 43, 18.5);
    var hat = createBox(9, 6, 12.5, Colors.red, 0, 63, 0);
    var rightEye = createBox(4, 4, 4, Colors.black, -9, 50, 5);
    var leftEye = createBox(4, 4, 4, Colors.black, 9, 50, 5);
    var rightWing = createBox(10, 10, 30, Colors.white, -13, 30, -5);
    var leftWing = createBox(10, 10, 30, Colors.white, 13, 30, -5);

    var rightLeg = createBox(5, 28, 5, Colors.orange, -7, 15, -5);
    var leftLeg = createBox(5, 28, 5, Colors.orange, 7, 15, -5);
    var rightFoot = createBox(10, 2, 10, Colors.orange, -7, 0, -5);
    var leftFoot = createBox(10, 2, 10, Colors.orange, 7, 0, -5);

    var tail = createBox(20, 20, 10, Colors.white, 0, 30, -21);
    var tailEnd = createBox(10, 10, 5, Colors.white, 0, 30, -29);

    this.mesh.add(head);
    this.mesh.add(beak);
    this.mesh.add(gobble);
    this.mesh.add(rightEye);
    this.mesh.add(leftEye);
    this.mesh.add(hat);
    this.mesh.add(rightWing);
    this.mesh.add(leftWing);
    this.mesh.add(rightLeg);
    this.mesh.add(leftLeg);
    this.mesh.add(rightFoot);
    this.mesh.add(leftFoot);
    this.mesh.add(tail);
    this.mesh.add(tailEnd);

    this.mesh.rotation.y = -Math.PI/2;

    this.orient = function(direction) {
        if (direction.z < 0) {
            this.mesh.rotation.y = Math.PI;
        }
        if (direction.z > 0) {
            this.mesh.rotation.y = 0;
        }
        if (direction.x > 0) {
            this.mesh.rotation.y = Math.PI/2;
        }
        if (direction.x < 0) {
            this.mesh.rotation.y = -Math.PI/2;
        }
    }

    this.update = function(direction) {
        this.orient(direction);
        this.mesh.position.addScaledVector(direction, 120);
    }
}

function policeCar() {

    this.mesh = new THREE.Object3D();

    var body = createBox( 100, 30, 50, Colors.black, 0, 0, 0 );
    var roof = createBox( 60, 15, 45, Colors.black, 0, 20, 0);
    var lightPlatform = createBox( 40, 5, 45, Colors.white, 10, 30, 0)
    var backLightPlatform = createBox(20, 5, 45, Colors.black, -20, 30, 0)
    var bumper = createBox( 90, 10, 45, bumperColor, 10, -10, 0 );
    var headLightLeft = createBox( 5, 5, 5, Colors.white, 50, 5, 15 );
    var headLightRight = createBox( 5, 5, 5, Colors.white, 50, 5, -15 );
    var tailLightLeft = createBox( 5, 5, 10, Colors.red, -50, 5, 21)
    var tailLightRight = createBox( 5, 5, 10, Colors.red, -50, 5, -21)
    var grate = createBox( 5, 5, 15, grateColor, 50, 5, 0 );
    var leftDoor = createBox( 30, 30, 3, Colors.silver, 0, 0, 25 );
    var rightDoor = createBox( 30, 30, 3, Colors.silver, 0, 0, -25 );
    var frontLeftTire = createTire( 10, 10, 10, 32, Colors.brownDark, 30, -12, 23 );
    var frontRightTire = createTire( 10, 10, 10, 32, Colors.brownDark, 30, -12, -23 );
    var backLeftTire = createTire( 10, 10, 10, 32, Colors.brownDark, -30, -12, 23 );
    var backRightTire = createTire( 10, 10, 10, 32, Colors.brownDark, -30, -12, -23 );
    var blueSiren = createBox(15, 5, 15, Colors.darkBlue, 15, 35, 10);
    var whiteSiren = createBox(15, 8, 5, Colors.white, 15, 35, 0);
    var redSiren = createBox(15, 11, 15, Colors.redDark, 15, 35, -10);
    var leftMirror = createBox(5, 5, 15, Colors.white, 20, 10, 23);
    var rightMirror = createBox(5, 5, 15, Colors.white, 20, 10, -23)

    this.mesh.add(body);
    this.mesh.add(roof);
    this.mesh.add(bumper);
    this.mesh.add(headLightLeft);
    this.mesh.add(headLightRight);
    this.mesh.add(tailLightLeft);
    this.mesh.add(tailLightRight);
    this.mesh.add(grate);
    this.mesh.add(leftDoor);
    this.mesh.add(rightDoor);
    this.mesh.add(frontLeftTire);
    this.mesh.add(frontRightTire);
    this.mesh.add(backLeftTire);
    this.mesh.add(backRightTire);
    this.mesh.add(lightPlatform);
    this.mesh.add(backLightPlatform);
    this.mesh.add(blueSiren);
    this.mesh.add(whiteSiren);
    this.mesh.add(redSiren);
    this.mesh.add(leftMirror);
    this.mesh.add(rightMirror);

    this.speed = -6;
    this.speedUpFactor = 1;

    this.update = function(direction) {
        if (this.mesh.rotation.y > 0) {
            this.mesh.position.addScaledVector(direction, this.speed*this.speedUpFactor);
        }
        else {
            this.mesh.position.addScaledVector(direction, -this.speed*this.speedUpFactor);
        }  
    }
}

function firstLane(currRoadNumber, lanesPerRoad) {
    // Returns the x-coordinates to place a car in the first lane of a given road
    return (Math.floor(currRoadNumber/lanesPerRoad) * 480) + 120;
}

function orientAndPlaceCars(lanesPerRoad) {
    even_or_odd = Math.floor(Math.random() * 2); // If 0, odd lanes will have + direction and faster speed. Vice versa. 
    if (even_or_odd == 0) {
        var rotation = Math.PI/2;
    }
    else {
        var rotation = -Math.PI/2;
    }

    for (var i = 0; i < cars.length; i+=1) {
        curr_car = cars[i];
        curr_car_lane = (curr_car.mesh.position.x - (480*Math.floor(i/carsPerRoad)))/120;

        if (curr_car_lane%2==1) {
            curr_car.mesh.rotation.y = rotation;
            if (even_or_odd == 0) {
                curr_car.speedUpFactor = 1.5;
            }

        }
        if (curr_car_lane%2==0) {
            curr_car.mesh.rotation.y = -rotation;
            if (even_or_odd == 1) {
                curr_car.speedUpFactor = 1.5;
            }
        }

        shift = Math.floor(Math.random() * carsPerRoad) * 200;

        if (curr_car.mesh.rotation.y > 0) {
            curr_car.mesh.position.z = 300 + shift;
        }
        if (curr_car.mesh.rotation.y < 0) {
            curr_car.mesh.position.z = -300 - shift;
        }
    }
}


function createCar(numCars, lanesPerRoad) {
    for (var i = 0; i < numCars; i+=1) {
        car = new policeCar();
        var currRoadNumber = Math.floor(i/carsPerRoad);
        var firstLaneOfThisRoad = firstLane(currRoadNumber, lanesPerRoad);

        car.mesh.position.y = 18;

        if (i >= lanesPerRoad) { // Generalized for any number of roads  
            car.mesh.position.x = firstLaneOfThisRoad + ((i%3)*120);
        } 
        else {
            car.mesh.position.x = firstLaneOfThisRoad + 120*i;  
        }
        cars.push(car);
    }
    orientAndPlaceCars(lanesPerRoad);

    for (var i = 0; i < cars.length; i+=1) {
        scene.add(cars[i].mesh);
    }
}

function createChicken() {
    chicken = new Chicken();
    scene.add(chicken.mesh);
}


function createGround() {
    ground = createBox( 250, 20, 3500, Colors.greenDark, -65, -10, -50 );
    road = createBox(360, 10, 3500, Colors.roadBlack, 240, -10, 0);
    ground2 = createBox(120, 20, 3500, Colors.greenDark, 480, -10, -150);
    road2 = createBox(360, 10, 3700, Colors.roadBlack, 720, -10, -150);
    ground3 = createBox(120, 20, 4000, Colors.greenDark, 960, -10, -150);
    //road3 = createBox(360, 10, 4200, Colors.roadBlack, 1200, -10, -200);
    //ground4 = createBox(120, 20, 4400, Colors.greenDark, 1440, -10, -200);
    //road4 = createBox(360, 10, 4600, Colors.roadBlack, 1680, -10, -200);
    for (var i = 0; i<4; i+=1) {
        for (var markerZPos = -1900; markerZPos < 1900; markerZPos+=230) {
            marker = createBox(10, 5, 100, Colors.white, 160 + (i*480), -7, markerZPos);
            scene.add(marker);
        }
        for (var markerZPos = -1900; markerZPos < 1900; markerZPos+=230) {
            marker = createBox(10, 5, 100, Colors.white, 300 + (i*480), -7, markerZPos);
            scene.add(marker);
        }
    }
    scene.add(ground);
    scene.add(road);
    scene.add(ground2);
    scene.add(road2);
    scene.add(ground3);
    //scene.add(road3);
    //scene.add(ground4);
    //scene.add(road4);
}

function checkCollisions() {
    chicken_z = chicken.mesh.position.z
    chicken_x = chicken.mesh.position.x;
    for (var i = 0; i<cars.length;i+=1) {
        car_z = cars[i].mesh.position.z;
        car_x = cars[i].mesh.position.x;
        if ((chicken_z >= car_z - 50) && (chicken_z <= car_z+50) && (car_x == chicken_x)) {
            gameOver();
        }
    }
}

function gameOver(){
    //alert("Mr. Chicken has been run over! Try again!");
    //document.location.reload(true);
    //chicken.reload(forcedReload);
}



var movingLeft = false;
var movingRight = false;
var movingForward = false;
var movingBackward = false;

function loop(){

    var chickenInitialPosition = chicken.mesh.position.x;
    var direction = new THREE.Vector3(0, 0, 1);
    var chickenDirection = new THREE.Vector3(0, 0, 0);

    // Update the chicken's position if the user is pressing keys
    if (movingLeft == true ) {
        var chickenDirection = new THREE.Vector3(0, 0, -0.2);
    }
    if (movingRight == true) {
        var chickenDirection = new THREE.Vector3(0, 0, 0.2);
    }

    chicken.update(chickenDirection);

    // Update each car's position
    for (var i = 0; i<cars.length;i+=1) {
        cars[i].update(direction);

        currRoadNumber = Math.floor(i/carsPerRoad);
        var checkDirection = cars[i].mesh.rotation.y / Math.abs(cars[i].mesh.rotation.y);
        // currRoadNumber * 200 adjusts for increasing pixel size of roads as you get farther from the origin
        if ((Math.abs(cars[i].mesh.position.z) > 800 + (currRoadNumber*200)) && checkDirection == -cars[i].mesh.position.z/Math.abs(cars[i].mesh.position.z)) {
            cars[i].mesh.position.z = -cars[i].mesh.position.z;
        }
    }

    // Check for collisions with cars
    checkCollisions();

    // Update score
    score = chicken.mesh.position.x / 120;
    document.getElementById("time").innerHTML = score;

    // Move the camera forward
    camera.position.x += 1.3;

    // render the scene
    renderer.render(scene, camera);

    // call the loop function again
    requestAnimationFrame(loop);
}

// init();  // uncomment for JSFiddle, wraps code in onLoad eventListener
var left = 37;
var right = 39;
var up = 38;
var down = 40;

function createControls() {
    var newLeft = new THREE.Vector3(0, 0, -1);
    var newRight = new THREE.Vector3(0, 0, 1);
    var newForward = new THREE.Vector3(1, 0, 0);
    var newBackward = new THREE.Vector3(-1, 0, 0);
    var stationary = new THREE.Vector3(0, 0, 0);

    document.addEventListener(
        'keydown',
        function( ev ) {
            key = ev.keyCode;

            if (key == left) {
                movingLeft = true;
                //chicken.update(newLeft);
            }
            if (key == right) {
                movingRight = true;
                //chicken.update(newRight);
            }
            if (key == up) {
                chicken.update(newForward);
            }
            if (key == down) {
                chicken.update(newBackward);
            }
        }
    );

    document.addEventListener(
        'keyup',
        function( ev ) {
            key = ev.keyCode;

            if (key == left) {
                movingLeft = false;
                //chicken.update(stationary);
            }
            if (key == right) {
                movingRight = false;
                //chicken.update(stationary);
            }
            if (key == up) {
                chicken.update(stationary);
            }
            if (key == down) {
                chicken.update(stationary);
            }
        }
    );
}
window.addEventListener('load', init, false);