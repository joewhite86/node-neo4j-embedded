var Node = require('./Node'),
    Relationship = require('./Relationship'),
    Transaction = require('./Transaction'),
    java = require('java');

java.classpath.push('lib/java/geronimo-jta_1.1_spec-1.1.1.jar');
java.classpath.push('lib/java/neo4j-kernel-1.8.2.jar');
java.classpath.push('lib/java/neo4j-cypher-1.8.2.jar');
java.classpath.push('lib/java/neo4j-lucene-index-1.8.2.jar');
java.classpath.push('lib/java/scala-library-2.9.1-1.jar');
java.classpath.push('lib/java/lucene-core-3.5.0.jar');
java.classpath.push('lib/java/concurrentlinkedhashmap-lru-1.3.1.jar');

var GraphDatabaseFactory = java.import('org.neo4j.graphdb.factory.GraphDatabaseFactory');

function GraphDatabase(dir) {
  'use strict';

  try {
    this.database = new GraphDatabaseFactory().newEmbeddedDatabaseSync(dir);
    this.isConnected = true;
  }
  catch(e) {
    this.isConnected = false;
    throw e;
  }
}

GraphDatabase.prototype.beginTx = function() {
  'use strict';

  return new Transaction(this.database.beginTxSync());
};

GraphDatabase.prototype.createNode = function() {
  'use strict';

  return new Node(this.database.createNodeSync());
};

GraphDatabase.prototype.getNodeById = function(id) {
  'use strict';

  return new Node(this.database.getNodeByIdSync(id));
};

GraphDatabase.prototype.getRelationshipById = function(id) {
  'use strict';

  return new Relationship(this.database.getRelationshipByIdSync(id));
};

GraphDatabase.prototype.shutdown = function() {
  'use strict';
  
  return this.database.shutdownSync();
};

module.exports = GraphDatabase;