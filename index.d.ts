import Graph from 'graphology';

export type LouvainOptions = {
  attributes: {
    community: 'community',
    weight: 'weight'
  },
  deltaComputation: 'original' | 'true' | 'fast',
  weighted: boolean
};

type LouvainMapping = {[key: string]: number};

type DetailedLouvainOutput = {
  communities: LouvainMapping,
  count: number,
  deltaComputations: number,
  modularity: number,
  moves: Array<Array<number>>;
};

declare const louvain: {
  (graph: Graph, options?: LouvainOptions): LouvainMapping;
  assign(graph: Graph, options?: LouvainOptions): void;
  detailed(graph: Graph, options?: LouvainOptions): DetailedLouvainOutput;
};

export default louvain;
