// const API = 'https://nussinov-api.vercel.app';
const API = 'http://127.0.0.1:5000';

type NussinovData = {
  dpTable: number[][],
  maxScore: number,
  pairings: [number, number][], // array of tuples containing 2 numbers
  dashStructure: string,
}

export function nussinov(rnaStrand: string, minLoopParameter: number): Promise<NussinovData> {
  return fetch(`${API}/?rna=${rnaStrand}&minloop=${minLoopParameter}`)
    .then((response) => response.json());
}