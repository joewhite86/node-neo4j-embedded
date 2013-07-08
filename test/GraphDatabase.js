var expect = require('expect.js');
var neo4j = require('../lib/neo4j');
var async = require('async');

var database;

before(function(done) {
  this.timeout(10000);
  var exec = require('child_process').exec, child;
  child = exec('rm -rf test/GraphDatabase.db', function(err,out) {
    neo4j.setDatabaseProperties(['-Xmx4096m']);
    neo4j.connect('test/GraphDatabase.db', function(err, db) {
      database = db;
      done(err);
    });
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
  it('#getNodeById', function() {
    expect(database.getNodeById(0)).to.be.an('object');
    expect(database.getNodeById(0).getId()).to.be('0');
    try {database.getNodeById(100000); expect(true).to.be(false);} catch(e) {}
  });
});
describe('GraphDatabase#Cypher', function() {
  var homer, marge, rel;

  beforeEach(function() {
    var tx = database.beginTx();

    homer = database.createNode(),
    marge = database.createNode();

    homer.setProperty('name', 'Homer Simpson');
    marge.setProperty('name', 'Marge Simpson');
    rel = homer.createRelationshipTo(marge, 'MARRIED_WITH');

    tx.success();
    tx.finish();
  });
  afterEach(function() {
    var tx = database.beginTx();

    rel.delete();
    homer.delete();
    marge.delete();

    tx.success();
    tx.finish();
  });

  it('#query', function(done) {
    this.timeout(10000);
    database.query('START man=node(2) MATCH (man)-[rel:MARRIED_WITH]->(woman) RETURN man, rel, ID(woman) as woman_id, woman.name as woman_name', function(err, result) {
      try {
        expect(err).to.be(null);
        expect(result).to.be.an('array');
        expect(result[0]).to.be.an('object');
        expect(result[0].man).to.be.an('object');
        expect(result[0].man.getId()).to.be('2');
        expect(result[0].rel).to.be.an('object');
        expect(result[0].rel.getStartNode().getId()).to.be(result[0].man.getId());
        expect(result[0].rel.getType()).to.be('MARRIED_WITH');
        expect(result[0].woman_id.longValue).to.be('3');
        expect(result[0].woman_name).to.be('Marge Simpson');
      }
      catch(e) {}
      done();
    });
  });

  it('#query with params', function(done) {
    database.query('START man=node({search}) MATCH (man)-[rel:MARRIED_WITH]->(woman) RETURN man, rel, ID(woman) as woman_id, woman.name as woman_name', {search: homer}, function(err, result) {
      try {
        expect(err).to.be(null);
        expect(result).to.be.an('array');
      }
      catch(e) {}
      done();
    });
  });

  it('#query collection', function(done) {
    database.query('START n=node(*) RETURN COLLECT(n) as ns', function(err, result) {
      try {
        expect(err).to.be(null);
        expect(result).to.be.an('array');
        expect(result[0].ns).to.be.an('array');
        expect(result[0].ns[0]).to.be.an('object');
        expect(result[0].ns[0].getId()).to.be('0');
      }
      catch(e) {}
      done();
    });
  });
});