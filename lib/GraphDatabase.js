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
  debug = function(msg) {
    console.log.apply(this, arguments);
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
 * Starts a new Transaction. Throws an expection on error.
 * @return {Transaction} Started transaction.
 */
GraphDatabase.prototype.beginTx = function() {
  'use strict';

  return new Transaction(this.database.beginTxSync());
};

GraphDatabase.prototype.connect = function(properties) {
  try {
    this.database = neo4j.neo4jWrapper.connectSync(this.dir, objectToHashMap(properties));
    this.executionEngine = new neo4j.ExecutionEngine(this.database);
    this.isConnected = true;
  }
  catch(e) {
    this.isConnected = false;
    throw e;
  }
  return this;
};

GraphDatabase.prototype.connectHA = function(properties) {
  try {
    this.database = neo4j.neo4jWrapper.connectHASync(this.dir, objectToHashMap(properties));
    this.executionEngine = new neo4j.ExecutionEngine(this.database);
    this.isConnected = true;
  }
  catch(e) {
    this.isConnected = false;
    throw e;
  }
  return this;
};

GraphDatabase.prototype.connectHAWrapped = function(properties, serverProperties) {
  try {
    this.database = neo4j.neo4jWrapper.connectHAWrappedSync(this.dir, objectToHashMap(properties), objectToHashMap(serverProperties));
    this.executionEngine = new neo4j.ExecutionEngine(this.database);
    this.isConnected = true;
  }
  catch(e) {
    this.isConnected = false;
    throw e;
  }
  return this;
};

GraphDatabase.prototype.connectWrapped = function(properties, serverProperties) {
  try {
    this.database = neo4j.neo4jWrapper.connectWrappedSync(this.dir, objectToHashMap(properties), objectToHashMap(serverProperties));
    this.executionEngine = new neo4j.ExecutionEngine(this.database);
    this.isConnected = true;
  }
  catch(e) {
    this.isConnected = false;
    throw e;
  }
  return this;
};

/**
 * Creates a new Node. Can only be called inside a transaction. Throws an exception on error.
 * @return {Node} The created node.
 */
GraphDatabase.prototype.createNode = function(params) {
  'use strict';

  var node = new Node(neo4j, this.database.createNodeSync());
  if(params) node.setProperties(params);

  return node;
};

GraphDatabase.prototype.getOrCreate = function(indexName, property, value) {
  return new Node(neo4j, neo4j.neo4jWrapper.getOrCreateSync(this.database, indexName, property, value));
};

/**
 * Get a node by id. Throws an expection when not found.
 * @param {String} Id to look for.
 * @return {Node} The found node.
 */
GraphDatabase.prototype.getNodeById = function(id) {
  'use strict';

  if('string' === typeof id) id = neo4j.java.newInstanceSync("java.lang.Long", id);
  return new Node(neo4j, this.database.getNodeByIdSync(id));
};

/**
 * Get a relationship by its id property. Throws an exception when not found.
 * @param {String} Id to look for.
 * @return {Relationship} The found relationship.
 */
GraphDatabase.prototype.getRelationshipById = function(id) {
  'use strict';

  return new Relationship(neo4j, this.database.getRelationshipByIdSync(id));
};

GraphDatabase.prototype.index = function() {
  return new IndexManager(neo4j, this.database.indexSync());
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

/**
 * Shutdown the graph database. Throws an expception on error.
 */
GraphDatabase.prototype.shutdown = function() {
  'use strict';
  
  return this.database.shutdownSync();
};

/**
 * Send a cypher query to the database. This method is asynchronous.
 * @param {String} query Cypher query string.
 * @param {Object} queryParams Params object to pass with the query.
 * @param {Function} cb Callback function.
 * @param {Object} cb.err Error object, null if none.
 * @param {Array} cb.result Array containing the rows as object.
 */
GraphDatabase.prototype.query = function(query, queryParams, cb) {
  'use strict';

  var that = this, ERR = Tools.createErrorHandler(QueryBuilder.prototype.execute), rowResult = {}, columns, key, value, params = neo4j.java.newInstanceSync('java.util.HashMap');

  if(arguments.length === 2) cb = queryParams;
  else {
    for(key in queryParams) {
      if(queryParams.hasOwnProperty(key)) {
        value = queryParams[key];
        params.putSync(key, value instanceof Node? value._node: value);
      }
    }
  }
  var start = (new Date()).getTime();

  debug('sending query: %s', query);
  debug('with params: %s', JSON.stringify(params));

  neo4j.neo4jWrapper.query(this.database, query, params, function(err, queryResult) {
    if(ERR.handleError(err, cb)) return;


    var now = (new Date()).getTime(), result = [], _result = queryResult.result, rowResult;
    debug('query took: %sms', now - start);

    var columnNames = queryResult.columnNames;

    debug(_result.length + ' records found');
    debug('columns: ' + columnNames.join(', '));
    
    for(var i = 0; i < _result.length; i++) {
      columns = _result[i];
      rowResult = [];
      for(var j = 0; j < columnNames.length; j++) {
        rowResult[columnNames[j]] = that.mapResult(columns[j]);
      }
      result.push(rowResult);
    }
    debug('mapping results took: %sms', (new Date()).getTime() - now);
    cb(null, result);
  });
}

GraphDatabase.prototype.queryBuilder = function(params) {
  'use strict';

  return new QueryBuilder(this, params);
}

module.exports = GraphDatabase;