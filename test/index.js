/**
 * Graphology Louvain Unit Tests
 * ==============================
 */
var assert = require('chai').assert,
    Graph = require('graphology'),
    modularity = require('graphology-metrics/modularity'),
    emptyGraph = require('graphology-generators/classic/empty'),
    netToImg = require('net-to-img'),
    louvain = require('../');

/**
 * Test helpers.
 */
var TYPE = {
  UNDIRECTED: 'undirected',
  DIRECTED: 'directed',
  MIXED: 'mixed',
};

function distinctSize(obj) {
  var indexer = new Set();

  for (var element in obj)
    indexer.add(obj[element]);

  return indexer.size;
}

function parse(dataset, t) {
   var graph = new Graph({type: t}),
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

function assignNodeAttributes(graph, prop, map) {
  for (var node in map)
    graph.setNodeAttribute(node, prop, map[node]);
}

/* eslint-disable */
function dumpToImage(graph, communities) {
  if (communities) {
    graph = graph.copy();
    assignNodeAttributes(graph, 'community', communities);
  }

  netToImg({
    graph: graph,
    destPath: './test/dump.png',
    options: {
      colorize: 'community',
      width: 512,
      height: 512
    }
  });
}
/* eslint-enable */

/**
 * Datasets.
 */
var clique3 = parse(require('./datasets/clique3.json'), TYPE.UNDIRECTED),
    complex500 = parse(require('./datasets/complex500.json'), TYPE.UNDIRECTED),
    undirected500 = parse(require('./datasets/undirected500.json'), TYPE.UNDIRECTED),
    undirected1000 = parse(require('./datasets/undirected1000.json'), TYPE.UNDIRECTED),
    directed1000 = parse(require('./datasets/directed1000.json'), TYPE.DIRECTED);

/**
 * Actual unit tests.
 */
describe('graphology-communities-louvain', function() {

  // High timeout
  this.timeout(30 * 1000);

  it('should throw when given invalid arguments.', function() {

    // Invalid graph
    assert.throws(function() {
      louvain(null);
    }, /graphology/);

    // Multi graph
    assert.throws(function() {
      louvain(new Graph({multi: true}));
    }, /multi/i);

    // True mixed graph
    assert.throws(function() {
      var graph = new Graph();
      graph.mergeUndirectedEdge(1, 2);
      graph.mergeDirectedEdge(2, 3);

      louvain(graph);
    });

    // Empty graph
    assert.throws(function() {
      var graph = emptyGraph(Graph.UndirectedGraph, 10);
      louvain(graph);
    }, /empty/);
  });

  it('should work with multiple connected components.', function() {
    var graph = clique3.graph.copy();
    graph.dropNode(0);
    graph.dropNode(8);
    graph.dropNode(4);

    var communities = louvain(graph);

    assert.strictEqual(communities[1], communities[3]);
    assert.strictEqual(communities[2], communities[3]);

    assert.strictEqual(communities[5], communities[6]);
    assert.strictEqual(communities[6], communities[7]);

    assert.strictEqual(communities[9], communities[10]);
    assert.strictEqual(communities[10], communities[11]);

    assert.strictEqual(distinctSize(communities), 3);
  });

  it('should work on a simple 3 clique graph.', function() {
    var communities = louvain(clique3.graph);

    assert.strictEqual(communities[0], communities[1]);
    assert.strictEqual(communities[1], communities[2]);
    assert.strictEqual(communities[2], communities[3]);

    assert.strictEqual(communities[4], communities[5]);
    assert.strictEqual(communities[5], communities[6]);
    assert.strictEqual(communities[6], communities[7]);

    assert.strictEqual(communities[8], communities[9]);
    assert.strictEqual(communities[9], communities[10]);
    assert.strictEqual(communities[10], communities[11]);
  });

  it('should handle a small undirected graph with 3 connected cliques', function() {
    var communities = louvain(clique3.graph);

    assert.closeTo(modularity(clique3.graph, {communities: communities}), 0.524, 0.001);
    assert.strictEqual(distinctSize(communities), distinctSize(clique3.partitioning));
  });

  it.skip('should handle heavy-sized complex graph (undirected, with self-loops) (500 nodes, 4302 links)', function() {
    var result = louvain.detailed(complex500.graph);
    // var {communities, ...meta} = result;
    // console.log(meta)
    // TODO: what about self loops...

    // var Q = modularity(complex500.graph, {communities: result.communities});

    // assert.closeTo(Q, 0.407, 0.001);
    // assert.closeTo(Q, result.modularity, 0.001);
    assert.strictEqual(distinctSize(result.communities), distinctSize(complex500.partitioning));
  });

 it.skip('should handle heavy-sized undirected graph (500 nodes, 4813 links)', function() {
    var communities = louvain(undirected500.graph);

    assert.closeTo(modularity(undirected500.graph, {communities: communities}), 0.397, 0.01);
    assert.strictEqual(distinctSize(communities), distinctSize(undirected500.partitioning));
    // assert(comparePartitions(undirected500.partitioning, communities), 'Partitions are different.');
  });

  it.skip('should handle heavy-sized undirected graph (1000 nodes, 9724 links)', function() {
    var communities = louvain(undirected1000.graph);

    assert.closeTo(modularity(undirected1000.graph, {communities: communities}), 0.437, 0.01);
    assert.strictEqual(distinctSize(communities), distinctSize(undirected1000.partitioning));
    // assert(comparePartitions(undirected1000.partitioning, communities), 'Partitions are different.');
  });

  it.skip('should handle heavy-sized directed graph (1000 nodes, 10000 links)', function() {
    var communities = louvain(directed1000.graph);

    assert.closeTo(modularity(directed1000.graph, {communities: communities}), 0.433, 0.01);
    assert.strictEqual(distinctSize(communities), distinctSize(directed1000.partitioning));
    // assert(comparePartitions(directed1000.partitioning, communities), 'Partitions are different.');
  });
});
