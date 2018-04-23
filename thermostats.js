var config = require('./config');

module.exports ={  
   "downstairs" : {  
      "location" : "Living Room Thermostat",
      "deviceId" : config.livingThermoDeviceId,
      "frame" : "thermo",
      "readings" : {  
         "temperature" : 0,
         "last_temperature" : 0,
         "humidity" : 0,
         "last_humidity" : 0
      },
      "settings":{  
         "temperature" : 0,
         "offset" : 0,
         "override" : 0,
         "shouldAverage" : 0
      },

   },
   "upstairs" : {  
      "location" : "Upstairs Thermostat",
      "deviceId" : config.upstairsThermoDeviceId,
      "frame" : "thermo",
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
         "shouldAverage" : 0
      },

   }
}