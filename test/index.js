/**
 * Graphology Louvain Unit Tests
 * ==============================
 */
var assert = require('chai').assert,
    seedrandom = require('seedrandom'),
    Graph = require('graphology'),
    modularity = require('graphology-metrics/modularity'),
    emptyGraph = require('graphology-generators/classic/empty'),
    toUndirected = require('graphology-operators/to-undirected'),
    netToImg = require('net-to-img'),
    louvain = require('../');

// Tweaking defaults fot tests
louvain.defaults.randomWalk = false;
louvain.defaults.fastLocalMoves = false;

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

function printReport(result) {
  console.log('Q =', result.modularity);
  console.log('Level =', result.level);
  console.log('Communities =', result.count);
  console.log('Delta Computations =', result.deltaComputations);
  console.log('Moves', result.moves);
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

var euroSis = Graph.DirectedGraph.from(require('./datasets/eurosis.json'));

var undirectedEuroSis = toUndirected(euroSis);

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

  it('should handle heavy-sized complex graph (undirected, with self-loops) (500 nodes, 4302 links)', function() {
    var result = louvain.detailed(complex500.graph);
    // printReport(result);
    // dumpToImage(complex500.graph, result.communities);
    assert.closeTo(result.modularity, modularity(complex500.graph, {communities: result.communities}), 0.0001);
    assert.strictEqual(distinctSize(result.communities), distinctSize(complex500.partitioning));
  });

  it('should handle heavy-sized undirected graph (500 nodes, 4768 links)', function() {
    var result = louvain.detailed(undirected500.graph);
    // printReport(result);
    // dumpToImage(undirected500.graph, result.communities);
    assert.closeTo(result.modularity, modularity(undirected500.graph, {communities: result.communities}), 0.0001);
    assert.strictEqual(distinctSize(result.communities), distinctSize(undirected500.partitioning));
  });

  it('should handle heavy-sized undirected graph (1000 nodes, 9724 links)', function() {
    var result = louvain.detailed(undirected1000.graph);
    // printReport(result);
    // dumpToImage(undirected1000.graph, result.communities);
    assert.closeTo(result.modularity, modularity(undirected1000.graph, {communities: result.communities}), 0.0001);
    assert.strictEqual(distinctSize(result.communities), distinctSize(undirected1000.partitioning));
  });

  it('should handle heavy-sized directed graph (1000 nodes, 10000 links)', function() {
    var result = louvain.detailed(directed1000.graph);
    // printReport(result);
    // dumpToImage(directed1000.graph, result.communities);
    assert.closeTo(result.modularity, modularity(directed1000.graph, {communities: result.communities}), 0.0001);
    assert.strictEqual(distinctSize(result.communities), distinctSize(directed1000.partitioning));
  });

  it('should work with undirected EuroSIS (1285 nodes, 6462 links).', function() {
    var result = louvain.detailed(undirectedEuroSis);
    assert.strictEqual(result.count, 17);

    assert.closeTo(result.modularity, modularity(undirectedEuroSis, {communities: result.communities}), 0.0001);
    // printReport(result);
    // dumpToImage(undirectedEuroSis, result.communities);
  });

  it('should work with directed EuroSIS (1285 nodes, 7524 links).', function() {
    var result = louvain.detailed(euroSis);

    assert.strictEqual(result.count, 19);

    assert.closeTo(result.modularity, modularity(euroSis, {communities: result.communities}), 0.0001);
    // printReport(result);
    // dumpToImage(euroSis, result.communities);
  });

  it('should be possible to seed the random walk.', function() {
    var result = louvain.detailed(undirectedEuroSis, {
      randomWalk: true,
      rng: seedrandom('test')
    });

    assert.strictEqual(result.count, 17);
    assert.closeTo(result.modularity, 0.7273, 0.0001);
  });

  it('should be possible to use fast local moves in the undirected case.', function() {
    var result = louvain.detailed(undirectedEuroSis, {
      randomWalk: true,
      rng: seedrandom('test'),
      fastLocalMoves: true
    });

    assert.strictEqual(result.count, 18);
    assert.closeTo(result.modularity, 0.7258, 0.0001);
  });

  it('should be possible to use fast local moves in the directed case.', function() {
    var result = louvain.detailed(euroSis, {
      randomWalk: true,
      rng: seedrandom('test'),
      fastLocalMoves: true
    });

    assert.strictEqual(result.count, 18);
    assert.closeTo(result.modularity, 0.7411, 0.0001);
  });
});
