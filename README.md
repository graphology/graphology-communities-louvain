[![Build Status](https://travis-ci.org/graphology/graphology-communities-louvain.svg)](https://travis-ci.org/graphology/graphology-communities-louvain)

# Graphology Communities Louvain

[Louvain method for community detection](https://arxiv.org/pdf/0803.0476v2.pdf) to be used with [`graphology`](https://graphology.github.io).

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

