var Relationship = require('./Relationship'),
    Tools = require('./Tools'),
    async = require('async');

var neo4j;

/**
 * @class Node
 * Represents a neo4j node.
 */
function Node(_neo4j, node) {
  'use strict';

  this._node = node;
  neo4j = _neo4j;
}

if(process.env.NODE_DEBUG === 'neo4j-embedded') {
  debug = function(msg) {
    console.log.apply(this, arguments);
  };
}
else {
  debug = function() {};
}

/**
 * Create a relationship to another node. This should only be called inside a transaction. Throws exception on error.
    @example
    var tx;
    try {
      tx = database.beginTx();
      var homer = database.createNode();
      var marge = database.createNode();
      var married = homer.createRelationshipTo(marge, 'MARRIED_WITH');
      tx.success();
    }
    catch(e) {
      tx.failure();
    }
    finally {
      tx.finish(); 
    }
 * @param {Node} node Node, to which the relationship should point.
 * @param {String} relationshipType Named relationship type.
 * @param {Object} properties (Optional) Object, defining properties for the relationship.
 * @return {Relationship} The created relationship.
 */
Node.prototype.createRelationshipTo = function(node, relationshipType, properties) {
  'use strict';

  var relationship = new Relationship(neo4j, this._node.createRelationshipToSync(node._node, neo4j.DynamicRelationshipType.withNameSync(relationshipType)));
  
  if(properties) relationship.setProperties(properties);

  return relationship;
};

/**
 * Delete a node. This should only be called inside a transaction. Throws exception on error.
 */
Node.prototype.delete = function() {
  'use strict';

  return this._node.deleteSync();
};

/**
 * Get the id of this node.
 * @return {String} The id.
 */
Node.prototype.getId = function() {
  'use strict';

  if(this.id) return this.id;

  // cache the id value, it shouldn't change ...
  this.id = this._node.getIdSync().longValue;
  return this.id;
};

/**
 * Get all properties as object.
 * @return {Object} Properties object.
 */
Node.prototype.getProperties = function() {
  'use strict';

  var properties = {},
      _properties = neo4j.neo4jWrapper.getNodePropertiesSync(this._node);

  for(var i = 0; i < _properties.length; i++) properties[_properties[i].name] = _properties[i].value;

  return properties;
};

/**
 * Get a property by its key.
 * @param {String} key The properties key.
 * @param {Object} defaultValue (Optional) A default value, if the property doesn't exist.
 * @return {Object} The properties value.
 */
Node.prototype.getProperty = function(key, defaultValue) {
  'use strict';

  try {
    return this._node.getPropertySync(key);
  }
  catch(e) {
    // throws error if property doesn't exist
    return defaultValue;
  }
};

/**
 * Get relationships from/to this node.
    @example
    var relationships = homer.getRelationships(neo4j.DIRECTION.OUTGOING, 'HATES');
    if(relationships.length > 0) {
      console.log(relationships[0].getEndNode().getProperty('name'));
    }

    > "Ned Flanders"
 * @param {Direction/String} direction (Optional) Can either be a direction or a relationship type.
 * @param {Direction/String} relationshipType (Optional) Either a direction or one or more relationship types.
 * @return {Array} The matching relationships.
 */
Node.prototype.getRelationships = function(direction, relationshipType) {
  'use strict';

  var i, iterator, relationships = [], args = Array.prototype.slice.call(arguments);
  if(args.length === 0) {
    iterator = this._node.getRelationshipsSync();
  }
  else if('string' === typeof args[0]) {
    if(!args[1] || 'string' === typeof args[1]) {
      for(i = 0; i < args.length; i++) args[i] = neo4j.DynamicRelationshipType.withNameSync(args[i]);
      iterator = this._node.getRelationshipsSync(neo4j.java.newArray('org.neo4j.graphdb.RelationshipType', args));
    }
    else {
      iterator = this._node.getRelationshipsSync(neo4j.DynamicRelationshipType.withNameSync(args[0]), args[1]);
    }
  }
  else {
    if(!args[1]) {
      iterator = this._node.getRelationshipsSync(args[0]);
    }
    else {
      for(i = 1; i < args.length; i++) args[i] = neo4j.DynamicRelationshipType.withNameSync(args[i]);
      iterator = this._node.getRelationshipsSync(args.shift(), neo4j.java.newArray('org.neo4j.graphdb.RelationshipType', args));
    }
  }
  // when the iterator is empty we receive an empty object
  if(iterator.hasNextSync) {
    while(iterator.hasNextSync()) {
      relationships.push(new Relationship(neo4j, iterator.nextSync()));
    }
  }

  Tools.extendResult(relationships);

  return relationships;
};
/**
 * Get related nodes from/to this node.
    @example
    var hatedOnes = homer.getRelationshipNodes(neo4j.DIRECTION.OUTGOING, 'HATES');
    if(hatedOnes.length > 0) {
      console.log(hatedOnes[0].getProperty('name'));
    }

    > "Ned Flanders"
 * @param {Direction/String} direction (Optional) Can either be a direction or a relationship type.
 * @param {Direction/String} relationshipType (Optional) Either a direction or one or more relationship types.
 * @return {Array} The matching related nodes.
 */
Node.prototype.getRelationshipNodes = function(direction, relationshipType) {
  'use strict';

  var nodes = [], relationships = this.getRelationships.apply(this, arguments);

  for(var i = 0; i < relationships.length; i++) {
    if(relationships[i].getStartNode().getId() === this.getId()) nodes.push(relationships[i].getEndNode());
    else nodes.push(relationships[i].getStartNode());
  }

  Tools.extendResult(nodes);

  return nodes;
};

/**
 * Check if this node has a specific property.
 * @param {String} name Name of the property to look for.
 * @return {Boolean} True if the property exists.
 */
Node.prototype.hasProperty = function(name) {
  'use strict';

  return this._node.hasPropertySync(name);
};

/**
 * Check if this node has a specific relationship.
 * @param {Direction/String} direction (Optional) Can either be a direction or a relationship type.
 * @param {Direction/String} relationshipType (Optional) Either a direction or one or more relationship types.
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
      for(i = 0; i < args.length; i++) args[i] = neo4j.DynamicRelationshipType.withNameSync(args[i]);
      return this._node.hasRelationshipSync(neo4j.java.newArray('org.neo4j.graphdb.RelationshipType', args));
    }
    else {
      return this._node.hasRelationshipSync(neo4j.DynamicRelationshipType.withNameSync(args[0]), args[1]);
    }
  }
  else {
    if(!args[1]) {
      return this._node.hasRelationshipSync(args[0]);
    }
    else {
      for(i = 1; i < args.length; i++) args[i] = neo4j.DynamicRelationshipType.withNameSync(args[i]);
      return this._node.hasRelationshipSync(args.shift(), neo4j.java.newArray('org.neo4j.graphdb.RelationshipType', args));
    }
  }
};

/**
 * @chainable
 * Add this node to an index.
 * @param {String} indexName Name of the index to use.
 * @param {String} key (Optional) Key to index.
 * @param {Object} value (Optional) Value to index.
 */
Node.prototype.index = function(indexName, key, value) {
  'use strict';

  var index = this._node.getGraphDatabaseSync().indexSync().forNodesSync(indexName);
  index.addSync(this._node, key, value);

  return this;
};

/**
 * @chainable
 * Removes this node from an index.
 * @param {String} indexName Name of the index to use.
 * @param {String} key (Optional) The key to remove.
 * @param {Object} value (Optional) The value to remove.
 */
Node.prototype.removeFromIndex = function(indexName, key, value) {
  'use strict';

  var index = this._node.getGraphDatabaseSync().indexSync().forNodesSync(indexName);
  if(!key) index.removeSync(this._node);
  else if(!value) index.removeSync(this._node, key);
  else index.removeSync(this._node, key, value);

  return this;
};

/**
 * @chainable
 * Set a properties value.
 * @param {String} key The properties key.
 * @param {Object} value Value to set for the property.
 */
Node.prototype.setProperty = function(key, value) {
  'use strict';

  this._node.setPropertySync(key, value);

  return this;
};

/**
 * @chainable
 * Set multiple property values.
 * @param {Object} map Key=>Value map of properties.
 */
Node.prototype.setProperties = function(map) {
  for(var key in map) {
    if(map.hasOwnProperty(key) && 'undefined' !== typeof map[key]) {
      this.setProperty(key, map[key]);
    }
  }

  return this;
};

module.exports = Node;