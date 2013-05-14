var java, GraphDatabase = require('./GraphDatabase');

function neo4j(vmOptions) {
  java = require('java');
  java.classpath.push(__dirname + '/java/geronimo-jta_1.1_spec-1.1.1.jar');
  java.classpath.push(__dirname + '/java/neo4j-kernel-1.8.2.jar');
  java.classpath.push(__dirname + '/java/neo4j-cypher-1.8.2.jar');
  java.classpath.push(__dirname + '/java/neo4j-graph-matching-1.8.2.jar');
  java.classpath.push(__dirname + '/java/neo4j-lucene-index-1.8.2.jar');
  java.classpath.push(__dirname + '/java/scala-library-2.9.1-1.jar');
  java.classpath.push(__dirname + '/java/lucene-core-3.5.0.jar');
  java.classpath.push(__dirname + '/java/concurrentlinkedhashmap-lru-1.3.1.jar');
  java.classpath.push(__dirname + '/java/neo4j-wrapper/target/neo4j-wrapper-1.0-SNAPSHOT.jar');

  if(vmOptions) {
    if(arguments.length > 1) vmOptions = arguments;
    for(var i = 0; i < vmOptions.length; i++) {
      java.options.push(vmOptions[i]);
    }
  }

  var Neo4jWrapper = java.import('de.whitefrog.Neo4jWrapper');
  this.DIRECTION = java.import('org.neo4j.graphdb.Direction');
  this.GraphDatabaseFactory = java.import('org.neo4j.graphdb.factory.GraphDatabaseFactory');
  this.ExecutionEngine = java.import('org.neo4j.cypher.javacompat.ExecutionEngine');
  this.DynamicRelationshipType = java.import('org.neo4j.graphdb.DynamicRelationshipType');
  this.neo4jWrapper = new Neo4jWrapper();
  this.newJavaInstance = java.newInstanceSync;
  this.newJavaArray = java.newArray;
  this.java = java;
}

neo4j.prototype.connect = function(dir) {
  return new GraphDatabase(this, dir);
};

module.exports = neo4j;