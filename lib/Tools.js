var Tools = {
  handleError: function(err) {
    var stacktrace = [];

    try {
      i.dont.exist/0;
    }
    catch(e) {
      var lines = e.stack.split('\n');
      for(var i = 0; i < lines.length; i++) stacktrace.push(lines[i]);
      stacktrace.shift();
      stacktrace.shift();
      stacktrace[0] = stacktrace[0].replace('    at ', '');
    }

    return stacktrace.join('\n') + '\nJava Error:\n' + err.stack;
  }
};

module.exports = Tools;