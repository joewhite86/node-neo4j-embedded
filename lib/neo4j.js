var GraphDatabase = require('./GraphDatabase'),
    neo4j = {},
    java = require('java');

java.classpath.push('lib/java/geronimo-jta_1.1_spec-1.1.1.jar');
java.classpath.push('lib/java/neo4j-kernel-1.8.2.jar');

var Direction = java.import('org.neo4j.graphdb.Direction');

neo4j.connect = function(dir) {
  return new GraphDatabase(dir);
};

neo4j.DIRECTION = Direction;

module.exports = neo4j;