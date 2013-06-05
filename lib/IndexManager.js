/**
 * Index Manager.
 */
var neo4j;

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

IndexManager.prototype.existsForNodes = function(index) {
  return this._manager.existsForNodesSync(index);
};

IndexManager.prototype.existsForRelationships = function(index) {
  return this._manager.existsForRelationshipsSync(index);
};

IndexManager.prototype.forNodes = function(index, options) {
  if(!options) return this._manager.forNodesSync(index);
  else return this._manager.forNodesSync(index, objectToHashMap(options));
};

IndexManager.prototype.forRelationships = function(index, options) {
  if(!options) return this._manager.forRelationshipsSync(index);
  else return this._manager.forRelationshipsSync(index, objectToHashMap(options));
};

IndexManager.prototype.nodeIndexNames = function() {
  return this._manager.nodeIndexNamesSync();
};

IndexManager.prototype.relationshipIndexNames = function() {
  return this._manager.relationshipIndexNamesSync();
};

module.exports = IndexManager;