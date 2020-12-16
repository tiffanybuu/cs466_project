const API = 'https://nussinov-api.vercel.app';

export type NussinovData = {
  dpTable: number[][],
  maxScore: number,
  pairings: [number, number][], // array of tuples containing 2 numbers
  dashStructure: string,
}

export function nussinov(rnaStrand: string, minLoopParameter: number): Promise<NussinovData> {
  return fetch(`${API}/?rna=${rnaStrand}&minloop=${minLoopParameter}`)
    .then((response) => response.json());
}
