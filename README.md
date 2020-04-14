[![Build Status](https://travis-ci.org/graphology/graphology-communities-louvain.svg)](https://travis-ci.org/graphology/graphology-communities-louvain)

# Graphology Communities Louvain

Implementation of the [Louvain algorihtm](https://en.wikipedia.org/wiki/Louvain_modularity) for community detection to be used with [`graphology`](https://graphology.github.io).

## References

> M. E. J. Newman, « Modularity and community structure in networks », Proc. Natl. Acad. Sci. USA, vol. 103, no 23,‎ 2006, p. 8577–8582 https://dx.doi.org/10.1073%2Fpnas.0601602103

> Newman, M. E. J. « Community detection in networks: Modularity optimization and maximum likelihood are equivalent ». Physical Review E, vol. 94, no 5, novembre 2016, p. 052315. arXiv.org, doi:10.1103/PhysRevE.94.052315. https://arxiv.org/pdf/1606.02319.pdf

> Blondel, Vincent D., et al. « Fast unfolding of communities in large networks ». Journal of Statistical Mechanics: Theory and Experiment, vol. 2008, no 10, octobre 2008, p. P10008. DOI.org (Crossref), doi:10.1088/1742-5468/2008/10/P10008. https://arxiv.org/pdf/0803.0476.pdf

> Nicolas Dugué, Anthony Perez. Directed Louvain: maximizing modularity in directed networks. [Research Report] Université d’Orléans. 2015. hal-01231784 https://hal.archives-ouvertes.fr/hal-01231784

> R. Lambiotte, J.-C. Delvenne and M. Barahona. Laplacian Dynamics and Multiscale Modular Structure in Networks, doi:10.1109/TNSE.2015.2391998. https://arxiv.org/abs/0812.1770

> Traag, V. A., et al. « From Louvain to Leiden: Guaranteeing Well-Connected Communities ». Scientific Reports, vol. 9, no 1, décembre 2019, p. 5233. DOI.org (Crossref), doi:10.1038/s41598-019-41695-z. https://arxiv.org/abs/1810.08473

## Installation

```
npm install graphology-communities-louvain
```

## Usage

Runs the Louvain algorithm to detect communities in the given graph. It works both for undirected & directed graph by using the relevant modularity computations.

Note that the community labels are returned as an integer range from 0 to n.

```js
import louvain from 'graphology-communities-louvain';

// To retrieve the partition
const communities = louvain(graph);

// To directly assign communities as a node attribute
louvain.assign(graph);

// If you need to pass custom options
louvain.assign(graph, {
  attributes: {
    weight: 'myCustomWeight',
    community: 'myCustomCommunity'
  }
});

// If you want to return some details about the algorithm's execution
var details = louvain.detailed(graph);
```

*Arguments*

* **graph** *Graph*: target graph.
* **options** *?object*: options:
  * **attributes** *?object*: attributes' names:
    * **weight** *?string* [`weight`]: name of the edges' weight attribute.
    * **community** *?string* [`community`]: name of the community attribute.
  * **deltaComputation** *?string* [`fast|original`]: what computation method to use: `original` for Louvain's paper method, `fast` for a simplified but equivalent version or `true` for applying true modularity delta formula. `fast` and `true` only work for the undirected version right now.
  * **fastLocalMoves** *?boolean* [`true`]: whether to use a well-known optimization relying on a queue set to traverse the graph more efficiently.
  * **randomWalk** *?boolean* [`true`]: whether to traverse the graph randomly.
  * **rng** *?function* [`Math.random`]: RNG function to use for `randomWalk`. Useful if you need to seed your rng using, for instance, [seedrandom](https://www.npmjs.com/package/seedrandom).
  * **weighted** *?boolean* [`false`]: whether to take edge weights into account.

*Detailed Output*

* **communities** [`object`]: partition of the graph.
* **count** [`number`]: number of communities in the partition.
* **deltaComputations** [`number`]: number of delta computations that were run to produce the partition.
* **dendrogram** [`array`]: array of partitions.
* **modularity** [`number`]: final modularity of the graph given the found partition.
* **moves** [`array`]: array of array of number of moves if `fastLocalMoves` was false or array of number of moves if `fastLocalMoves` was true.
* **nodesVisited** [`number`]: number of times nodes were visited.

## Benchmark

To run the benchmark:

```
npm install --no-save ngraph.louvain.native
node benchmark/comparison.js
```

```
Clustered Undirected graph with 1000 nodes and 9724 edges.

graphology undirected1000: 56.898ms
Communities 8
Modularity 0.43022131098025784

jlouvain undirected1000: 2592.024ms
Communities 8
Modularity 0.4302331134880074

ngraph.louvain undirected1000: 78.188ms
Communities 8

ngraph.louvain.native undirected1000: 45.867ms
Communities 7

---

EuroSIS Directed graph with 1285 nodes and 7524 edges.

graphology euroSis: 43.606ms
Communities 19
Modularity 0.7384815869034789

jlouvain euroSis: 1716.894ms
Communities 23
Modularity 0.7376116434498033

ngraph euroSis: 45.982ms
Communities 16

ngraph.native euroSis: 21.907ms
Communities 16

---

Big Undirected graph with 50000 nodes and 994631 edges.

graphology bigGraph: 1114.216ms
Communities 43
Modularity 0.48304555149107353

jLouvain is too slow...

ngraph bigGraph: 8799.085ms
Communities 42

ngraph.native bigGraph: 8084.948ms
Communities 1
```
