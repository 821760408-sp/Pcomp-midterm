//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//------------------------------------------- Variable Definitions ---------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

var smooth_vals_1 = {}, // Filtered acceleration data for sword 1 & 2
  smooth_vals_2 = {},
  jerk_vals_1 = {}, // Derivatives of acceleration data
  jerk_vals_2 = {},
  jounce_vals_1 = {}, // Derivatives of jerk data
  jounce_vals_2 = {},
  feature_vec_1 = [0, 0, 0, 0, 0, 0, 0, 0, 0], // Current feature vector
  feature_vec_2 = [0, 0, 0, 0, 0, 0, 0, 0, 0],
  prev_feature_vec_1 = [], // Previous feature vector
  prev_feature_vec_2 = [],
  euclidean_dist_1 = 0, // Euclidean distance between features
  euclidean_dist_2 = 0,
  prev_euclidean_dist_1 = 0, // Previous Euc. dist. between features
  prev_euclidean_dist_2 = 0,
  deviation_vec_1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Deviation amount of Euc. dist. between features
  deviation_vec_2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  prev_deviation_vec_1 = [],
  prev_deviation_vec_2 = [],
  stab_test_first = false, // pre-condition for detecting stabs
  serial, // Serial object cache
  port = '/dev/cu.usbmodemfa141', // Serial port used
  t_now = 0, // Time tracking vars
  t_prev = 0,
  ALPHA = 0.5, // Parameter for LPF
  c_button = {}, // Button DOM for toggling calibration
  is_calibrating = true,
  hit_timer_1 = 0,
  hit_timer_2 = 0,
  collide_timer = 0,
  swoosh_sounds = [],
  stab_sounds = [],
  unsheath_sounds = [],
  grunt_sounds = [],
  clank_sound = {},
  score_p1 = 0,
  score_p2 = 0,
  img = {},
  imgs = [],
  spec_acc_1, // Preloaded accelerometer specs in JSON (min/max values)
  spec_acc_2;
var log_once = true, // tmp values for debugging
  min_max_div = {}, // Div DOM for showing min/max values of features
  presentation_div = {};

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//---------------------------------------- preload(), setup(), draw() ------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

function preload() {
  // Image
  imgs = [
    loadImage("resources/Fight1.png"),
    loadImage("resources/Fight2.png"),
    loadImage("resources/Fight4.png"),
    loadImage("resources/Fight6.png")
  ];
  img = imgs[0];

  // Sound
  stab_sounds.push(loadSound('resources/edited_stab_1.mp3'));
  stab_sounds.push(loadSound('resources/edited_stab_2.mp3'));
  stab_sounds.push(loadSound('resources/edited_stab_common.mp3'));
  stab_sounds.push(loadSound('resources/edited_stab_common.mp3')); // same sound two copies
  swoosh_sounds.push(loadSound('resources/edited_swoosh.mp3'));
  clank_sound = loadSound('resources/edited_clank.mp3');
  // unsheath_sounds.push(loadSound('resources/unsheathed-1.mp3'));
  grunt_sounds.push(loadSound('resources/grunt-1.mp3'));
  grunt_sounds.push(loadSound('resources/grunt-1.mp3')); // same sound two copies
  for (var i = 0; i < swoosh_sounds.length; ++i) swoosh_sounds[i].playMode("restart");
  for (i = 0; i < stab_sounds.length; ++i) stab_sounds[i].playMode("restart");
  // for (i = 0; i < unsheath_sounds.length; ++i) unsheath_sounds[i].playMode("restart");
  for (i = 0; i < grunt_sounds.length; ++i) grunt_sounds[i].playMode("restart");
  clank_sound.playMode("restart");

  // JSON
  spec_acc_1 = loadJSON('resources/sword-1.json');
  spec_acc_2 = loadJSON('resources/sword-2.json');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  // Prepare DOM elements
  createCanvas(800, 600);
  // c_button = createButton('Calibrating... Press to stop!');
  c_button = createButton('Start!');
  c_button.position(800 + 20, 40);
  c_button.mouseClicked(function() {
    if (!is_calibrating) {
      // this.html("Calibrating... Press to stop!");
      this.html("Start!");
    } else {
      // this.html("Calibration stopped. Press to start calibration again!");
      this.html("Pause!");
    }
    is_calibrating = !is_calibrating;
  });
  min_max_div = createDiv("");
  min_max_div.position(displayWidth / 2, 50);
  presentation_div = createDiv(
    "Project development stages: </br>" +
    "Stage 1: Design of Interactions (concept/realization)</br>" +
    "Stage 2: Find out the min/max values of the sensor(s) used</br>" +
    "Stage 3: Store the values into JSON files</br>" +
    "Stage 4: Data processing a.k.a. motion classification problem:</br>" +
    "&nbsp;&nbsp;&nbsp;&nbsp;solution 1 - empirical</br>" +
    "&nbsp;&nbsp;&nbsp;&nbsp;solution 2 - \"g\" value statistics</br>" +
    "&nbsp;&nbsp;&nbsp;&nbsp;solution 3 - supervised learnign</br>" +
    "Stage 5: Reiteration/future improvement"); //visual...more thought-out interactions...
  presentation_div.position(displayWidth * 3 / 4, 10);

  // Initialize variables
  smooth_vals_1 = new Vals();
  smooth_vals_2 = new Vals();
  jerk_vals_1 = new Vals();
  jerk_vals_2 = new Vals();
  jounce_vals_1 = new Vals();
  jounce_vals_2 = new Vals();
  smooth_vals_1.min_x = spec_acc_1.min_acc_x;
  smooth_vals_1.max_x = spec_acc_1.max_acc_x;
  smooth_vals_1.min_y = spec_acc_1.min_acc_y;
  smooth_vals_1.max_y = spec_acc_1.max_acc_y;
  smooth_vals_1.min_z = spec_acc_1.min_acc_z;
  smooth_vals_1.max_z = spec_acc_1.max_acc_z;
  smooth_vals_2.min_x = spec_acc_2.min_acc_x;
  smooth_vals_2.max_x = spec_acc_2.max_acc_x;
  smooth_vals_2.min_y = spec_acc_2.min_acc_y;
  smooth_vals_2.max_y = spec_acc_2.max_acc_y;
  smooth_vals_2.min_z = spec_acc_2.min_acc_z;
  smooth_vals_2.max_z = spec_acc_2.max_acc_z;
  jerk_vals_1.min_x = spec_acc_1.min_jerk_x;
  jerk_vals_1.max_x = spec_acc_1.max_jerk_x;
  jerk_vals_1.min_y = spec_acc_1.min_jerk_y;
  jerk_vals_1.max_y = spec_acc_1.max_jerk_y;
  jerk_vals_1.min_z = spec_acc_1.min_jerk_z;
  jerk_vals_1.max_z = spec_acc_1.max_jerk_z;
  jerk_vals_2.min_x = spec_acc_2.min_jerk_x;
  jerk_vals_2.max_x = spec_acc_2.max_jerk_x;
  jerk_vals_2.min_y = spec_acc_2.min_jerk_y;
  jerk_vals_2.max_y = spec_acc_2.max_jerk_y;
  jerk_vals_2.min_z = spec_acc_2.min_jerk_z;
  jerk_vals_2.max_z = spec_acc_2.max_jerk_z;
  jounce_vals_1.min_x = spec_acc_1.min_jounce_x;
  jounce_vals_1.max_x = spec_acc_1.max_jounce_x;
  jounce_vals_1.min_y = spec_acc_1.min_jounce_y;
  jounce_vals_1.max_y = spec_acc_1.max_jounce_y;
  jounce_vals_1.min_z = spec_acc_1.min_jounce_z;
  jounce_vals_1.max_z = spec_acc_1.max_jounce_z;
  jounce_vals_2.min_x = spec_acc_2.min_jounce_x;
  jounce_vals_2.max_x = spec_acc_2.max_jounce_x;
  jounce_vals_2.min_y = spec_acc_2.min_jounce_y;
  jounce_vals_2.max_y = spec_acc_2.max_jounce_y;
  jounce_vals_2.min_z = spec_acc_2.min_jounce_z;
  jounce_vals_2.max_z = spec_acc_2.max_jounce_z;
  t_now = t_prev = millis();

  // Prepare serial communication
  serial = new p5.SerialPort();
  serial.on('list', function(ports) {
    for (var i = 0; i < ports.length; i++) console.log(i + " " + ports[i]);
  });
  serial.on('error', function(err) {
    console.log('Something went wrong with the serial port. ' + err);
  });
  serial.list();
  serial.open(port);
  serial.on('data', serialEvent);
}

function draw() {
  strokeWeight(10);
  textStyle(NORMAL);
  rect(5, 5, width - 10, height - 10);
  strokeWeight(5);
  fill("blue");
  rect(25, 20, width - 50, 50);
  fill("white");
  textSize(20);
  text("Sword Fight!", 235, 50);
  fill("black");
  textSize(15);
  text("Player One", 50, 100);
  fill("black");
  textSize(15);
  text("Player Two", 475, 100);
  fill("black");
  textSize(15);
  textStyle(BOLD);
  text(score_p1, 55, 120);
  fill("black");
  textSize(15);
  textStyle(BOLD);
  text(score_p2, 480, 120);
  image(img, -10, 80);
}

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

function serialEvent() {
  // Read a string from serial port until carriage return and newline
  var in_str = serial.readStringUntil('\r\n');

  // Check to see that there's actually a string there
  if (in_str.length > 0) {

    // Ignore "hello"
    if (in_str !== 'hello') {
      var sensor_readings = split(in_str, ',');

      // If there are more than four: acc_x, acc_y, acc_z, switch_state...
      if (sensor_readings.length >= 11) {

        // Read sensor data from sword 1 & 2
        // [0       , 1       , 2       , 3             , 4         , 5             ]
        // [sensor_x, sensor_y, sensor_z, switch_pressed, target_hit, swords_touched]
        var readings_sword_1 = readSensorDataForSword(1, sensor_readings);
        var readings_sword_2 = readSensorDataForSword(2, sensor_readings);

        // Update time interval between readings, in seconds
        t_now = millis();
        var t_elapsed = (t_now - t_prev) / 1000;
        t_prev = t_now;

        // Data --> LPF --> update filtered acc., jerk, and jounce vals --> normalize features
        feature_vec_1 = lowpassFilter(readings_sword_1, smooth_vals_1).
        updateXYZ(smooth_vals_1, jerk_vals_1, jounce_vals_1, t_elapsed).
        normalizeFeatureVector(smooth_vals_1, jerk_vals_1, jounce_vals_1);
        feature_vec_2 = lowpassFilter(readings_sword_2, smooth_vals_2).
        updateXYZ(smooth_vals_2, jerk_vals_2, jounce_vals_2, t_elapsed).
        normalizeFeatureVector(smooth_vals_2, jerk_vals_2, jounce_vals_2);

        // Calculate the Euclidean distance between feature vectors
        euclidean_dist_1 = distanceCurPrev(feature_vec_1, prev_feature_vec_1);
        euclidean_dist_2 = distanceCurPrev(feature_vec_2, prev_feature_vec_2);

        // Calculate the deviation along each dimension and the Euclidean distance
        // dev = (euclidean_dist - prev_euclidean_dist) / prev_euclidean_dist
        deviation_vec_1 = deviationCurPrev(feature_vec_1, prev_feature_vec_1, euclidean_dist_1, prev_euclidean_dist_1);
        deviation_vec_2 = deviationCurPrev(feature_vec_2, prev_feature_vec_2, euclidean_dist_2, prev_euclidean_dist_2);

        //--------------------------------------- DEBUG ----------------------------------------------
        // If user presses the switch, print out the values for analysis (each gesture)
        // debugPrintValues(readings_sword_1[3], 1, feature_vec_1, euclidean_dist_1, deviation_vec_1);
        // debugPrintValues(readings_sword_2[3], 2, feature_vec_2, euclidean_dist_2, deviation_vec_2);
        // debugCalibrate();
        //--------------------------------------------------------------------------------------------

        // Play stab sound effect
        playStabSound(deviation_vec_1, prev_deviation_vec_1, 1);
        playStabSound(deviation_vec_2, prev_deviation_vec_2, 2);

        // Play swing/chop sound effect
        playSwooshSound(feature_vec_1, jerk_vals_1, jounce_vals_1, euclidean_dist_1, deviation_vec_1);
        playSwooshSound(feature_vec_2, jerk_vals_2, jounce_vals_2, euclidean_dist_2, deviation_vec_2);

        // Update scores
        updateScores(readings_sword_1[4], readings_sword_2[4], readings_sword_1[5]);

        // Update cached values
        prev_feature_vec_1 = feature_vec_1;
        prev_feature_vec_2 = feature_vec_2;
        prev_euclidean_dist_1 = euclidean_dist_1;
        prev_euclidean_dist_2 = euclidean_dist_2;
        prev_deviation_vec_1 = deviation_vec_1;
        prev_deviation_vec_2 = deviation_vec_2;
      }
    }
    //Request more data
    serial.write('x');
  }
}

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//---------------------------------------------- Helper Functions ----------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

//readSensorDataForSword() returns an array of six values:
function readSensorDataForSword(_sword_num, _sensor_readings) {
  var sensor_x = (_sword_num === 1) ? _sensor_readings[0] : _sensor_readings[5]; // 0~1023
  var sensor_y = (_sword_num === 1) ? _sensor_readings[1] : _sensor_readings[6]; // 0~1023
  var sensor_z = (_sword_num === 1) ? _sensor_readings[2] : _sensor_readings[7]; // 0~1023
  var switch_pressed = (_sword_num === 1) ? _sensor_readings[3] : _sensor_readings[8]; // 0 | 1
  var target_hit = (_sword_num === 1) ? _sensor_readings[4] : _sensor_readings[9]; // 0 | 1
  var swords_touched = _sensor_readings[10];
  return [sensor_x, sensor_y, sensor_z, switch_pressed, target_hit, swords_touched];
}

function lowpassFilter(_sword_readings, _smooth_vals) {
  _smooth_vals.x = (1 - ALPHA) * _smooth_vals.prev_x + ALPHA * _sword_readings[0]; // Raw x reading from acc.
  _smooth_vals.y = (1 - ALPHA) * _smooth_vals.prev_y + ALPHA * _sword_readings[1]; // Raw y reading from acc.
  _smooth_vals.z = (1 - ALPHA) * _smooth_vals.prev_z + ALPHA * _sword_readings[2]; // Raw z reading from acc.
  return this;
}

function updateXYZ(_smooth_vals, _jerk_vals, _jounce_vals, _t_elapsed) {
  _jerk_vals.x = (_smooth_vals.x - _smooth_vals.prev_x) / _t_elapsed; // ****
  _jerk_vals.y = (_smooth_vals.y - _smooth_vals.prev_y) / _t_elapsed; // ****
  _jerk_vals.z = (_smooth_vals.z - _smooth_vals.prev_z) / _t_elapsed; // ****
  _smooth_vals.prev_x = _smooth_vals.x;
  _smooth_vals.prev_y = _smooth_vals.y;
  _smooth_vals.prev_z = _smooth_vals.z;
  _jounce_vals.x = (_jerk_vals.x - _jerk_vals.prev_x) / _t_elapsed; // *****
  _jounce_vals.y = (_jerk_vals.y - _jerk_vals.prev_y) / _t_elapsed; // *****
  _jounce_vals.z = (_jerk_vals.z - _jerk_vals.prev_z) / _t_elapsed; // *****
  _jerk_vals.prev_x = _jerk_vals.x;
  _jerk_vals.prev_y = _jerk_vals.y;
  _jerk_vals.prev_z = _jerk_vals.z;
  return this;
}

//Normalize ((min, max) to (-1, 1)) for each feature in our feature vector
function normalizeFeatureVector(_smooth_vals, _jerk_vals, _jounce_vals) {
  var _feature_vec = [
    map(_smooth_vals.x, _smooth_vals.min_x, _smooth_vals.max_x, -1, 1), // [0]: normalized filtered acceleration x
    map(_smooth_vals.y, _smooth_vals.min_y, _smooth_vals.max_y, -1, 1), // [1]: normalized filtered acceleration y
    map(_smooth_vals.z, _smooth_vals.min_z, _smooth_vals.max_z, -1, 1), // [2]: normalized filtered acceleration z
    map(_jerk_vals.x, _jerk_vals.min_x, _jerk_vals.max_x, -1, 1), // [3]: normalized jerk x
    map(_jerk_vals.y, _jerk_vals.min_y, _jerk_vals.max_y, -1, 1), // [4]: normalized jerk y
    map(_jerk_vals.z, _jerk_vals.min_z, _jerk_vals.max_z, -1, 1), // [5]: normalized jerk z
    map(_jounce_vals.x, _jounce_vals.min_x, _jounce_vals.max_x, -1, 1), // [6]: normalized jounce x
    map(_jounce_vals.y, _jounce_vals.min_y, _jounce_vals.max_y, -1, 1), // [7]: normalized jounce y
    map(_jounce_vals.z, _jounce_vals.min_z, _jounce_vals.max_z, -1, 1)  // [8]: normalized jounce z
  ]; 
  return _feature_vec;
}

// Return the Euclidean distance between the current and the prev. feature vectors
function distanceCurPrev(_feature_vec, _prev_feature_vec) {
  var _euclidean_dist = sqrt(
    sq(_feature_vec[0] - _prev_feature_vec[0]) +
    sq(_feature_vec[1] - _prev_feature_vec[1]) +
    sq(_feature_vec[2] - _prev_feature_vec[2]) +
    sq(_feature_vec[3] - _prev_feature_vec[3]) +
    sq(_feature_vec[4] - _prev_feature_vec[4]) +
    sq(_feature_vec[5] - _prev_feature_vec[5]) +
    sq(_feature_vec[6] - _prev_feature_vec[6]) +
    sq(_feature_vec[7] - _prev_feature_vec[7]) +
    sq(_feature_vec[8] - _prev_feature_vec[8]));
  return _euclidean_dist;
}

function deviationCurPrev(_feature_vec, _prev_feature_vec, _euclidean_dist, _prev_euclidean_dist) {
  var _deviation_vec = [
    abs((_feature_vec[0] - _prev_feature_vec[0]) / _prev_feature_vec[0]), // [0]: deviation in acceleration x
    abs((_feature_vec[1] - _prev_feature_vec[1]) / _prev_feature_vec[1]), // [1]: deviation in acceleration y
    abs((_feature_vec[2] - _prev_feature_vec[2]) / _prev_feature_vec[2]), // [2]: deviation in acceleration z
    abs((_feature_vec[3] - _prev_feature_vec[3]) / _prev_feature_vec[3]), // [3]: deviation in jerk x
    abs((_feature_vec[4] - _prev_feature_vec[4]) / _prev_feature_vec[4]), // [4]: deviation in jerk y
    abs((_feature_vec[5] - _prev_feature_vec[5]) / _prev_feature_vec[5]), // [5]: deviation in jerk z
    abs((_feature_vec[6] - _prev_feature_vec[6]) / _prev_feature_vec[6]), // [6]: deviation in jounce x
    abs((_feature_vec[7] - _prev_feature_vec[7]) / _prev_feature_vec[7]), // [7]: deviation in jounce y
    abs((_feature_vec[8] - _prev_feature_vec[8]) / _prev_feature_vec[8]), // [8]: deviation in jounce z
    abs((_euclidean_dist - _prev_euclidean_dist) / _prev_euclidean_dist)  // [9]: deviation in euclidean dist.
  ];
  return _deviation_vec;
}

function playStabSound(_deviation_vec, _prev_deviation_vec, _sword_num) {
  // 300% deviation in deviation in acceleration x AND 50 % in euclidean distance...before and after the moment of stab
  if (abs((_deviation_vec[0] - _prev_deviation_vec[0]) / _prev_deviation_vec[0]) > 2 &&
    abs((_deviation_vec[9] - _prev_deviation_vec[9]) / _prev_deviation_vec[9]) > 0.5) {
    if (stab_test_first === true) {
      if (random(1) > 0.5) stab_sounds[_sword_num].play();
      else stab_sounds[(_sword_num + 2) % stab_sounds.length].play();
      // stab_sounds[0].play();
    } else stab_test_first = true;
  } else stab_test_first = false;
}

function playSwooshSound(_feature_vec, _jerk_vals, _jounce_vals, _euclidean_dist, _deviation_vec) {
  // if (_deviation_vec[9] >= 0.5 && 
  // _euclidean_dist >= 0.05) { //&& 
  // (abs(_feature_vec[3]) < 0.5 && abs(_feature_vec[4]) < 0.5 && abs(_feature_vec[5]) < 0.5)) {
  if ((map(_feature_vec[3], _jerk_vals.min_x, _jerk_vals.max_x, 0, 1) > 0.25 ||
      map(_feature_vec[4], _jerk_vals.min_y, _jerk_vals.max_z, 0, 1) > 0.25 ||
      map(_feature_vec[5], _jerk_vals.min_z, _jerk_vals.max_z, 0, 1) > 0.25) &&
    (map(_feature_vec[6], _jounce_vals.min_x, _jounce_vals.max_x, 0, 1) > 0.33 ||
      map(_feature_vec[7], _jounce_vals.min_y, _jounce_vals.max_y, 0, 1) > 0.33 ||
      map(_feature_vec[8], _jounce_vals.min_z, _jounce_vals.max_z, 0, 1)))
    swoosh_sounds[0].play();
}

function updateScores(_target_hit_1, _target_hit_2, _sword_touched) {
  // Target hit code
  if (_target_hit_1 == 1 && millis() - hit_timer_1 > 1000) {
    grunt_sounds[0].play();
    ++score_p1;
    var old_img = img;
    img = imgs[floor(random(3)) + 1];
    while (img == old_img) img = imgs[floor(random(3)) + 1];
    hit_timer_1 = millis();
  }
  if (_target_hit_2 == 1 && millis() - hit_timer_2 > 1000) {
    grunt_sounds[1].play();
    ++score_p2;
    old_img = img;
    img = imgs[floor(random(3)) + 1];
    while (img == old_img) img = imgs[floor(random(3)) + 1];
    hit_timer_2 = millis();
  }

  if (_sword_touched == 1 && millis() - collide_timer > 500) {
    clank_sound.play();
    collide_timer = millis();
  }
}

// function debugPrintValues(_switch_pressed, _sword_num) {
//   if (_sword_num === 1 && _switch_pressed === 1) {
//     if (!log_once) log_once = true;
//     console.log("sword 1 acc x: " + feature_vec_1[0] + "\n" +
//       "sword 1 acc y: " + feature_vec_1[1] + "\n" +
//       "sword 1 acc z: " + feature_vec_1[2] + "\n" +
//       "sword 1 jerk x: " + feature_vec_1[3] + "\n" +
//       "sword 1 jerk y: " + feature_vec_1[4] + "\n" +
//       "sword 1 jerk z: " + feature_vec_1[5] + "\n" +
//       "sword 1 jounce x: " + feature_vec_1[6] + "\n" +
//       "sword 1 jounce y: " + feature_vec_1[7] + "\n" +
//       "sword 1 jounce z: " + feature_vec_1[8] + "\n" +
//       "EUCLIDEAN DISTANCE: " + euclidean_dist_1 + "\n" +
//       "sword 1 acc x dev: " + deviation_vec_1[0] + "\n" +
//       "sword 1 acc y dev: " + deviation_vec_1[1] + "\n" +
//       "sword 1 acc z dev: " + deviation_vec_1[2] + "\n" +
//       "sword 1 jerk x dev: " + deviation_vec_1[3] + "\n" +
//       "sword 1 jerk y dev: " + deviation_vec_1[4] + "\n" +
//       "sword 1 jerk z dev: " + deviation_vec_1[5] + "\n" +
//       "sword 1 jounce x dev: " + deviation_vec_1[6] + "\n" +
//       "sword 1 jounce y dev: " + deviation_vec_1[7] + "\n" +
//       "sword 1 jounce z dev: " + deviation_vec_1[8] + "\n" +
//       "EUCLIDEAN DEV: " + deviation_vec_1[9]);
//   } else {
//     if (log_once) {
//       console.log("done printing\n\n\n");
//       log_once = false;
//     }
//   }
//   if (_sword_num === 2 && _switch_pressed === 1) {
//     if (!log_once) log_once = true;
//     console.log("sword 2 acc x: " + feature_vec_2[0] + "\n" +
//       "sword 2 acc y: " + feature_vec_2[1] + "\n" +
//       "sword 2 acc z: " + feature_vec_2[2] + "\n" +
//       "sword 2 jerk x: " + feature_vec_2[3] + "\n" +
//       "sword 2 jerk y: " + feature_vec_2[4] + "\n" +
//       "sword 2 jerk z: " + feature_vec_2[5] + "\n" +
//       "sword 2 jounce x: " + feature_vec_2[6] + "\n" +
//       "sword 2 jounce y: " + feature_vec_2[7] + "\n" +
//       "sword 2 jounce z: " + feature_vec_2[8] + "\n" +
//       "EUCLIDEAN DISTANCE: " + euclidean_dist_2 + "\n" +
//       "sword 2 acc x dev: " + deviation_vec_2[0] + "\n" +
//       "sword 2 acc y dev: " + deviation_vec_2[1] + "\n" +
//       "sword 2 acc z dev: " + deviation_vec_2[2] + "\n" +
//       "sword 2 jerk x dev: " + deviation_vec_2[3] + "\n" +
//       "sword 2 jerk y dev: " + deviation_vec_2[4] + "\n" +
//       "sword 2 jerk z dev: " + deviation_vec_2[5] + "\n" +
//       "sword 2 jounce x dev: " + deviation_vec_2[6] + "\n" +
//       "sword 2 jounce y dev: " + deviation_vec_2[7] + "\n" +
//       "sword 2 jounce z dev: " + deviation_vec_2[8] + "\n" +
//       "EUCLIDEAN DEV: " + deviation_vec_2[9]);
//   } else {
//     if (log_once) {
//       console.log("done printing\n\n\n");
//       log_once = false;
//     }
//   }
// }

// function debugCalibrate() {
//   smooth_vals_1.updateMinMax();
//   smooth_vals_2.updateMinMax();
//   jerk_vals_1.updateMinMax();
//   jerk_vals_2.updateMinMax();
//   jounce_vals_1.updateMinMax();
//   jounce_vals_2.updateMinMax();
// }