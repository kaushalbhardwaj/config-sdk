
  var turboconfig = {};

  var Identity = function(name, email, phone) {
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
      console.log("env and token set");

      localStorage.setItem("fff", "ffff");
      console.log("ffffff"+ localStorage.getItem("fff"));
    }
  }


  module.exports = turboconfig;