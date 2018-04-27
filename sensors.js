var config = require('./config');

module.exports = {
    "office" : {
      "location":"Office Sensor",
      "deviceId":config.officeSensorDeviceId,
      "readings":{  
         "frame":"office",
         "temperature":0,
         "last_temperature":0,
         "humidity":0,
         "last_humidity":0
      },
    },
    "living" : {
      "location":"Living Room Sensor",
      "deviceId":config.livingSensorDeviceId,
      "readings":{  
         "frame":"living",
         "temperature":0,
         "last_temperature":0,
         "humidity":0,
         "last_humidity":0
      },
    },
    "ben" : {
      "location":"Office Sensor",
      "deviceId":config.benSensorDeviceId,
      "readings":{  
         "frame":"ben",
         "temperature":0,
         "last_temperature":0,
         "humidity":0,
         "last_humidity":0
      },
    },
    "jordan" : {
      "location":"Office Sensor",
      "deviceId":config.jordanSensorDeviceId,
      "readings":{  
         "frame":"jordan",
         "temperature":0,
         "last_temperature":0,
         "humidity":0,
         "last_humidity":0
      },
    }
}