var errorRegex = new RegExp("Caused by: ([\\s\\S]*)", 'g');
var ErrorHandler = function(topFunction) {
  this._err = {};
  Error.captureStackTrace(this._err, topFunction || Tools.createErrorHandler);
};
ErrorHandler.prototype.handleError = function(err, cb) {
  if(err) {
    if(typeof cb === 'function') {
      // handle java errors

      var match = errorRegex.exec(err.toString());
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