var Node = require('./Node'),
    Relationship = require('./Relationship'),
    Transaction = require('./Transaction'),
    QueryBuilder = require('./QueryBuilder'),
    IndexManager = require('./IndexManager'),
    Tools = require('./Tools'),
    debug, neo4j;

/**
 * @class GraphDatabase
 * Main class for managing the embedded neo4j graph database.
 */
function GraphDatabase(_neo4j, dir) {
  'use strict';

  neo4j = _neo4j;
  this.neo4j = neo4j;
  this.dir = dir;
}

if(process.env.NODE_DEBUG === 'neo4j-embedded') {
  console.log('neo4j-embedded debug active');
  debug = function(fn) {
    'use strict';

    fn();
  };
}
else {
  debug = function() {};
}

function objectToHashMap(obj) {
  'use strict';

  var key, map = neo4j.java.newInstanceSync('java.util.HashMap');

  if('object' === typeof obj) {
    for(key in obj) {
      if(obj.hasOwnProperty(key)) {
        map.putSync(key, obj[key]);
      }
    }
  }

  return map;
}

/**
 * Asyncronously wait for indexes to populate.
 * @param {Number} seconds Amount of seconds to wait.
 * @param {Function} cb Callback function.
 */
GraphDatabase.prototype.awaitIndexesOnline = function(seconds, cb) {
  'use strict';

  return this.database.schemaSync().awaitIndexesOnline(seconds, neo4j.TimeUnit.SECONDS, cb);
};
/**
 * Starts a new Transaction. Throws an exception on error.
 * @return {Transaction} Started transaction.
 */
GraphDatabase.prototype.beginTx = function() {
  'use strict';

  return new Transaction(this.database.beginTxSync());
};

GraphDatabase.prototype.connect = function(properties, cb) {
  'use strict';
  
  var ERR = Tools.createErrorHandler();
  
  this.isConnected = false;
  neo4j.neo4jWrapper.connect(this.dir, objectToHashMap(properties), this.onConnect(ERR, cb).bind(this));
  
  return this;
};

GraphDatabase.prototype.connectHA = function(properties, cb) {
  'use strict';
  
  var ERR = Tools.createErrorHandler();
  
  this.isConnected = false;
  neo4j.neo4jWrapper.connectHA(this.dir, objectToHashMap(properties), this.onConnect(ERR, cb).bind(this));
  
  return this;
};

GraphDatabase.prototype.connectHAWrapped = function(properties, serverProperties, cb) {
  'use strict';
  
  var ERR = Tools.createErrorHandler();
  
  this.isConnected = false;
  neo4j.neo4jWrapper.connectHAWrapped(this.dir, objectToHashMap(properties), objectToHashMap(serverProperties), this.onConnect(ERR, cb).bind(this));
  
  return this;
};

GraphDatabase.prototype.connectWrapped = function(properties, serverProperties, cb) {
  'use strict';
  
  var ERR = Tools.createErrorHandler();
  
  this.isConnected = false;
  neo4j.neo4jWrapper.connectWrapped(this.dir, objectToHashMap(properties), objectToHashMap(serverProperties), this.onConnect(ERR, cb).bind(this));

  return this;
};

GraphDatabase.prototype.createLabel = function(name, fieldName) {
  'use strict';

  var schema = this.database.schemaSync();
  schema.indexForSync(neo4j.DynamicLabel.labelSync(name)).onSync(fieldName).createSync();
};

/**
 * Creates a new Node. Can only be called inside a transaction. Throws an exception on error.
 * @param {String} label (Optional) Labels to apply to the new node, can also be a comma-separated list.
 * @param {Object} params Properties which should be applied to the node initially.
 * @return {Node} The created node.
 */
GraphDatabase.prototype.createNode = function(label, params) {
  'use strict';

  var labels = [], args = Array.prototype.slice.call(arguments);

  for(var i = 0; i < args.length; i++) {
    if(typeof args[i] === 'string') labels.push(neo4j.DynamicLabel.labelSync(args[i]));
    else if(typeof args[i] === 'object') {
      params = args[i];
      break;
    }
  }

  var node = new Node(neo4j, this.database.createNodeSync(neo4j.java.newArray('org.neo4j.graphdb.Label', labels)));
  if(params) node.setProperties(params);

  return node;
};

GraphDatabase.prototype.dropLabel = function(name) {
  'use strict';

  var indexes = this.database.schemaSync().getIndexesSync(neo4j.DynamicLabel.labelSync(name));
  for(var i = 0; i < indexes.length; i++) {
    indexes[i].dropSync();
  }
};

/**
 * Helper method to handle long values.
 * @param {Object} value String or Number to convert.
 * @returns {Object} Long object, contains the string property "longValue".
 */
GraphDatabase.prototype.getLong = function(value) {
  'use strict';

  var ERR = Tools.createErrorHandler();
  try {
    return neo4j.java.newInstanceSync('java.lang.Long', value);
  }
  catch(err) {
    throw ERR.handleError(err);
  }
};

/**
 * Get or create a node. Can only be called inside a transaction. Throws an exception on error.
 * @param {String} indexName The index for lookup.
 * @param {String} property Property name to lookup.
 * @param {Object} value Value to lookup.
 * @return {Node} The found or created node.
 */
GraphDatabase.prototype.getOrCreate = function(indexName, property, value) {
  'use strict';
  
  return new Node(neo4j, neo4j.neo4jWrapper.getOrCreateSync(this.database, indexName, property, value));
};

/**
 * Get a node by id. Throws an exception when not found.
 * @param {String} id Id to look for.
 * @return {Node} The found node.
 */
GraphDatabase.prototype.getNodeById = function(id) {
  'use strict';

  if('string' === typeof id) id = neo4j.java.newInstanceSync("java.lang.Long", id);
  return new Node(neo4j, this.database.getNodeByIdSync(id));
};

/**
 * Get a relationship by its id property. Throws an exception when not found.
 * @param {String} id Id to look for.
 * @return {Relationship} The found relationship.
 */
GraphDatabase.prototype.getRelationshipById = function(id) {
  'use strict';

  return new Relationship(neo4j, this.database.getRelationshipByIdSync(id));
};
/**
 * Get query statistics for the last query.
    @example
    {
      containsUpdates: 0,
      deletedNodes: 0,
      deletedRelationships: 1,
      constraintsAdded: 0,
      constraintsRemoved: 0,
      indexesAdded: 0,
      indexesRemoved: 0,
      labelsAdded: 0,
      labelsRemoved: 0,
      nodesCreated: 0,
      propertiesSet: 2,
      relationshipsCreated: 0
    }
 */
GraphDatabase.prototype.getQueryStatistics = function() {
  'use strict';

  return neo4j.neo4jWrapper.getQueryStatisticsSync();
};

/**
 * Get the IndexManager for this instance.
 * @return {IndexManager} IndexManager instance.
 */
GraphDatabase.prototype.index = function() {
  'use strict';
  
  return new IndexManager(neo4j, this.database.indexSync());
};

/**
 * Helper method to handle long values.
 * @param {Object} value String or Number to convert.
 * @returns {Object} Long object, contains the string property "longValue".
 */
GraphDatabase.prototype.isLong = function(value) {
  'use strict';

  try {
    neo4j.java.newInstanceSync('java.lang.Long', value);
    return true;
  }
  catch(err) {
    return false;
  }
};

GraphDatabase.prototype.mapResult = function(result) {
  'use strict';

  if(result.createRelationshipTo) return new Node(neo4j, result);
  else if(result.getStartNode) return new Relationship(neo4j, result);
  // java collection
  else if(result.addAllSync) return result.toArraySync().map(this.mapResult.bind(this));
  else if(Array.isArray(result)) return result.map(this.mapResult.bind(this));
  else return result;
};

GraphDatabase.prototype.onConnect = function(ERR, cb) {
  'use strict';
  
  var that = this;
  return function(err, database) {
    if(ERR.handleError(err, cb)) return;

    that.database = database;
    that.isConnected = true;
    cb(null, that);
  };
};

/**
 * Shutdown the graph database. Throws an exception on error.
 */
GraphDatabase.prototype.shutdown = function() {
  'use strict';
  
  return this.database.shutdownSync();
};

/**
 * Runs a function inside an transaction.
 * @param {Function} run Function to run inside the transaction.
 * @param {Object} run.err Error object, null if none.
 * @param {Boolean} run.success True if successful.
 * @param {Function} cb Callback function.
 */
GraphDatabase.prototype.transaction = function(run, cb) {
  try {
    var tx = this.beginTx();
  }
  catch(e) {
    return cb(e);
  }
  run(function(err, success) {
    if(typeof err === 'undefined') err = null;
    if(arguments.length === 0) success = true;
    else if(arguments.length === 1) success = !err;
    
    try {
      if(!err && success) tx.success(); else tx.failure();
    }
    catch(e) {
      err = e;
    }
    finally {
      tx.finish();
      if(cb) cb(err, success);
    }
  });
};

/**
 * Send a cypher query to the database. This method is asynchronous.
 * @param {String} query Cypher query string.
 * @param {Object} queryParams Params object to pass with the query.
 * @param {Function} cb Callback function.
 * @param {Object} cb.err Error object, null if none.
 * @param {Array} cb.result Array containing the rows as object.
 */
GraphDatabase.prototype.query = function(query, queryParams, cb) {
  'use strict';

  var that = this, ERR = Tools.createErrorHandler(QueryBuilder.prototype.execute), columns, key, value, params = neo4j.java.newInstanceSync('java.util.HashMap'), argLen = arguments.length;

  if(argLen === 2) cb = queryParams;
  else {
    for(key in queryParams) {
      if(queryParams.hasOwnProperty(key)) {
        value = queryParams[key];
        params.putSync(key, value instanceof Node? value._node: value);
      }
    }
  }
  var start = (new Date()).getTime();

  debug(function() {
    console.log('sending query: %s', query);
    if(argLen === 3) console.log('with params: %s', JSON.stringify(queryParams));
  });

  neo4j.neo4jWrapper.query(this.database, query, params, function(err, queryResult) {
    if(ERR.handleError(err, cb)) return;

    var now = (new Date()).getTime(), result = [], _result = queryResult.result, rowResult;
    debug(function() { console.log('query took: %sms', now - start); });

    var columnNames = queryResult.columnNames;

    debug(function() {
      console.log(_result.length + ' records found');
      console.log('columns: ' + columnNames.join(', '));
    });
    
    for(var i = 0; i < _result.length; i++) {
      columns = _result[i];
      rowResult = [];
      for(var j = 0; j < columnNames.length; j++) {
        rowResult[columnNames[j]] = that.mapResult(columns[j]);
      }
      result.push(rowResult);
    }
    debug(function() { console.log('mapping results took: %sms', (new Date()).getTime() - now); });
    cb(null, result);
  });
};

/**
 * Get a new query builder instance.
 * @param {Object} params Parameter object passed to the query builder.
 * @returns {QueryBuilder} The instantiated query builder instance.
 */
GraphDatabase.prototype.queryBuilder = function(params) {
  'use strict';

  return new QueryBuilder(this, params);
};

module.exports = GraphDatabase;