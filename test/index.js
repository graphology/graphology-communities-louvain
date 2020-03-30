/**
 * Graphology Louvain Unit Tests
 * ==============================
 */
var assert = require('chai').assert,
    Graph = require('graphology'),
    modularity = require('graphology-metrics/modularity'),
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

/**
 * Datasets.
 */
var clique3 = parse(require('./datasets/clique3.json'), TYPE.UNDIRECTED),
    complex500 = parse(require('./datasets/complex500.json'), TYPE.UNDIRECTED),
    undirected500 = parse(require('./datasets/undirected500.json'), TYPE.UNDIRECTED),
    mixed1000 = parse(require('./datasets/mixed1000.json'), TYPE.MIXED),
    undirected1000 = parse(require('./datasets/undirected1000.json'), TYPE.UNDIRECTED),
    directed1000 = parse(require('./datasets/directed1000.json'), TYPE.DIRECTED);

/**
 * Actual unit tests.
 */
describe('graphology-communities-louvain', function() {

  // TODO: drop when perf is back
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
  });

  it.skip('should work on a simple 3 clique graph.', function() {
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

  it.skip('should assign the new community on `community` attribute by default', function() {
    var attr = 'community',
        graph = clique3.graph;

    louvain.assign(graph);

    assert.strictEqual(graph.getNodeAttribute(0, attr), graph.getNodeAttribute(1, attr));
    assert.strictEqual(graph.getNodeAttribute(1, attr), graph.getNodeAttribute(2, attr));
    assert.strictEqual(graph.getNodeAttribute(2, attr), graph.getNodeAttribute(3, attr));

    assert.strictEqual(graph.getNodeAttribute(4, attr), graph.getNodeAttribute(5, attr));
    assert.strictEqual(graph.getNodeAttribute(5, attr), graph.getNodeAttribute(6, attr));
    assert.strictEqual(graph.getNodeAttribute(6, attr), graph.getNodeAttribute(7, attr));

    assert.strictEqual(graph.getNodeAttribute(8, attr), graph.getNodeAttribute(9, attr));
    assert.strictEqual(graph.getNodeAttribute(9, attr), graph.getNodeAttribute(10, attr));
    assert.strictEqual(graph.getNodeAttribute(10, attr), graph.getNodeAttribute(11, attr));
  });

  it.skip('should assign the new community with a custom attribute name', function() {
    var attr = 'foo',
        graph = clique3.graph;

    louvain.assign(graph, {attributes: {community: 'foo'}});

    assert.strictEqual(graph.getNodeAttribute(0, attr), graph.getNodeAttribute(1, attr));
    assert.strictEqual(graph.getNodeAttribute(1, attr), graph.getNodeAttribute(2, attr));
    assert.strictEqual(graph.getNodeAttribute(2, attr), graph.getNodeAttribute(3, attr));

    assert.strictEqual(graph.getNodeAttribute(4, attr), graph.getNodeAttribute(5, attr));
    assert.strictEqual(graph.getNodeAttribute(5, attr), graph.getNodeAttribute(6, attr));
    assert.strictEqual(graph.getNodeAttribute(6, attr), graph.getNodeAttribute(7, attr));

    assert.strictEqual(graph.getNodeAttribute(8, attr), graph.getNodeAttribute(9, attr));
    assert.strictEqual(graph.getNodeAttribute(9, attr), graph.getNodeAttribute(10, attr));
    assert.strictEqual(graph.getNodeAttribute(10, attr), graph.getNodeAttribute(11, attr));
  });

  it.skip('should handle a small undirected graph with 3 connected cliques', function() {
    var communities = louvain(clique3.graph);

    assert.closeTo(modularity(clique3.graph, {communities: communities}), 0.524, 0.001);
    assert.strictEqual(distinctSize(communities), distinctSize(clique3.partitioning));
    // assert(comparePartitions(clique3.partitioning, communities), 'Partitions are different.');
  });

  it.skip('should handle heavy-sized complex graph (undirected, weighted, with self-loops) (500 nodes, 4302 links)', function() {
    var communities = louvain(complex500.graph);

    assert.closeTo(modularity(complex500.graph, {communities: communities}), 0.407, 0.01);
    assert.strictEqual(distinctSize(communities), distinctSize(complex500.partitioning));
    // assert(comparePartitions(complex500.partitioning, communities), 'Partitions are different.');
  });

 it.skip('should handle heavy-sized undirected graph (500 nodes, 4813 links)', function() {
    var communities = louvain(undirected500.graph);

    assert.closeTo(modularity(undirected500.graph, {communities: communities}), 0.397, 0.01);
    assert.strictEqual(distinctSize(communities), distinctSize(undirected500.partitioning));
    // assert(comparePartitions(undirected500.partitioning, communities), 'Partitions are different.');
  });

  it.skip('should handle heavy-sized mixed graph (1000 nodes, 6907 links)', function() {
    var communities = louvain(mixed1000.graph);

    assert.closeTo(modularity(mixed1000.graph, {communities: communities}), 0.354, 0.01);
    assert.strictEqual(distinctSize(communities), 8);
    // assert(comparePartitions(mixed1000.partitioning, communities), 'Partitions are different.');
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
