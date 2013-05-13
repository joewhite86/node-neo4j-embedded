var expect = require('expect.js');
var neo4j = require('../lib/neo4j');
var async = require('async');

var database;

before(function(done) {
  var exec = require('child_process').exec, child;
  child = exec('rm -rf test/GraphDatabase.db', function(err,out) {
    database = neo4j.connect('test/GraphDatabase.db');
    done();
  });
});

after(function(done) {
  database.shutdown();
  done();
});

describe('GraphDatabase', function() {
  it('#connect', function() {
    expect(database.isConnected).to.be(true);
  });
  it('#createNode', function() {
    var tx = database.beginTx(),
        node = database.createNode();

    expect(node.getId()).to.be.an('string');
    expect(node.getId()).to.be('1');
    node.delete();
    tx.success();
    tx.finish();
  });
});