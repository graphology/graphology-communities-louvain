/**
 * Graphology Louvain Unit Tests
 * ==============================
 */
var assert = require('chai').assert,
    Graph = require('graphology'),
    modularity = require('graphology-metrics/modularity'),
    louvain = require('../');

/**
 * Datasets.
 */
var clique3 = require('./datasets/clique3.json'),
    complex500 = require('./datasets/complex500.json'),
    undirected500 = require('./datasets/undirected500.json'),
    mixed1000 = require('./datasets/mixed1000.json'),
    undirected1000 = require('./datasets/undirected1000.json'),
    directed1000 = require('./datasets/directed1000.json');

/**
 * Test helpers.
 */
var TYPE = {
  UNDIRECTED: 1,
  DIRECTED: 2,
  MIXED: 3,
};

function distinctSize(obj) {
  var indexer = {};

  for (var element in obj)
    if (!indexer[obj[element]])
      indexer[obj[element]] = true;

  return Object.keys(indexer).length;
}

function parse(dataset, t) {
   var graph = new Graph(),
       n = dataset.nodes,
       e = dataset.edges,
       partitioning = {},
       i, l;

  for (i = 0, l = n.length; i < l; i++) {
    graph.addNode(n[i].id);
    partitioning[n[i].id] = n[i].attributes['Modularity Class'];
  }

  for (i = 0, l = e.length; i < l; i++) {
    if (graph.hasEdge(e[i].source, e[i].target))
      continue;
    if (t === TYPE.DIRECTED || (t === TYPE.MIXED && e[i].attributes.Orientation === 'directed'))
      graph.addDirectedEdge(e[i].source, e[i].target);
    else
      graph.addUndirectedEdge(e[i].source, e[i].target);
  }

  return {graph: graph, partitioning: partitioning};
}

/**
 * Actual unit tests.
 */
describe('graphology-communities-louvain', function() {

  this.timeout(0);

  it('should throw if given graph is invalid.', function() {
    assert.throws(function() {
      louvain(null);
    }, /graphology/);
  });

  it('should throw if provided with a MultiGraph.', function() {
    assert.throws(function() {
      var graph = new Graph({multi: true});
      louvain(graph);
    }, /multi/i);
  });

  it('should throw if the given graph has no edges.', function() {
    var graph = new Graph();
    graph.addNodesFrom([1, 2]);

    assert.throws(function() {
      louvain(graph);
    }, /graphology/);
  });

  it('should assign the new community on `community` attribute by default', function() {
    var o = parse(clique3, TYPE.UNDIRECTED),
        attr = 'community';

    louvain.assign(o.graph);

    assert.equal(o.graph.getNodeAttribute(0, attr), o.graph.getNodeAttribute(1, attr));
    assert.equal(o.graph.getNodeAttribute(1, attr), o.graph.getNodeAttribute(2, attr));
    assert.equal(o.graph.getNodeAttribute(2, attr), o.graph.getNodeAttribute(3, attr));

    assert.equal(o.graph.getNodeAttribute(4, attr), o.graph.getNodeAttribute(5, attr));
    assert.equal(o.graph.getNodeAttribute(5, attr), o.graph.getNodeAttribute(6, attr));
    assert.equal(o.graph.getNodeAttribute(6, attr), o.graph.getNodeAttribute(7, attr));

    assert.equal(o.graph.getNodeAttribute(8, attr), o.graph.getNodeAttribute(9, attr));
    assert.equal(o.graph.getNodeAttribute(9, attr), o.graph.getNodeAttribute('10', attr));
    assert.equal(o.graph.getNodeAttribute('10', attr), o.graph.getNodeAttribute('11', attr));
  });

  it('should assign the new community with a custom attribute name', function() {
    var o = parse(clique3, TYPE.UNDIRECTED),
        attr = 'foo';

    louvain.assign(o.graph, {attributes: {community: 'foo'}});

    assert.equal(o.graph.getNodeAttribute(0, attr), o.graph.getNodeAttribute(1, attr));
    assert.equal(o.graph.getNodeAttribute(1, attr), o.graph.getNodeAttribute(2, attr));
    assert.equal(o.graph.getNodeAttribute(2, attr), o.graph.getNodeAttribute(3, attr));

    assert.equal(o.graph.getNodeAttribute(4, attr), o.graph.getNodeAttribute(5, attr));
    assert.equal(o.graph.getNodeAttribute(5, attr), o.graph.getNodeAttribute(6, attr));
    assert.equal(o.graph.getNodeAttribute(6, attr), o.graph.getNodeAttribute(7, attr));

    assert.equal(o.graph.getNodeAttribute(8, attr), o.graph.getNodeAttribute(9, attr));
    assert.equal(o.graph.getNodeAttribute(9, attr), o.graph.getNodeAttribute('10', attr));
    assert.equal(o.graph.getNodeAttribute('10', attr), o.graph.getNodeAttribute('11', attr));
  });

  it('should handle a small undirected graph with 3 connected cliques', function() {
    var o = parse(clique3, TYPE.UNDIRECTED);
    var communities = louvain(o.graph);

    assert.closeTo(modularity(o.graph, {communities: communities}), 0.524, 0.001);
    assert.equal(distinctSize(communities), distinctSize(o.partitioning));
  });

  it('should handle heavy-sized complex graph (undirected, weighted, with self-loops) (500 nodes, 4302 links)', function() {
    var o = parse(complex500, TYPE.UNDIRECTED);
    var communities = louvain(o.graph);

    assert.closeTo(modularity(o.graph, {communities: communities}), 0.407, 0.01);
    assert.equal(distinctSize(communities), distinctSize(o.partitioning));
  });

 it('should handle heavy-sized undirected graph (500 nodes, 4813 links)', function() {
    var o = parse(undirected500, TYPE.UNDIRECTED);
    var communities = louvain(o.graph);

    assert.closeTo(modularity(o.graph, {communities: communities}), 0.397, 0.01);
    assert.equal(distinctSize(communities), distinctSize(o.partitioning));
  });

  it('should handle heavy-sized mixed graph (1000 nodes, 6907 links)', function() {
    var o = parse(mixed1000, TYPE.MIXED);
    var communities = louvain(o.graph);

    assert.closeTo(modularity(o.graph, {communities: communities}), 0.354, 0.01);
    assert.equal(distinctSize(communities), 8);
  });

  it('should handle heavy-sized undirected graph (1000 nodes, 9724 links)', function() {
    var o = parse(undirected1000, TYPE.UNDIRECTED);
    var communities = louvain(o.graph);

    assert.closeTo(modularity(o.graph, {communities: communities}), 0.437, 0.01);
    assert.equal(distinctSize(communities), distinctSize(o.partitioning));
  });

  it('should handle heavy-sized directed graph (1000 nodes, 10000 links)', function() {
    var o = parse(directed1000, TYPE.DIRECTED);
    var communities = louvain(o.graph);

    assert.closeTo(modularity(o.graph, {communities: communities}), 0.433, 0.01);
    assert.equal(distinctSize(communities), distinctSize(o.partitioning));
  });
});
