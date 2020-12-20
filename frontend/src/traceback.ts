export type Cell = [row: number, column: number, color: number];

// a Step is an object specifying each cell to highlight
// format of keys is `${row}-${column}`, values are numbers corresponding to the color (different number means different color)
export type Step = { [cellKey: string]: number };

function getBasePairingScore(vi: string, vj: string) {
  const pairs = ['AU', 'UA', 'GC', 'CG'];
  return pairs.includes(`${vi}${vj}`) ? 1 : 0;
}

function stackToStep(stack: Cell[]) {
  const step: Step = {};
  for (const cell of stack) {
    step[`${cell[0]}-${cell[1]}`] = cell[2];
  }
  return step;
}

export function traceback(rnaStrand: string, dpTable: number[][]) {
  const n = dpTable.length;
  // const pairedIndices = [] // list containing which indices i, j in rna_strand are paired
  const steps: Step[] = [];
  const stack: Cell[] = [];
  let currentColor = 0;
  stack.push([0, n - 1, currentColor]) // (0, n - 1) instead of (1, n) to stay within index bounds
  steps.push(stackToStep(stack));

  while (stack.length > 0) {
    const [i, j, color] = stack.pop() as Cell;
    if (i >= j) {
      continue;
    } else if (dpTable[i + 1][j] === dpTable[i][j]) { // i is unpaired
      stack.push([i + 1, j, color]);
    } else if (dpTable[i][j - 1] === dpTable[i][j]) { // j is unpaired
      stack.push([i, j - 1, color]);
    } else if (dpTable[i + 1][j - 1] + 1 === dpTable[i][j] && getBasePairingScore(rnaStrand[i], rnaStrand[j]) == 1) {
      // pairedIndices.push([i, j]); // add to paired indices list
      stack.push([i + 1, j - 1, color]);
    } else {
      for (let k = i + 1; k < j; k++) {
        if (dpTable[i][k] + dpTable[k + 1][j] === dpTable[i][j]) { // bifurcation
          stack.push([k + 1, j, ++currentColor]);
          stack.push([i, k, ++currentColor]);
          break;
        }
      }
    }
    steps.push(stackToStep(stack));
  }

  return steps;
}

