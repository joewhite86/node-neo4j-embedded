var java, GraphDatabase = require('./GraphDatabase');

function Neo4j(vmOptions) {
  java = require('java');
  java.classpath.push(__dirname + '/java/neo4j-wrapper/target/neo4j-wrapper-1.0-SNAPSHOT-jar-with-dependencies.jar');

  if(vmOptions) {
    if('string' === typeof vmOptions) java.options.push(vmOptions);
    else {
      for(var i = 0; i < vmOptions.length; i++) {
        java.options.push(vmOptions[i]);
      }
    }
  }

  var Neo4jWrapper = java.import('de.whitefrog.Neo4jWrapper');
  mod.DIRECTION = java.import('org.neo4j.graphdb.Direction');
  this.DIRECTION = mod.DIRECTION;
  this.GraphDatabaseFactory = java.import('org.neo4j.graphdb.factory.GraphDatabaseFactory');
  this.ExecutionEngine = java.import('org.neo4j.cypher.javacompat.ExecutionEngine');
  this.DynamicRelationshipType = java.import('org.neo4j.graphdb.DynamicRelationshipType');
  this.neo4jWrapper = new Neo4jWrapper();
  this.newJavaInstance = java.newInstanceSync;
  this.newJavaArray = java.newArray;
  this.java = java;
}

var mod = {
  connectWrapped: function(dir, vmOptions, databaseProperties, serverProperties) {
    var neo4j = new Neo4j(vmOptions);
    return new GraphDatabase(neo4j, dir, databaseProperties, serverProperties);
  },
  connect: function(dir, vmOptions, databaseProperties) {
    var neo4j = new Neo4j(vmOptions);
    return new GraphDatabase(neo4j, dir, databaseProperties, false);
  }
};

module.exports = mod;