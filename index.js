
var turboconfig = {};

turboconfig.Identity = function(name, email, phone) {
  this.name = name;
  this.email = email;
  this.phone = phone;
}; 

var ERROR_TAG = "TurboConfigError";
var _instance = null;
var flagCallbackMap = {};
var flagValueMapForCallback = {};
const turboConfigUrl ='https://pn.pushcape.com/api/v1/';

turboconfig.initialize = function(token, environment) {
  _initialize(token, environment);
};

turboconfig.getInstance = function() {
  return _instance;
};

var _initialize = function(token, environment) {
  if (token == null || environment == null) {
    console.log("instance emptied");
    return;
  }

  _instance = new TurboConfigHelper(token, environment);

};

class TurboConfigHelper {

  constructor(token, environment) {

    this._token = token;
    this._environment = environment;
    if(StorageHelper.getSessionId(this._token, this._environment) == null) {
      StorageHelper.setSessionId(token, environment, this.generateRandomSessionId());
      StorageHelper.setUserId(this._token, this._environment, null);
        // console.log("session" + StorageHelper.getSessionId(this._token, this._environment));
      } else {
        // console.log("session" + StorageHelper.getSessionId(this._token, this._environment));
      }
      this.fetchFlags();
    }

    fetchFlags() {

      var xhr = new XMLHttpRequest();
      xhr.withCredentials = false;

      if(this._token == null)
        return;

      if(this._environment == null)
        return;

      let sessionId = StorageHelper.getSessionId(this._token, this._environment);
      if(sessionId == null)
        return;

      let helper_this = this;
      xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          // console.log("flags fetch" + this.responseText);
          StorageHelper.setFlags(helper_this._token, helper_this._environment, sessionId, this.responseText);
        }
        
      });

      let userId = StorageHelper.getUserId(this._token, this._environment);      

      xhr.open("GET", turboConfigUrl + "users/flags");
      xhr.setRequestHeader("X-Environment", this._environment);
      xhr.setRequestHeader("X-Temp-Token", sessionId);
      
      if(userId != null && userId != "null") {
        xhr.setRequestHeader("X-Identification", userId);
      }
      
      xhr.setRequestHeader("Authorization", "Bearer " + this._token);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send();
      
    }

    getBooleanFlag(key, defaultValue, callback) {

      if(typeof(callback) != "function") {
        console.log(ERROR_TAG + " callback is not a function");
        return;
      }

      flagCallbackMap[key] = flagCallbackMap[key] || [];
      flagCallbackMap[key].push(callback);

      let sessionId = StorageHelper.getSessionId(this._token, this._environment);
      let storedFlags = StorageHelper.getFlags(this._token, this._environment, sessionId);

      if(storedFlags != null) {

        let flags = storedFlags["flags"];

        let flagValue = defaultValue;
        flags.forEach((item, index) => {
          if(item.key == key) {
          // return item.value;
          flagValue = item.value
          return;
        }

      });

        flagValueMapForCallback[key] = flagValue;
        callback(flagValue);
        return;      
      }

      flagValueMapForCallback[key] = flagValue;
      callback(flagValue);
      return;

    }

    getBooleanFlagValue(key, defaultValue) {

      let sessionId = StorageHelper.getSessionId(this._token, this._environment);
      let storedFlags = StorageHelper.getFlags(this._token, this._environment, sessionId);
      
      if(storedFlags != null) {

        let flags = storedFlags["flags"];
        
        let flagValue = defaultValue;
        flags.forEach((item, index) => {
          if(item.key == key) {
          // return item.value;
          flagValue = item.value
          return flagValue;
        }

      });
        
        return flagValue;     
      } else {
        return defaultValue;
      }

    }

    sendUserProperties(userProperties) {
      var data = JSON.stringify({"user":{"metadata": userProperties}});

      let xhr = this.getSendPropertyRequestObject();

      xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          // console.log("user property set");
        }
      });

      xhr.send(data);

    }

    sendIdentity(identity) {

      var data = JSON.stringify({"user": {
        "name": identity.name,
        "email": identity.email,
        "phoneNumber": identity.phone
      }});

      let xhr = this.getSendPropertyRequestObject();

      xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
          // console.log("identity set");
        }
      });

      xhr.send(data);

    }

    setUserId(userId) {
      StorageHelper.setUserId(this._token, this._environment, userId);
      this.fetchFlags();
    }

    logout() {
      StorageHelper.setUserId(this._token, this._environment, null);
      StorageHelper.setSessionId(this._token, this._environment, this.generateRandomSessionId());
      // console.log("logout" + StorageHelper.getSessionId(this._token, this._environment));
      this.fetchFlags();
    }

    generateRandomSessionId() {
      let randomId = this._token + Date.now();
      return randomId;
    }

    getSendPropertyRequestObject() {
      let xhr = new XMLHttpRequest();
      xhr.withCredentials = false;

      if(this._token == null)
        return;

      if(this._environment == null)
        return;

      let sessionId = StorageHelper.getSessionId(this._token, this._environment);
      if(sessionId == null)
        return;

      xhr.open("PATCH", turboConfigUrl + "users");
      xhr.setRequestHeader("X-Environment", this._environment);

      let userId = StorageHelper.getUserId(this._token, this._environment);      

      if(userId != null && userId != "null") {
        xhr.setRequestHeader("X-Identification", userId);
      }

      xhr.setRequestHeader("X-Temp-Token", sessionId);
      xhr.setRequestHeader("Authorization", "Bearer " + this._token);
      xhr.setRequestHeader("Content-Type", "application/json");

      return xhr;
    }

  }

  class StorageHelper {

    static setFlags(token, environment, sessionId, value) {
      root.localStorage.setItem("turboconfig_" + token + "_" + environment + "_" + sessionId + "_" + "flags", value);
      let latestFlags = JSON.parse(value);

      for (let key in flagValueMapForCallback) {
        if (flagValueMapForCallback.hasOwnProperty(key)) {

          let flags = latestFlags["flags"];
          flags.forEach((item, index) => {

            if(item.key == key && item.value != flagValueMapForCallback[key]) {

              for (let i = 0; i < flagCallbackMap[item.key].length; i++) {
                flagCallbackMap[item.key][i](item.value);

              }

            }

          })

        }

      }

    }

    static getFlags(token, environment, sessionId) {
      let flags = window.localStorage.getItem("turboconfig_" + token + "_" + environment + "_" + sessionId + "_" + "flags");
      return JSON.parse(flags);
    }

    static setUserId(token, environment, value) {
      root.localStorage.setItem("turboconfig_" + token + "_" + environment + "_" + "userid", value);
    }

    static getUserId(token, environment) {
      let userId = root.localStorage.getItem("turboconfig_" + token + "_" + environment + "_" + "userid");
      return userId;
    }

    static getSessionId(token, environment) {
     return window.localStorage.getItem("turboconfig_" + token + "_" + environment + "_sessionId"); 
   }

   static setSessionId(token, environment, value) {
    window.localStorage.setItem("turboconfig_" + token + "_" + environment + "_sessionId", value);
  }

}

module.exports = turboconfig;