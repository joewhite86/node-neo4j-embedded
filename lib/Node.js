var Relationship = require('./Relationship'),
    async = require('async');

var DynamicRelationshipType, neo4jWrapper, java;

/**
 * @class Node
 * Represents a neo4j node.
 */
function Node(_java, node) {
  'use strict';

  this._node = node;
  java = _java;
  DynamicRelationshipType = java.import('org.neo4j.graphdb.DynamicRelationshipType');
  var Neo4jWrapper = java.import('de.whitefrog.Neo4jWrapper');
  neo4jWrapper = new Neo4jWrapper();
}

/**
 * Create a relationship to another node. This should only be called inside a transaction. Throws exception on error.
 * @param {Node} node Node, to which the relationship should point.
 * @param {String} relationshipType Named relationship type.
 * @return {Relationship} The created relationship.
 */
Node.prototype.createRelationshipTo = function(node, relationshipType) {
  'use strict';

  return new Relationship(java, this._node.createRelationshipToSync(node._node, DynamicRelationshipType.withNameSync(relationshipType)));
};

/**
 * Delete a node. This should only be called inside a transaction. Throws exception on error.
 */
Node.prototype.delete = function() {
  'use strict';

  return this._node.deleteSync();
};

/**
 * Get relationships from/to this node.
 * @param {Direction/String} (Optional) Can either be a direction or a reltionship type.
 * @param {Direction/String} (Optional) Either a direction or one or more relationship types.
 * @return {Array} The matching relationships.
 */
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
    relationships.push(new Relationship(java, iterator.nextSync()));
  }

  return relationships;
};

/**
 * Check if this node has a specific relationship.
 * @param {Direction/String} (Optional) Can either be a direction or a reltionship type.
 * @param {Direction/String} (Optional) Either a direction or one or more relationship types.
 * @return {Boolean} True if a relationship exists.
 */

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

/**
 * Get the id of this node.
 * @return {String} The id.
 */
Node.prototype.getId = function() {
  'use strict';

  return this._node.getIdSync().longValue;
};

/**
 * Get a property by its key.
 * @param {String} key The properties key.
 * @return {Object} The properties value.
 */
Node.prototype.getProperty = function(key) {
  'use strict';

  return this._node.getPropertySync(key);
};

/**
 * Get all properties as object.
 * @return {Object} Properties object.
 */
Node.prototype.getProperties = function() {
  'use strict';

  var that = this, i, properties = {},
      _properties = neo4jWrapper.getNodePropertiesSync(this._node);

  for(i = 0; i < _properties.length; i++) properties[_properties[i].name] = _properties[i].value;

  return properties;
};

/**
 * Add this node to an index.
 * @param {String} indexName Name of the index to use.
 * @param {String} key (Optional) Key to index.
 * @param {Object} value (Optional) Value to index.
 */
Node.prototype.index = function(indexName, key, value) {
  'use strict';

  var index = this._node.getGraphDatabaseSync().indexSync().forNodesSync(indexName);
  index.addSync(this._node, key, value);
};

/**
 * Set a properties value.
 * @param {String} key The properties key.
 * @param {Object} value Value to set for the property.
 */
Node.prototype.setProperty = function(key, value) {
  'use strict';

  this._node.setPropertySync(key, value);
};


module.exports = Node;