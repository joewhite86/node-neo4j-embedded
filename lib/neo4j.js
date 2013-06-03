var java, GraphDatabase = require('./GraphDatabase');

function init(vmOptions, classpath) {
  java = require('java');
  java.classpath.push(__dirname + '/../build/neo4j-wrapper-1.0-SNAPSHOT-jar-with-dependencies.jar');
  if(classpath) {
    for(var i = 0; i < classpath.length; i++) {
      java.classpath.push(classpath[i]);
    }
  }

  if(vmOptions) {
    if('string' === typeof vmOptions) java.options.push(vmOptions);
    else {
      for(var i = 0; i < vmOptions.length; i++) {
        java.options.push(vmOptions[i]);
      }
    }
  }

  var Neo4jWrapper = java.import('Neo4jWrapper');
  Neo4j.DIRECTION = java.import('org.neo4j.graphdb.Direction');
  this.DIRECTION = Neo4j.DIRECTION;
  this.GraphDatabaseFactory = java.import('org.neo4j.graphdb.factory.GraphDatabaseFactory');
  this.ExecutionEngine = java.import('org.neo4j.cypher.javacompat.ExecutionEngine');
  this.DynamicRelationshipType = java.import('org.neo4j.graphdb.DynamicRelationshipType');
  this.neo4jWrapper = new Neo4jWrapper();
  this.newJavaInstance = java.newInstanceSync;
  this.newJavaArray = java.newArray;
  this.java = java;
}

var Neo4j = {
  classpath: [],
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
    var neo4j = new init(this.vmOptions, this.classpath);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connect(this.databaseProperties);
  },
  connectHA: function(dir) {
    var neo4j = new init(this.vmOptions, this.classpath);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connectHA(this.haProperties);
  },
  connectHAWrapped: function(dir) {
    var neo4j = new init(this.vmOptions, this.classpath);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connectHAWrapped(this.haProperties, this.serverProperties);
  },
  connectWrapped: function(dir) {
    var neo4j = new init(this.vmOptions, this.classpath);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connectWrapped(this.databaseProperties, this.serverProperties);
  }
};

module.exports = Neo4j;