var java, jarFile = 'build/neo4j-wrapper-1.0-SNAPSHOT.jar', classpath = [];

function Init(vmOptions) {
  'use strict';
  
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
  this.DynamicRelationshipType = java.import('org.neo4j.graphdb.DynamicRelationshipType');
  this.DynamicLabel = java.import('org.neo4j.graphdb.DynamicLabel');
  this.TimeUnit = java.import('java.util.concurrent.TimeUnit');
  this.neo4jWrapper = new Neo4jWrapper();
  this.java = java;
}

/**
 * @class Neo4j
 * This class will be exported via node.require.
 */
var Neo4j = {
  GraphDatabase: require('./GraphDatabase'),
  IndexManager: require('./IndexManager'),
  Node: require('./Node'),
  QueryBuilder: require('./QueryBuilder'),
  Relationship: require('./Relationship'),
  Transaction: require('./Transaction'),
  /**
   * @property DIRECTION see http://api.neo4j.org/current/org/neo4j/graphdb/Direction.html.
   */
  /**
   * @chainable
   * Set the Java VMs classpath
   * @param {Array} paths Array of paths to add to classpath.
   */
  setClasspath: function(paths) {
    'use strict';

    classpath = 'string' === typeof paths ? Array.prototype.slice.call(arguments): paths;

    return this;
  },
  /**
   * @chainable
   * Set Neo4j database properties. See neo4j.properties file.
   * @param {Object} properties Properties object.
   */
  setDatabaseProperties: function(properties) {
    'use strict';

    this.databaseProperties = properties;

    return this;
  },
  /**
   * @chainable
   * Set Neo4j HA properties. See neo4j-server.properties file.
   * @param {Object} properties Properties object.
   */
  setHighAvailabilityProperties: function(properties) {
    'use strict';

    this.haProperties = properties;

    return this;
  },
  /**
   * @chainable
   * Set the jar file to use. Should also include neo4j.
   * @param {String} file
   */
  setJarFile: function(file) {
    'use strict';

    jarFile = file;

    return this;
  },
  /**
   * @chainable
   * Set Neo4j HA properties. See neo4j-server.properties file.
   * @param {Object} properties Properties object.
   */
  setServerProperties: function(properties) {
    'use strict';

    this.serverProperties = properties;

    return this;
  },
  /**
   * @chainable
   * Set Java VM options.
   * @param {Array} options Array of options for the VM.
   */
  setVMOptions: function(options) {
    'use strict';

    this.vmOptions = 'string' === typeof options ? Array.prototype.slice.call(arguments): options;

    return this;
  },
  /**
   * Connect or create a default embedded neo4j instance.
   * @param {String} dir Directory the database lives in.
   * @param {Function} cb Callback function.
   * @param {Object} cb.err Error object, null if none.
   * @returns {GraphDatabase} neo4j database instance.
   */
  connect: function(dir, cb) {
    'use strict';

    var neo4j = new Init(this.vmOptions);
    var graphDb = new this.GraphDatabase(neo4j, dir);

    return graphDb.connect(this.databaseProperties, cb);
  },
  /**
   * Connect or create an embedded neo4j HA instance.
   * @param {String} dir Directory the database lives in.
   * @param {Function} cb Callback function.
   * @param {Object} cb.err Error object, null if none.
   * @returns {GraphDatabase} neo4j database instance.
   */
  connectHA: function(dir, cb) {
    'use strict';

    var neo4j = new Init(this.vmOptions);
    var graphDb = new this.GraphDatabase(neo4j, dir);
    
    return graphDb.connectHA(this.haProperties, cb);
  },
  /**
   * Connect or create a default embedded neo4j instance and startup the whole server stack including the REST API.
   * @param {String} dir Directory the database lives in.
   * @param {Function} cb Callback function.
   * @param {Object} cb.err Error object, null if none.
   * @returns {GraphDatabase} neo4j database instance.
   */
  connectHAWrapped: function(dir, cb) {
    'use strict';

    var neo4j = new Init(this.vmOptions);
    var graphDb = new this.GraphDatabase(neo4j, dir);

    return graphDb.connectHAWrapped(this.haProperties, this.serverProperties, cb);
  },
  /**
   * Connect or create a default embedded neo4j instance and startup the whole server stack including the REST API.
   * @param {String} dir Directory the database lives in.
   * @param {Function} cb Callback function.
   * @param {Object} cb.err Error object, null if none.
   * @returns {GraphDatabase} neo4j database instance.
   */
  connectWrapped: function(dir, cb) {
    'use strict';

    var neo4j = new Init(this.vmOptions);
    var graphDb = new this.GraphDatabase(neo4j, dir);
    
    return graphDb.connectWrapped(this.databaseProperties, this.serverProperties, cb);
  }
};

module.exports = Neo4j;