export interface Vector {
  dimensions: number[];
}

export function cosineSimilarity(a: Vector, b: Vector): number {
  if (a.dimensions.length !== b.dimensions.length) {
    throw new Error('Vector dimensions must match');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.dimensions.length; i++) {
    dotProduct += a.dimensions[i] * b.dimensions[i];
    normA += a.dimensions[i] * a.dimensions[i];
    normB += b.dimensions[i] * b.dimensions[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export function euclideanDistance(a: Vector, b: Vector): number {
  if (a.dimensions.length !== b.dimensions.length) {
    throw new Error('Vector dimensions must match');
  }

  let sum = 0;
  for (let i = 0; i < a.dimensions.length; i++) {
    const diff = a.dimensions[i] - b.dimensions[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export function weightedSimilarity(a: Vector, b: Vector, weights: number[]): number {
  if (a.dimensions.length !== b.dimensions.length) {
    throw new Error('Vector dimensions must match');
  }
  if (weights.length !== a.dimensions.length) {
    throw new Error('Weights must match vector dimensions');
  }

  let weightedDot = 0;
  let weightSum = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.dimensions.length; i++) {
    weightedDot += a.dimensions[i] * b.dimensions[i] * weights[i];
    normA += a.dimensions[i] * a.dimensions[i] * weights[i];
    normB += b.dimensions[i] * b.dimensions[i] * weights[i];
    weightSum += weights[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return weightedDot / (normA * normB);
}
