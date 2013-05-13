var Relationship = require('./Relationship'),
    java = require('java'),
    async = require('async');

java.classpath.push('lib/java/geronimo-jta_1.1_spec-1.1.1.jar');
java.classpath.push('lib/java/neo4j-kernel-1.8.2.jar');

var DynamicRelationshipType = java.import('org.neo4j.graphdb.DynamicRelationshipType');

function Node(node) {
  'use strict';

  this._node = node;
}

Node.prototype.createRelationshipTo = function(node, relationshipType) {
  'use strict';

  return new Relationship(this._node.createRelationshipToSync(node._node, DynamicRelationshipType.withNameSync(relationshipType)));
};

Node.prototype.delete = function() {
  'use strict';

  return this._node.deleteSync();
};

Node.prototype.getRelationships = function(direction, relationshipType) {
  'use strict';

  var i, iterator, relationship, relationships = [], args = Array.prototype.slice.call(arguments);
  if(args.length === 0) {
    iterator = this._node.getRelationshipsSync();
  }
  else if('string' === typeof args[0]) {
    if(!args[1] || 'string' === typeof args[1]) {
      for(i = 0; i < args.length; i++) args[i] = DynamicRelationshipType.withNameSync(args[i]);
      iterator = this._node.getRelationshipsSync(java.newArray('org.neo4j.graphdb.RelationshipType', args));
    }
    else {
      iterator = this._node.getRelationshipsSync(DynamicRelationshipType.withNameSync(args[0]), args[1]);
    }
  }
  else {
    if(!args[1]) {
      iterator = this._node.getRelationshipsSync(args[0]);
    }
    else {
      for(i = 1; i < args.length; i++) args[i] = DynamicRelationshipType.withNameSync(args[i]);
      iterator = this._node.getRelationshipsSync(args.shift(), java.newArray('org.neo4j.graphdb.RelationshipType', args));
    }
  }
  while(iterator.hasNextSync()) {
    relationships.push(new Relationship(iterator.nextSync()));
  }

  return relationships;
};

Node.prototype.hasRelationship = function(direction, relationshipType) {
  'use strict';

  var i, args = Array.prototype.slice.call(arguments);

  if(args.length === 0) {
    return this._node.hasRelationshipSync();
  }
  else if('string' === typeof args[0]) {
    if(!args[1] || 'string' === typeof args[1]) {
      for(i = 0; i < args.length; i++) args[i] = DynamicRelationshipType.withNameSync(args[i]);
      return this._node.hasRelationshipSync(java.newArray('org.neo4j.graphdb.RelationshipType', args));
    }
    else {
      return this._node.hasRelationshipSync(DynamicRelationshipType.withNameSync(args[0]), args[1]);
    }
  }
  else {
    if(!args[1]) {
      return this._node.hasRelationshipSync(args[0]);
    }
    else {
      for(i = 1; i < args.length; i++) args[i] = DynamicRelationshipType.withNameSync(args[i]);
      return this._node.hasRelationshipSync(args.shift(), java.newArray('org.neo4j.graphdb.RelationshipType', args));
    }
  }
};

Node.prototype.getId = function() {
  'use strict';

  return this._node.getIdSync().longValue;
};

Node.prototype.getProperty = function(name) {
  'use strict';

  return this._node.getPropertySync(name);
};

Node.prototype.getProperties = function() {
  'use strict';

  var that = this,
      iterable = this._node.getPropertyKeysSync(),
      iterator = iterable.iteratorSync(),
      properties = {}, key, next = true;

  while(iterator.hasNextSync()) {
    key = iterator.nextSync();
    properties[key] = that.getProperty(key);
  }

  return properties;
};

Node.prototype.setProperty = function(name, value) {
  'use strict';

  this._node.setPropertySync(name, value);
};


module.exports = Node;