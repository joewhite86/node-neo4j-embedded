var Node, neo4j;

/**
 * @class Relationship
 * Wrapper for neo4j relationships.
 */
function Relationship(_neo4j, relationship) {
  'use strict';
  Node = require('./Node');
  this._rel = relationship;
  neo4j = _neo4j;
}

/**
 * Delete a relationship. This should only be called inside a transaction. Throws exception on error.
 */
Relationship.prototype.delete = function() {
  'use strict';

  return this._rel.deleteSync();
};

/**
 * Get the node the relationship points to.
 * @return {Node} End node.
 */
Relationship.prototype.getEndNode = function() {
  'use strict';

  return new Node(neo4j, this._rel.getEndNodeSync());
};

/**
 * Get the id.
 * @return {String} Id of this relationship.
 */
Relationship.prototype.getId = function() {
  'use strict';

  return this._rel.getIdSync().longValue;
};

/**
 * Get all properties.
 * @return {Object} The properties value.
 */
Relationship.prototype.getProperties = function() {
  'use strict';

  var that = this, i, properties = {},
      _properties = neo4j.neo4jWrapper.getRelationshipPropertiesSync(this._rel);

  for(i = 0; i < _properties.length; i++) properties[_properties[i].name] = _properties[i].value;

  return properties;
};

/**
 * Get a property by key.
 * @param {String} key Name of the property.
 * @return {Object} The properties value.
 */
Relationship.prototype.getProperty = function(key, defaultValue) {
  'use strict';

  try {
    return this._rel.getPropertySync(key);
  }
  catch(e) {
    // throws error if property doesn't exist
    return defaultValue;
  }
};

/**
 * Get the node the relationship starts at.
 * @return {Node} Start node.
 */
Relationship.prototype.getStartNode = function() {
  'use strict';

  return new Node(neo4j, this._rel.getStartNodeSync());
};

/**
 * Get the relationship type.
 * @return {String} Relationship type.
 */
Relationship.prototype.getType = function() {
  'use strict';

  return neo4j.neo4jWrapper.getTypeSync(this._rel);
};

/**
 * Add the relationship to a specific index.
 * @param {String} indexName Name of the index.
 * @param {String} key Key to index.
 * @param {Object} value Value to index.
 */
Relationship.prototype.index = function(indexName, key, value) {
  'use strict';

  var index = this._rel.getGraphDatabaseSync().indexSync().forRelationshipsSync(indexName);
  index.addSync(this._rel, key, value);
};

/**
 * Set a properties value.
 * @param {String} key The properties key.
 * @param {Object} value Value to set for the property.
 */
Relationship.prototype.setProperty = function(name, value) {
  'use strict';

  return this._rel.setPropertySync(name, value);
};

Relationship.prototype.setProperties = function(map) {
  for(var key in map) {
    if(map.hasOwnProperty(key)) {
      this.setProperty(key, map[key]);
    }
  }
};

module.exports = Relationship;