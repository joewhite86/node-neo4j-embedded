# node-neo4j-jni

[![Build Status](https://travis-ci.org/joewhite86/node-neo4j-jni.png?branch=master)](https://travis-ci.org/joewhite86/node-neo4j-jni)

An interface for neo4j embedded database using JNI.

## Installation

``` bash
npm install neo4j-jni
```

## Usage

### Create nodes and relationships

``` javascript
var neo4j = new (require('neo4j-jni'))('-Xmx4096m');
var database = neo4j.connect('graph.db');

var tx = database.beginTx();
try {
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
```

### Delete nodes and relationships

``` javascript
var tx = database.beginTx();
try {
  var homer = database.getNodeById(1);
  var married = homer.getRelationship('MARRIED_WITH');
  married.delete();
  homer.delete();
  tx.success();
}
catch(e) {
  tx.failure();
}
finally {
  tx.finish();
}
```

## Deal with properties

``` javascript
var tx = database.beginTx();
try {
  var marge = database.getNodeById(2);
  marge.setProperty('name', 'Marge Simpson');
  marge.setProperty('haircolor', 'blue');
  var properties = marge.getProperties();
  // properties: {name: 'Marge Simpson', haircolor: 'blue'}
  var hairColor = marge.getProperty('haircolor');
  // hairColor: 'blue'
  tx.success();
}
catch(e) {
  tx.failure();
}
finally {
  tx.finish(); 
}
```

## Handle indices

``` javascript
var marge = database.getNodeById(2);
marge.index('SIMPSONS', 'name', marge.getProperty('name'));
```

## Cypher queries

``` javascript
var query = 'START n=node({search}) RETURN n';
database.query(query, {search: 2}, function(err, results) {
  for(var i = 0; i < results.length; i++) {
    console.log(results[i].n.getId());
  }
});
```

## Testing

``` bash
cd node-neo4j-jni
npm install --dev
node_modules/mocha/bin/mocha
```