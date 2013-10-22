var expect = require('expect.js');
var neo4j = require('../lib/neo4j');
var async = require('async');

var database;

before(function(done) {
  this.timeout(10000);
  neo4j.setDatabaseProperties(['-Xmx4096m']);
  neo4j.connect('test/Node.db', function(err, db) {
    database = db;
    done();
  });
});

after(function(done) {
  database.shutdown();
  var exec = require('child_process').exec, child;
  child = exec('rm -rf test/Node.db', function(err,out) {
    done();
  });
});

describe('Node', function() {
  var tx, homer, marge, lisa, bart, maggie;
  beforeEach(function(done) {
    tx = database.beginTx();
    try {
      database.createLabel('Person', 'name');
      tx.success();
    }
    catch(e) {}
    finally {
      tx.finish();
    }
    tx = database.beginTx();
    database.awaitIndexesOnline(10, function() {
      homer = database.createNode('Person');
      marge = database.createNode('Person');
      lisa = database.createNode('Person');
      bart = database.createNode('Person');
      maggie = database.createNode('Person');
      done();
    });
  });
  afterEach(function(done) {
    async.each([homer, marge, lisa, bart, maggie], function(node, done) {
      try {
        var rels = node.getRelationships();
        for(var i = 0; i < rels.length; i++) rels[i].delete();
        node.delete();
      }
      catch(e) {}
      finally {
        done();
      }
    }, function() {
      tx.success();
      try {
        tx.finish();
      }
      catch(e) {}

      done();
    });
  });
  it('getId', function() {
    expect(homer.getId()).to.be.an('string');
    expect(homer.getId()).to.be('1');
  });
  it('get/setProperty', function() {
    homer.setProperty('name', 'Homer Simpson');
    expect(homer.getProperty('name')).to.be('Homer Simpson');
    maggie.setProperty('age', 1);
    expect(maggie.getProperty('age')).to.be(1);
    var properties = maggie.getProperties();
    expect(properties).to.be.an('object');
    expect(properties.age).to.be(1);
    expect(maggie.getProperty('name')).to.be(undefined);
    expect(maggie.getProperty('name', 'Maggie Simpson')).to.be('Maggie Simpson');
  });
  it('hasProperty', function() {
    homer.setProperty('name', 'Homer Simpson');
    expect(homer.hasProperty('name')).to.be(true);
    expect(homer.hasProperty('xyz4')).to.be(false);
  });
  it('addLabel', function() {
    expect(function() {homer.addLabel('Drunk');}).to.not.throwError();
    expect(function() {homer.addLabel('Drunk', 'Person');}).to.not.throwError();
  });
  it('hasLabel', function() {
    homer.addLabel('Drunk');
    expect(homer.hasLabel('Drunk')).to.be(true);
  });
  it('getLabels', function() {
    homer.addLabel('Drunk', 'Person');
    expect(homer.getLabels()).to.eql(['Person', 'Drunk']);
  });
  it('removeLabel', function() {
    homer.addLabel('Drunk', 'Person');
    expect(function() {homer.removeLabel('Drunk');}).to.not.throwError();
    expect(homer.hasLabel('Drunk')).to.be(false);
    expect(homer.hasLabel('Person')).to.be(true);
    expect(homer.getLabels()).to.eql(['Person']);
  });
  it('delete', function() {
    homer.delete();
    try {
      homer.setProperty('name', 'Homer Simpson');
    }
    catch(e) {}
  });
  it('createRelationshipTo', function() {
    expect(homer.createRelationshipTo(marge, 'MARRIED_WITH')).to.be.an('object');
  });
  it('hasRelationship', function() {
    expect(homer.createRelationshipTo(marge, 'MARRIED_WITH')).to.be.an('object');
    expect(bart.createRelationshipTo(homer, 'CHILD_OF')).to.be.an('object');
    expect(homer.hasRelationship()).to.be(true);
    expect(homer.hasRelationship(neo4j.DIRECTION.OUTGOING)).to.be(true);
    expect(homer.hasRelationship(neo4j.DIRECTION.INCOMING)).to.be(true);
    expect(marge.hasRelationship(neo4j.DIRECTION.OUTGOING)).to.be(false);
    expect(marge.hasRelationship(neo4j.DIRECTION.INCOMING)).to.be(true);
    expect(homer.hasRelationship('MARRIED_WITH')).to.be(true);
    expect(homer.hasRelationship(neo4j.DIRECTION.OUTGOING, 'CHILD_OF')).to.be(false);
    expect(bart.hasRelationship('CHILD_OF')).to.be(true);
    expect(bart.hasRelationship('MARRIED_WITH', 'CHILD_OF')).to.be(true);
    expect(bart.hasRelationship(neo4j.DIRECTION.OUTGOING, 'MARRIED_WITH', 'CHILD_OF')).to.be(true);
  });
  it('getRelationships', function() {
    var rel = homer.createRelationshipTo(marge, 'MARRIED_WITH');
    expect(rel).to.be.an('object');
    expect(bart.createRelationshipTo(homer, 'CHILD_OF')).to.be.an('object');
    expect(homer.getRelationships()).to.be.an('array');
    expect(homer.getRelationships().length).to.be(2);
    expect(bart.getRelationships().length).to.be(1);
    expect(homer.getRelationships().contains(rel)).to.be(true);
    expect(marge.getRelationships('MARRIED_WITH').length).to.be(1);
    expect(homer.getRelationships('MARRIED_WITH', 'CHILD_OF').length).to.be(2);
    expect(homer.getRelationships(neo4j.DIRECTION.OUTGOING, 'CHILD_OF', 'MARRIED_WITH').length).to.be(1);
  });
  it('getRelationshipNodes', function() {
    expect(homer.createRelationshipTo(marge, 'MARRIED_WITH')).to.be.an('object');
    expect(bart.createRelationshipTo(homer, 'CHILD_OF')).to.be.an('object');
    expect(homer.getRelationshipNodes()).to.be.an('array');
    expect(homer.getRelationshipNodes().length).to.be(2);
    expect(bart.getRelationshipNodes().length).to.be(1);
    expect(homer.getRelationshipNodes().contains(marge)).to.be(true);
    expect(marge.getRelationshipNodes('MARRIED_WITH').length).to.be(1);
    expect(homer.getRelationshipNodes('MARRIED_WITH', 'CHILD_OF').length).to.be(2);
    expect(homer.getRelationshipNodes(neo4j.DIRECTION.OUTGOING, 'CHILD_OF', 'MARRIED_WITH').length).to.be(1);
  });
});