var errorRegex = new RegExp("Caused by: ([\\s\\S]*)", 'g');
var ErrorHandler = function(topFunction) {
  'use strict';
  
  this._err = {};
  Error.captureStackTrace(this._err, topFunction || Tools.createErrorHandler);
};
ErrorHandler.prototype.handleError = function(err, cb) {
  'use strict';

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

/**
 * @class Tools
 * Some helpers.
 */
var Tools = {
  createErrorHandler: function(topFunction) {
    'use strict';

    return new ErrorHandler(topFunction);
  },
  extendResult: function(result) {
    'use strict';

    result.contains = function(x) {
      for (var i = this.length - 1; i >= 0; i--) {
        if(this[i].getId() === x.getId()) return true;
      }
      return false;
    }
  }
};

module.exports = Tools;