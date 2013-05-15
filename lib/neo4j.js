var java, GraphDatabase = require('./GraphDatabase');

function Neo4j(vmOptions) {
  java = require('java');
  java.classpath.push(__dirname + '/../build/neo4j-wrapper-1.0-SNAPSHOT-jar-with-dependencies.jar');

  if(vmOptions) {
    if('string' === typeof vmOptions) java.options.push(vmOptions);
    else {
      for(var i = 0; i < vmOptions.length; i++) {
        java.options.push(vmOptions[i]);
      }
    }
  }

  var Neo4jWrapper = java.import('Neo4jWrapper');
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
  setVMOptions: function(options) {
    this.vmOptions = 'string' === typeof options ? arguments: options;
  },
  setDatabaseProperties: function(properties) {
    this.databaseProperties = properties;
  },
  setServerProperties: function(properties) {
    this.serverProperties = properties;
  },
  setHighAvailabilityProperties: function(properties) {
    this.haProperties = properties;
  },
  connect: function(dir) {
    var neo4j = new Neo4j(this.vmOptions);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connect(this.databaseProperties);
  },
  connectHA: function(dir) {
    var neo4j = new Neo4j(this.vmOptions);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connectHA(this.haProperties, this.serverProperties);
  },
  connectWrapped: function(dir) {
    var neo4j = new Neo4j(this.vmOptions);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connectWrapped(this.databaseProperties, this.serverProperties);
  }
};

module.exports = mod;