var config = require('./config');

module.exports = {
    "office" : {
      "location":"Office Sensor",
      "deviceId":config.officeSensorDeviceId,
      "frame":"office",
      "readings":{  
         "temperature":0,
         "last_temperature":0,
         "humidity":0,
         "last_humidity":0
      },
    },
    "living" : {
      "location":"Office Sensor",
      "deviceId":config.livingSensorDeviceId,
      "frame":"living",
      "readings":{  
         "temperature":0,
         "last_temperature":0,
         "humidity":0,
         "last_humidity":0
      },
    },
    "ben" : {
      "location":"Office Sensor",
      "deviceId":config.benSensorDeviceId,
      "frame":"ben",
      "readings":{  
         "temperature":0,
         "last_temperature":0,
         "humidity":0,
         "last_humidity":0
      },
    },
    "jordan" : {
      "location":"Office Sensor",
      "deviceId":config.jordanSensorDeviceId,
      "frame":"jordan",
      "readings":{  
         "temperature":0,
         "last_temperature":0,
         "humidity":0,
         "last_humidity":0
      },
    }
}