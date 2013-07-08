var expect = require('expect.js');
var neo4j = require('../lib/neo4j');
var async = require('async');

var database;

before(function(done) {
  this.timeout(10000);
  var exec = require('child_process').exec, child;
  child = exec('rm -rf test/Relationship.db', function(err,out) {
    neo4j.setDatabaseProperties(['-Xmx4096m']);
    neo4j.connect('test/Relationship.db', function(err, db) {
      database = db;
      done();
    });
  });
});

after(function(done) {
  database.shutdown();
  done();
});

describe('Relationship', function() {
  var tx, homer, marge, lisa, bart, maggie, married;
  beforeEach(function(done) {
    tx = database.beginTx();
    homer = database.createNode();
    marge = database.createNode();
    lisa = database.createNode();
    bart = database.createNode();
    maggie = database.createNode();
    married = homer.createRelationshipTo(marge, 'MARRIED_WITH');
    done();
  });
  afterEach(function(done) {
    try {married.delete();} catch(e) {};
    try {homer.delete();} catch(e) {};
    try {marge.delete();} catch(e) {};
    try {lisa.delete();} catch(e) {};
    try {bart.delete();} catch(e) {};
    try {maggie.delete();} catch(e) {};
    tx.success();
    try {tx.finish();} catch(e) {};
    done();
  });
  it('#delete', function() {
    expect(married.delete.bind(married)).not.to.throwException();
  });
  it('#getId', function() {
    expect(married.getId()).to.be.an('string');
    expect(married.getId()).to.be('1');
  });
  it('#getEndNode', function() {
    expect(married.getEndNode().getId()).to.be(marge.getId());
  });
  it('#getStartNode', function() {
    expect(married.getStartNode().getId()).to.be(homer.getId());
  });
  it('#get/setProperty', function() {
    married.setProperty('years', 25);
    expect(married.getProperty('years')).to.be(25);
  });
  it('#hasProperty', function() {
    married.setProperty('years', 25);
    expect(married.hasProperty('years')).to.be(true);
    expect(married.hasProperty('xyz4')).to.be(false);
  });
  it('#index', function() {
    married.index('MARRIED_WITH', 'years', 25);
  });
});