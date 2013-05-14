var Node, java, neo4jWrapper;

/**
 * @class Relationship
 * Wrapper for neo4j relationships.
 */
function Relationship(_java, relationship) {
  'use strict';
  Node = require('./Node');
  this._rel = relationship;
  java = _java;
  var Neo4jWrapper = java.import('de.whitefrog.Neo4jWrapper');
  neo4jWrapper = new Neo4jWrapper();
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

  return new Node(java, this._rel.getEndNodeSync());
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
 * Get a property by name.
 * @param {String} name Name of the property.
 * @return {Object} The properties value.
 */
Relationship.prototype.getProperty = function(name) {
  'use strict';

  return this._rel.getPropertySync(name);
};

/**
 * Get the node the relationship starts at.
 * @return {Node} Start node.
 */
Relationship.prototype.getStartNode = function() {
  'use strict';

  return new Node(java, this._rel.getStartNodeSync());
};

/**
 * Get the relationship type.
 * @return {String} Relationship type.
 */
Relationship.prototype.getType = function() {
  'use strict';

  return neo4jWrapper.getTypeSync(this._rel);
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

module.exports = Relationship;