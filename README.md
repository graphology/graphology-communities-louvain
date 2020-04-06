[![Build Status](https://travis-ci.org/graphology/graphology-communities-louvain.svg)](https://travis-ci.org/graphology/graphology-communities-louvain)

# Graphology Communities Louvain

Implementation fo the [Louvain algorihtm](https://en.wikipedia.org/wiki/Louvain_modularity) for community detection to be used with [`graphology`](https://graphology.github.io).

## References

> M. E. J. Newman, « Modularity and community structure in networks », Proc. Natl. Acad. Sci. USA, vol. 103, no 23,‎ 2006, p. 8577–8582 https://dx.doi.org/10.1073%2Fpnas.0601602103

> Blondel, Vincent D., et al. « Fast unfolding of communities in large networks ». Journal of Statistical Mechanics: Theory and Experiment, vol. 2008, no 10, octobre 2008, p. P10008. DOI.org (Crossref), doi:10.1088/1742-5468/2008/10/P10008. https://arxiv.org/pdf/0803.0476.pdf

> Nicolas Dugué, Anthony Perez. Directed Louvain: maximizing modularity in directed networks. [Research Report] Université d’Orléans. 2015. hal-01231784 https://hal.archives-ouvertes.fr/hal-01231784

> R. Lambiotte, J.-C. Delvenne and M. Barahona. Laplacian Dynamics and Multiscale Modular Structure in Networks, doi:10.1109/TNSE.2015.2391998. https://arxiv.org/abs/0812.1770

> Traag, V. A., et al. « From Louvain to Leiden: Guaranteeing Well-Connected Communities ». Scientific Reports, vol. 9, no 1, décembre 2019, p. 5233. DOI.org (Crossref), doi:10.1038/s41598-019-41695-z. https://arxiv.org/abs/1810.08473

## Installation

```
npm install graphology-communities-louvain
```

## Usage

Detect the communities of the given graph using Louvain's method.

```js
import louvain from 'graphology-communities-louvain';

// To retrieve the partition
const communities = louvain(graph);

// To directly assign communities as a node attribute
louvain.assign(graph);

// If you need to customize attributes' names
louvain.assign(graph, {
  attributes: {
    weight: 'myCustomWeight',
    community: 'myCustomCommunity'
  }
});
```

*Arguments*

* **graph** *Graph*: graph to which you want to get the best partitioning.
* **options** *?object*: options:
  * **attributes** *?object*: attributes' names:
    * **weight** *?string* [`weight`]: name of the edges' weight attribute.
    * **community** *?string* [`community`]: name of the node attribute holding community information

