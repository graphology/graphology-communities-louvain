var undirected1000Data = require('../test/datasets/undirected1000.json');
var euroSisData = require('../test/datasets/eurosis.json');

var Graph = require('graphology');
var jLouvain = require('jlouvain').jLouvain;
var louvain = require('../');

// Helpers
function distinctSize(o) {
  var keys = new Set();

  for (var k in o)
    keys.add(o[k]);

  return keys.size;
}

// Preparing data
var undirected1000 = new Graph.UndirectedGraph();

undirected1000Data.nodes.forEach(d => {
  undirected1000.addNode(d.id, d);
});

undirected1000Data.edges.forEach(d => {
  undirected1000.addEdge(d.source, d.target);
});

var undirected1000NodeData = undirected1000Data.nodes.map(d => d.id);

var euroSis = Graph.DirectedGraph.from(euroSisData);

var euroSisNodeData = euroSis.nodes();
var euroSisEdgeData = euroSis.edges().map(e => {
  return {
    source: euroSis.source(e),
    target: euroSis.target(e)
  };
});

// Bench
var communities;

console.time('graphology undirected1000');
communities = louvain(undirected1000);
console.timeEnd('graphology undirected1000');

console.log('Communities', distinctSize(communities));
console.log();

console.time('jlouvain undirected1000');
communities = jLouvain()
  .nodes(undirected1000NodeData)
  .edges(undirected1000Data.edges)();
console.timeEnd('jlouvain undirected1000');

console.log('Communities', distinctSize(communities));
console.log();

//---

console.time('graphology euroSis');
communities = louvain(euroSis);
console.timeEnd('graphology euroSis');

console.log('Communities', distinctSize(communities));
console.log();

console.time('jlouvain euroSis');
communities = jLouvain()
  .nodes(euroSisNodeData)
  .edges(euroSisEdgeData)();
console.timeEnd('jlouvain euroSis');

console.log('Communities', distinctSize(communities));
console.log();
