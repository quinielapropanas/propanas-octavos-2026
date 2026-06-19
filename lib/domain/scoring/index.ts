// Scoring domain barrel
export { matchPairing, validateExclusionRules, shouldSkipConcepts3and4 } from './pairing-matcher';
export { evaluateMatchConcepts } from './match-scoring';
export { evaluateGroupConcepts, evaluateAdvanceConcepts, evaluateGlobalConcepts, calculateGoalAverage } from './scoring-modules';
export { evaluateAllConcepts, buildRanking } from './score-evaluator';
export type { EvaluatorInput } from './score-evaluator';
