var expect = require('expect.js');
var neo4j = require('../lib/neo4j');
var async = require('async');

describe('neo4j', function() {
  it('IndexManager should be a function', function() {
    expect(neo4j.IndexManager).to.be.a('function');
  });
  it('Node should be a function', function() {
    expect(neo4j.Node).to.be.a('function');
  });
  it('Relationship should be a function', function() {
    expect(neo4j.Relationship).to.be.a('function');
  });
  it('QueryBuilder should be a function', function() {
    expect(neo4j.QueryBuilder).to.be.a('function');
  });
  it('Transaction should be a function', function() {
    expect(neo4j.Transaction).to.be.a('function');
  });
  it('DIRECTION should be a function', function() {
    expect(neo4j.DIRECTION).to.be.a('function');
  });
});