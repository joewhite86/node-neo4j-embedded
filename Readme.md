# node-neo4j-embedded

[![Build Status](https://travis-ci.org/joewhite86/node-neo4j-embedded.png?branch=master)](https://travis-ci.org/joewhite86/node-neo4j-embedded)

The embedded Neo4j Graph Database for Node.js.

## Installation

``` bash
npm install neo4j-embedded
```

## Documentation

API documentation can be found here: http://docs.whitefrog.de/neo4j-embedded

## Usage

Note that the Neo4j version is 1.9, so you need Java 7 on your machine for this to work.
If you want to change that, you need to edit the pom.xml and compile for yourself.

Further take care inside the try/catch blocks. Don't use callbacks inside!

Maybe I will change the methods to be async in future, but actually it works for me.

### Create a database

``` javascript
var neo4j = new require('neo4j-embedded');
neo4j.setVMOptions('-Xmx4096m');
neo4j.setDatabaseProperties({'org.neo4j.server.manage.console_engines': 'shell', 'org.neo4j.server.webserver.port', '7575'});

// default embedded
neo4j.connect('graph.db', function(err, database) {
  // do something
});
// enable REST and Webinterface
neo4j.connectWrapped('graph.db', function(err, database) {
  // do something
});
// connect to a high availability cluster
neo4j.connectHA('graph.db', function(err, database) {
  // do something
});
// connect to a high availability cluster, enabling REST and Webinterface
neo4j.connectHAWrapped('graph.db', function(err, database) {
  // do something
});
```

### Create nodes and relationships

``` javascript
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
```

### Delete nodes and relationships

``` javascript
var tx;
try {
  tx = database.beginTx();
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

### Deal with properties

``` javascript
var tx;
try {
  tx = database.beginTx();
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

### Handle indices

``` javascript
var tx;
try {
  tx = database.beginTx();
  var marge = database.getNodeById(2);
  marge.index('SIMPSONS', 'name', marge.getProperty('name'));
  marge.removeFromIndex('SIMPSONS');
  tx.success();
}
catch(e) {
  tx.failure();
}
finally {
  tx.finish();
}
```

### Cypher queries

``` javascript
var query = 'START n=node({search}) RETURN n';
database.query(query, {search: 2}, function(err, results) {
  for(var i = 0; i < results.length; i++) {
    console.log(results[i].n.getId());
  }
});
```

### Query Builder

``` javascript
var query = database.queryBuilder();
query.startAt({n: 'node({search})'})
     .match('(n)-[:MARRIED_WITH]->()')
     .returns('n');

// disable counting
// query.dontCount(); -> total will be -1

query.execute({search: 1}, function(err, results, total) {
  for(var i = 0; i < results.length; i++) {
    console.log(results[i].n.getId());
  }
});
```

## Testing

``` bash
cd node-neo4j-embedded
npm install --dev
npm test
```
