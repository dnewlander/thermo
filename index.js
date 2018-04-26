"use strict";

//determine if we're in debug mode
const argv = process.execArgv.join();
const isDebug = argv.includes('inspect') || argv.includes('debug');

//general variables
// var weather;
// var temp;

// config stuff
var config = require('./config');
var thermostats = require('./thermostats.js');
var sensors = require('./sensors.js');

// server stuff
var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(config.serverPort, function(){
  (isDebug) && console.log('listening on *:' + config.serverPort);
});

// database stuff
const sqlite3 = require('sqlite3').verbose();
// connect to database
let db = new sqlite3.Database('/var/www/html/phpliteadmin/thermo', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
	return console.error(err.message);
  }
  (isDebug) && console.log('Connected to the "thermo" SQlite database.');
});

// file stuff
var fs = require('fs');

// cleanup stuff
var nodeCleanup = require('node-cleanup');

// particle stuff
var Particle = require('particle-api-js');
var particle;
var token;

// cron jobs
var cron = require('node-cron');

// Weather Underground stuff
var Wunderground = require('wundergroundnode');
var wunderground;

// program variables
var outsideTemp;
var outsideConditions;

var manual_offset = 0;
var manual_override = 0;
var offset_end;

var weatherIcon;

var outside = {
    location : 'Outside conditions',
    temperature : 0,
	last_temperature : 0,
    humidity : 0,
	last_humidity : 0,
    deviceId : 'na'
};

function setWeatherIcon() {
    switch(outsideConditions) {
        case 'Sunny':
            weatherIcon = 1;
            break;
        case 'Partly Sunny':
            weatherIcon = 2;
            break;
        case 'Partly Cloudy':
            weatherIcon = 3;
            break;
        case 'Cloudy':
            weatherIcon = 4;
            break;
        case 'Showers':
            weatherIcon = 5;
            break;
        case 'Rain':
            weatherIcon = 6;
            break;
        case 'T-Storms':
            weatherIcon = 7;
            break;
        case 'Snow':
            weatherIcon = 8;
            break;
    }
}

function getSetValues(row, thermostat){
 	var currentdate = new Date();
	var datetime = currentdate.getHours() + ":" + currentdate.getMinutes();
    thermostat.settings.temperature = row.set_temp;
    console.log("Set " + thermostat.location + " set temperature to " + row.set_temp);
    thermostat.settings.shouldAverage = row.Average;
	
	// manual offset/override stuff
	
	// should we turn off the manual control?
	if (((thermostat.settings.offset != 0) || (thermostat.settings.override != 0)) && (datetime >= row.end_time))
	{
			thermostat.settings.offset = 0;
			thermostat.settings.override = 0;
	}
	
	// set temperature according to manual control if any
	if (thermostat.settings.override != 0)
	{
		thermostat.settings.temperature = thermostat.settings.override;
	}
	else
	{
		// this is valid for any values of thermostat.settings.offset
		thermostat.settings.temperature = row.set_temp + thermostat.settings.offset;
	}
	
	(isDebug) && console.log('The ' + thermostat.location + ' is ' + thermostat.settings.temperature + ' at ' + datetime + ' and we ' + (thermostat.settings.shouldAverage ? 'should' : 'should not') + ' average the temperatures');
	io.emit('ddn', {"frame":thermostat.settings.thermo_frame,"thestring":thermostat.settings.temperature,"avg":thermostat.settings.shouldAverage});
}

function doLog(obj, message){
    message = (obj.readings.temperature == 0 ? `Temperature isn't set yet!` : message);
    db.run(`INSERT INTO THERMO_LOGS(DATE, LOCATION, TEMP, HUMIDITY, MESSAGE) VALUES (CURRENT_TIMESTAMP, ?, ?, ?, ?)`, [obj.location, Number(obj.readings.temperature), Number(obj.readings.humidity), message], function(err) {
        if(err) {
            return (isDebug) && console.log(err.message);
        }
        (isDebug) && console.log(`Logged current conditions from ` + obj.location);
    });
}

function doParticleLookup(obj)
{
    particle.getVariable({auth: token, deviceId: obj.deviceId, name: 'temperature'}).then(function(data) {
	  obj.readings.last_temperature = obj.readings.temperature;
      obj.readings.temperature = ((Math.abs(data.body.result - obj.temp) >= 15) && (obj.readings.temperature != 0)? obj.readings.temperature : data.body.result);
      (isDebug) && console.log('The ' + obj.location + ' temperature is ' + obj.readings.temperature);
      io.emit('ddn', {"frame": obj.frame, "thestring": obj.readings.temperature});
    }, function(err) {
      (isDebug) && console.log('An error occurred while getting attrs:', err);
      //obj.temperature = -1;
    });
      particle.getVariable({auth: token, deviceId: obj.deviceId, name: 'humidity'}).then(function(data) {
      obj.readings.last_humidity = obj.readings.humidity;
	  obj.readings.humidity = data.body.result;
      (isDebug) && console.log('The ' + obj.location + ' humidity is ' + obj.readings.humidity);
      //io.emit('ddn', {"frame": "thermo", "thestring": obj.readings.humidity});
    }, function(err) {
      (isDebug) && console.log('An error occurred while getting attrs:', err);
      //obj.humidity = -1;
    });
    doLog(obj, 'success');
}

function init() {
	//set up Set Temperature loop
	var getSetTemp = cron.schedule('*/1 * * * *', function() {
		db.serialize(() => {
		var currentdate = new Date();
		var datetime = currentdate.getHours() + ":" + currentdate.getMinutes();
		// Get set temperature for the current time
		db.get(`SELECT start_time, end_time, set_temp, heating, cooling, Average
				FROM thermo
				JOIN schedule
				ON thermo.schedule_id = schedule.schedule_id
				JOIN function
				ON thermo.function_id = function.function_id
				WHERE schedule_name = 'test'
				AND CAST(? AS TIME) BETWEEN CAST(start_time AS TIME) AND CAST(end_time AS TIME)
				ORDER BY start_time`, datetime, (err, row) => {
					if (err){
					throw err;
					}
					return row
					? getSetValues(row, thermostats['downstairs'])
					: thermostats['downstairs'].settings.temperature = 75;
			});
		});
	},
	false);
	
	// log in to Particle Cloud
	particle = new Particle();
	particle.login(config.particle_user).then(
	  function(data) {
		  token = data.body.access_token;
		  (isDebug) && console.log(token);
	  },
	  function(err) {
		  (isDebug) && console.log('Could not log in.', err);
	  }
	);
    
    // set up Thermostat temperature loop
	var getDownstairsTemp = cron.schedule('*/1 * * * *', function() {
        doParticleLookup(thermostats['downstairs']);
	},
	false);
	
	// set up Remote Temperature loop
	var getOfficeTemp = cron.schedule('*/1 * * * *', function() {
		doParticleLookup(sensors['office']);
	},
	false);
	
	// set up Weather Underground loop
	wunderground = new Wunderground(config.wundergroundKey);

	var getWeather = cron.schedule('*/5 * * * *', function() {
		(isDebug) && console.log('time to check the weather!');
		wunderground.conditions().request('87104', function(err, response) {
			var cur = response.current_observation;
			outsideConditions = cur.weather;
            setWeatherIcon();
			outsideTemp = cur.temp_f;
//			io.emit('chat message', outsideTemp);
//			io.emit('chat message', outsideConditions);
			(isDebug) && console.log('The outside temperature is ' + outsideTemp);
            (isDebug) && console.log('The current weather is: ' + outsideConditions);
            fs.writeFile("weather.log", outsideConditions + "\n", function(err) {
                if(err) {
                    return (isDebug) && console.log(err);
                }
            });
		});
	},
	false);
	
	var callback = function() {
		(isDebug) && console.log('Successfully logged in');
	};
    
    function controlThermostat(thermostat, sensor){
        var tempToUse = (thermostat.settings.shouldAverage == 1 ? (sensor.readings.temperature + thermostat.readings.temperature)/2 : sensor.readings.temperature);
        var message = sensor.location + ': ' + sensor.readings.temperature + '; ' + thermostat.location + ': ' + thermostat.readings.temperature + (thermostat.settings.shouldAverage == 1 ? '; ' + tempToUse: '');
        doLog(thermostat, message);
        (isDebug) && console.log('We are using ' + tempToUse + ' as the current temp.');
		particle.callFunction({auth: token, deviceId: thermostat.deviceId, name: 'thermo', argument: thermostat.settings.temperature + '-' + tempToUse}).then(function(data){
			(isDebug) && console.log(thermostat.location + ' Thermo function called successfully:', data);
		}, function(err) {
			(isDebug) && console.log(thermostat.location + ' An error occurred calling Thermo function:', err);
		});
		particle.callFunction({auth: token, deviceId: sensor.deviceId, name: 'remote', argument: thermostat.settings.temperature + '-' + outsideTemp + '-' + weatherIcon}).then(function(data){
			(isDebug) && console.log(sensor.location + ' Remote function called successfully:', data);
		}, function(err) {
			(isDebug) && console.log(sensor.location + ' An error occurred calling Remote function:', err);
		});
    }
	
	// set up doThermostat loop
	var doDownstairsThermostat = cron.schedule('*/1 * * * *', function(){
        controlThermostat(thermostats['downstairs'], sensors['office']);
	},
	false);
	
    getDownstairsTemp.start();
	getSetTemp.start();
	getOfficeTemp.start();
//	getWeather.start();
	doDownstairsThermostat.start();
}
io.on('connection', function(socket){
  (isDebug) && console.log('a user connected');
    io.emit('ddn', {"frame" : thermostats['downstairs'].frame,"thestring" : thermostats['downstairs'].settings.temperature, "avg":thermostats['downstairs'].settings.shouldAverage});
    io.emit('ddn', {"frame" : thermostats['downstairs'].frame, "thestring": thermostats['downstairs'].temperature});
    io.emit('ddn', {"frame" : sensors['office'].frame, "thestring" : sensors['office'].temperature});
  socket.on('chat message', function(msg){
    (isDebug) && console.log('got a message!!');
 //   io.emit('chat message', msg);
  });
  socket.on('disconnect', function(){
    (isDebug) && console.log('user disconnected');
  });
});

nodeCleanup(function (exitCode, signal) {
	db.close((err) => {
		if (err) {
		console.error(err.message);
		}
		(isDebug) && console.log('Close the database connection.');
	});
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/temp/add', function(req, res)
{
	(isDebug) && console.log('Got a request to increase temp');
	//(isDebug) && console.log(req);
	manual_offset += 4;
	(isDebug) && console.log('manual_offset is now ' + manual_offset);
	res.json({"variance":manual_offset});
});

app.get('/temp/remove', function(req, res)
{
	(isDebug) && console.log('Got a request to decrease temp');
	manual_offset -= 4;
	(isDebug) && console.log('manual_offset is now ' + manual_offset);
	res.json({"variance":manual_offset});
});

app.get('/temp/reset', function(req, res)
{
	(isDebug) && console.log('Got a request to reset temp to default');
	manual_offset = 0;
	(isDebug) && console.log('manual_offset is now ' + manual_offset);
	res.json({"variance":manual_offset});
});

app.get('/temp', function(req, res)
{
	switch (req.query.type)
	{
		case 'offset':
			manual_offset += parseInt(req.query.value);
			manual_override = 0;
			(isDebug) && console.log('manual_offset is now ' + manual_offset);
			res.json({"change":"offset", "amount":manual_offset});
			break;
		case 'override':
			manual_override = parseInt(req.query.value);
			manual_offset = 0;
			(isDebug) && console.log('manual override is now ' + manual_override);
			res.json({"change":"override", "amount":manual_override});
			break;
		case 'reset':
			manual_override = 0;
			manual_offset = 0;
			(isDebug) && console.log('reset to normal set amount');
			res.json({"change":"reset"});
			break;
        default:
			(isDebug) && console.log("I didn't understand this request: " + req.query.type);
	}
});

init();


