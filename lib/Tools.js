var ErrorHandler = function(topFunction) {
  this._err = {};
  Error.captureStackTrace(this._err, topFunction || Tools.handleError);
};
ErrorHandler.prototype.handleError = function(err, cb) {
  if(err) {
    if(typeof cb === 'function') {
      // handle java errors
      var match = err.toString().match(/^Caused by: (.*)$/m);
      if(match) err = match[1];
      cb(err.toString() + "\n" + this._err.stack.substr(17));
    }
    else throw err;
    return true;
  }
  else {
    return false;
  }
};

var Tools = {
  createErrorHandler: function(topFunction) {
    return new ErrorHandler(topFunction);
  },
  extendResult: function(result) {
    result.contains = function(x) {
      for (var i = this.length - 1; i >= 0; i--) {
        if(this[i].getId() === x.getId()) return true;
      }
      return false;
    }
  }
};

module.exports = Tools;