
var turboconfig = {};

var turboconfig.Identity = function(name, email, phone) {
  this.name = name;
  this.email = email;
  this.phone = phone;
}; 

var _instance = null;
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
      console.log("session" + StorageHelper.getSessionId(this._token, this._environment));
    } else {
      console.log("session" + StorageHelper.getSessionId(this._token, this._environment));
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
        console.log("flags fetch" + this.responseText);
        StorageHelper.setFlags(helper_this._token, helper_this._environment, sessionId, this.responseText);
      }

    });

    xhr.open("GET", turboConfigUrl + "users/flags");
    xhr.setRequestHeader("X-Environment", this._environment);
    xhr.setRequestHeader("X-Temp-Token", sessionId);
    xhr.setRequestHeader("Authorization", "Bearer " + this._token);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
  }

  getBooleanFlag(key, defaultValue, callback) {

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
      callback(flagValue);
      return;      
    }

    callback(flagValue);
    return;

  }

  sendUserProperties(userProperties) {
    var data = JSON.stringify({"user":{"metadata": userProperties}});

    let xhr = this.getSendPropertyRequestObject();

    xhr.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        console.log("user property set");
      }
    });

    xhr.send(data);

  }

  sendIdentity(identity) {

    var data = JSON.stringify({"user": {
      "name": identity.name,
      "email": identity.email,
      "phone": identity.phone
    }});

    let xhr = this.getSendPropertyRequestObject();

    xhr.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        console.log("identity set");
      }
    });

    xhr.send(data);

  }

  setUserId(userId) {
    this._userId = userId;

    var data = JSON.stringify({"user": {
    }});

    let xhr = this.getSendPropertyRequestObject();

    xhr.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        console.log("user id set");
      }
    });

    xhr.send(data);

  }

  logout() {
    this._userId = null;
    StorageHelper.setSessionId(this._token, this._environment, this.generateRandomSessionId());
    console.log("logout" + StorageHelper.getSessionId(this._token, this._environment));
    this.fetchFlags();
  }

  generateRandomSessionId() {
    let randomId = Date.now() + this._token;
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
    xhr.setRequestHeader("X-Identification", this._userId);
    xhr.setRequestHeader("X-Temp-Token", sessionId);
    xhr.setRequestHeader("Authorization", "Bearer " + this._token);
    xhr.setRequestHeader("Content-Type", "application/json");

    return xhr;

  }

}


class StorageHelper {

  static setFlags(token, environment, sessionId, value) {
    window.localStorage.setItem("turboconfig_" + token + "_" + environment + "_" + sessionId + "_" + "flags", value);
  }

  static getFlags(token, environment, sessionId) {
    let flags = window.localStorage.getItem("turboconfig_" + token + "_" + environment + "_" + sessionId + "_" + "flags");
    return JSON.parse(flags);
  }

  static getSessionId(token, environment) {
   return window.localStorage.getItem("turboconfig_" + token + "_" + environment + "_sessionId"); 
 }

 static setSessionId(token, environment, value) {
  window.localStorage.setItem("turboconfig_" + token + "_" + environment + "_sessionId", value);
}

}

module.exports = turboconfig;