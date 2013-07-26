var GraphDatabase = require('./GraphDatabase'),
    java, jarFile = 'build/neo4j-wrapper-1.0-SNAPSHOT.jar';

function Init(vmOptions, classpath) {
  var i, fs = require('fs'), path = require('path');

  java = require('java');
  java.classpath.push(jarFile.charAt(0) === '/'? jarFile: path.join(__dirname, '..', jarFile));

  if(classpath) {
    for(i = 0; i < classpath.length; i++) {
      java.classpath.push(classpath[i]);
    }
  }

  if(vmOptions) {
    if('string' === typeof vmOptions) java.options.push(vmOptions);
    else {
      for(i = 0; i < vmOptions.length; i++) {
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
  setDatabaseProperties: function(properties) {
    this.databaseProperties = properties;
  },
  setHighAvailabilityProperties: function(properties) {
    this.haProperties = properties;
  },
  setJarFile: function(file) {
    jarFile = file;
  },
  setServerProperties: function(properties) {
    this.serverProperties = properties;
  },
  setVMOptions: function(options) {
    this.vmOptions = 'string' === typeof options ? arguments: options;
  },
  connect: function(dir, cb) {
    var neo4j = new Init(this.vmOptions, this.classpath);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connect(this.databaseProperties, cb);
  },
  connectHA: function(dir, cb) {
    var neo4j = new Init(this.vmOptions, this.classpath);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connectHA(this.haProperties, cb);
  },
  connectHAWrapped: function(dir, cb) {
    var neo4j = new Init(this.vmOptions, this.classpath);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connectHAWrapped(this.haProperties, this.serverProperties, cb);
  },
  connectWrapped: function(dir, cb) {
    var neo4j = new Init(this.vmOptions, this.classpath);
    var graphDb = new GraphDatabase(neo4j, dir);
    return graphDb.connectWrapped(this.databaseProperties, this.serverProperties, cb);
  }
};

module.exports = Neo4j;