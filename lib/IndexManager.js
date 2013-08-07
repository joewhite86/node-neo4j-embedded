var neo4j;

/**
 * @class IndexManager
 * Index manager class.
 */
function IndexManager(_neo4j, manager) {
  neo4j = _neo4j;
  this._manager = manager;
}

function objectToHashMap(obj) {
  'use strict';

  var key, map = neo4j.java.newInstanceSync('java.util.HashMap');

  if('object' === typeof obj) {
    for(key in obj) {
      if(obj.hasOwnProperty(key)) {
        map.putSync(key, obj[key]);
      }
    }
  }

  return map;
}

/**
 * Tests if a named index exists for nodes.
 * @param {String} index Name of the index.
 * @return {Boolean} True if the index exists, false otherwise.
 */
IndexManager.prototype.existsForNodes = function(index) {
  return this._manager.existsForNodesSync(index);
};
/**
 * Tests if a named index exists for relationships.
 * @param {String} index Name of the index.
 * @return {Boolean} True if the index exists, false otherwise.
 */
IndexManager.prototype.existsForRelationships = function(index) {
  return this._manager.existsForRelationshipsSync(index);
};

/**
 * Get a node index by name or create if it doesn't exist.
 * @param {String} index Name of the index.
 * @param {Object} (Optional) options Options object.
 * @return {Object} The found/created index.
 */
IndexManager.prototype.forNodes = function(index, options) {
  if(!options) return this._manager.forNodesSync(index);
  else return this._manager.forNodesSync(index, objectToHashMap(options));
};
/**
 * Get a relationship index by name or create if it doesn't exist.
 * @param {String} index Name of the index.
 * @param {Object} (Optional) options Options object.
 * @return {Object} The found/created index.
 */
IndexManager.prototype.forRelationships = function(index, options) {
  if(!options) return this._manager.forRelationshipsSync(index);
  else return this._manager.forRelationshipsSync(index, objectToHashMap(options));
};

/**
 * Get all index names for nodes.
 * @return {Array} All index names.
 */
IndexManager.prototype.nodeIndexNames = function() {
  return this._manager.nodeIndexNamesSync();
};
/**
 * Get all index names for relationships.
 * @return {Array} All index names.
 */
IndexManager.prototype.relationshipIndexNames = function() {
  return this._manager.relationshipIndexNamesSync();
};

module.exports = IndexManager;