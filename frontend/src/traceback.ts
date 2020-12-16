export type Step = [number, number];

function getBasePairingScore(vi: string, vj: string) {
  const pairs = ['AU', 'UA', 'GC', 'CG'];
  return pairs.includes(`${vi}${vj}`) ? 1 : 0;
}

export function traceback(rnaStrand: string, dpTable: number[][]) {
  const n = dpTable.length;
  // const pairedIndices = [] // list containing which indices i, j in rna_strand are paired
  const steps: Step[] = [];
  const stack: Step[] = [];
  stack.push([0, n - 1]) // (0, n - 1) instead of (1, n) to stay within index bounds
  steps.push([0, n - 1]);

  while (stack.length > 0) {
    const [i, j] = stack.pop() as Step;
    if (i >= j) {
      continue;
    } else if (dpTable[i + 1][j] == dpTable[i][j]) { // i is unpaired
      stack.push([i + 1, j]);
      steps.push([i + 1, j]);
    } else if (dpTable[i][j - 1] == dpTable[i][j]) { // j is unpaired
      stack.push([i, j - 1]);
      steps.push([i, j - 1]);
    } else if (dpTable[i + 1][j - 1] + 1 == dpTable[i][j] && getBasePairingScore(rnaStrand[i], rnaStrand[j]) == 1) {
      // pairedIndices.push([i, j]); // add to paired indices list
      stack.push([i + 1, j - 1]);
      steps.push([i + 1, j - 1]);
    } else {
      for (let k = i + 1; k < j; k++) {
        if (dpTable[i][k] + dpTable[k + 1][j] == dpTable[i][j]) { // bifurcation
          stack.push([k + 1, j]);
          steps.push([k + 1, j]);
          stack.push([i, k]);
          steps.push([i, k]);
          break;
        }
      }
    }
  }

  return steps;
}

