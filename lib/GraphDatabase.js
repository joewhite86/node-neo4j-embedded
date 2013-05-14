var Node = require('./Node'),
    Relationship = require('./Relationship'),
    Transaction = require('./Transaction'),
    java = require('java');

java.classpath.push('lib/java/geronimo-jta_1.1_spec-1.1.1.jar');
java.classpath.push('lib/java/neo4j-kernel-1.8.2.jar');
java.classpath.push('lib/java/neo4j-cypher-1.8.2.jar');
java.classpath.push('lib/java/neo4j-graph-matching-1.8.2.jar');
java.classpath.push('lib/java/neo4j-lucene-index-1.8.2.jar');
java.classpath.push('lib/java/scala-library-2.9.1-1.jar');
java.classpath.push('lib/java/lucene-core-3.5.0.jar');
java.classpath.push('lib/java/concurrentlinkedhashmap-lru-1.3.1.jar');
java.classpath.push('lib/java/neo4j-wrapper/target/neo4j-wrapper-1.0-SNAPSHOT.jar');

var GraphDatabaseFactory = java.import('org.neo4j.graphdb.factory.GraphDatabaseFactory'),
    ExecutionEngine = java.import('org.neo4j.cypher.javacompat.ExecutionEngine');

/**
 * @class GraphDatabase
 * Main class for managing the embedded neo4j graph database.
 */
function GraphDatabase(dir) {
  'use strict';

  try {
    this.database = new GraphDatabaseFactory().newEmbeddedDatabaseSync(dir);
    this.executionEngine = new ExecutionEngine(this.database);
    this.isConnected = true;
  }
  catch(e) {
    this.isConnected = false;
    throw e;
  }
}

function mapResult(result) {
  if(result.createRelationshipTo) return new Node(java, result);
  else if(result.getStartNode) return new Relationship(java, result);
  // java collection
  else if(result.addAllSync) return result.toArraySync().map(mapResult);
  else return result;
}

/**
 * Starts a new Transaction. Throws an expection on error.
 * @return {Transaction} Started transaction.
 */
GraphDatabase.prototype.beginTx = function() {
  'use strict';

  return new Transaction(this.database.beginTxSync());
};

/**
 * Creates a new Node. Can only be called inside a transaction. Throws an exception on error.
 * @return {Node} The created node.
 */
GraphDatabase.prototype.createNode = function() {
  'use strict';

  return new Node(java, this.database.createNodeSync());
};

/**
 * Get a node by its id property. Throws an expection when not found.
 * @param {String} Id to look for.
 * @return {Node} The found node.
 */
GraphDatabase.prototype.getNodeById = function(id) {
  'use strict';

  return new Node(java, this.database.getNodeByIdSync(id));
};

/**
 * Get a relationship by its id property. Throws an exception when not found.
 * @param {String} Id to look for.
 * @return {Relationship} The found relationship.
 */
GraphDatabase.prototype.getRelationshipById = function(id) {
  'use strict';

  return new Relationship(java, this.database.getRelationshipByIdSync(id));
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

  var result = [], rowResult, row, colIter, column, value, params = java.newInstanceSync('java.util.HashMap');

  if(arguments.length === 2) cb = queryParams;
  else {
    for(var key in queryParams) {
      if(queryParams.hasOwnProperty(key)) {
        var value = queryParams[key];
        params.putSync(key, value instanceof Node? value._node: value);
      }
    }
  }
  
  // TODO: Expects Map<String, Object> as second parameter for queryParams
  this.executionEngine.execute(query, params, function(err, queryResult) {
    if(err) return cb(err);

    var iterator = queryResult.iteratorSync();

    while(iterator.hasNextSync()) {
      rowResult = {};
      row = iterator.nextSync();
      colIter = row.entrySetSync().iteratorSync();
      while(colIter.hasNextSync()) {
        column = colIter.nextSync();
        rowResult[column.getKeySync()] = mapResult(column.getValueSync());
      }
      result.push(rowResult);
    }

    cb(null, result);
  });
}

module.exports = GraphDatabase;