var config = require('./config');

module.exports ={  
   "downstairs" : {  
      "location" : "Living Room Thermostat",
      "deviceId" : config.livingThermoDeviceId,
      "readings" : {  
         "frame" : "living",
         "temperature" : 0,
         "last_temperature" : 0,
         "humidity" : 0,
         "last_humidity" : 0
      },
      "settings":{  
         "frame" : "set",
         "temperature" : 0,
         "offset" : 0,
         "override" : 0,
         "shouldAverage" : 0,
         "function_frame" : "function"
      },

   },
   "upstairs" : {  
      "location" : "Upstairs Thermostat",
      "deviceId" : config.upstairsThermoDeviceId,
      "frame" : "upstairs",
      "readings" : {  
         "temperature" : 0,
         "last_temperature" : 0,
         "humidity" : 0,
         "last_humidity" : 0
      },
      "settings" : {  
         "temperature":  0,
         "offset" : 0,
         "override" : 0,
         "shouldAverage" : 0,
         "function_frame" : "function"
      },

   }
}