/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NFA, StateId, Symbol } from '../types';

/**
 * Concatenates two NFAs according to the construction in RegS2.pdf.
 * A1 = (Q1, Σ, δ1, Q01, F1)
 * A2 = (Q2, Σ, δ2, Q02, F2)
 * A• = (Q•, Σ, δ•, Q0•, F•)
 */
export function concatenateNFAs(nfa1: NFA, nfa2: NFA): NFA {
  const states1 = nfa1.states;
  const states2 = nfa2.states;
  const allStates = Array.from(new Set([...states1, ...states2]));
  
  const alphabet = Array.from(new Set([...nfa1.alphabet, ...nfa2.alphabet]));
  
  const transitions: Record<StateId, Record<Symbol, StateId[]>> = {};
  
  // Initialize transitions for all states and symbols
  for (const s of allStates) {
    transitions[s] = {};
    for (const sym of alphabet) {
      transitions[s][sym] = [];
    }
  }

  // Copy transitions from NFA1 and apply concatenation rule
  for (const q of nfa1.states) {
    const q_new = q;
    for (const a of nfa1.alphabet) {
      const targets = nfa1.transitions[q]?.[a] || [];
      const newTargets = [...targets];
      
      // Rule: δ•(q, a) = δ1(q, a) ∪ Q02 if q ∈ Q1 and δ1(q, a) ∩ F1 ≠ ∅
      const hitsFinal = targets.some(t => nfa1.finalStates.includes(t));
      if (hitsFinal) {
        for (const q02 of nfa2.startStates) {
          newTargets.push(q02);
        }
      }
      transitions[q_new][a] = Array.from(new Set(newTargets));
    }
  }
  
  // Copy transitions from NFA2
  for (const q of nfa2.states) {
    const q_new = q;
    for (const a of nfa2.alphabet) {
      const targets = nfa2.transitions[q]?.[a] || [];
      transitions[q_new][a] = [...targets];
    }
  }
  
  // Start states: Q0• = Q01 falls Q01 ∩ F1 = ∅ und Q01 ∪ Q02 sonst.
  const startHitsFinal = nfa1.startStates.some(s => nfa1.finalStates.includes(s));
  let startStates = [...nfa1.startStates];
  if (startHitsFinal) {
    startStates = [...startStates, ...nfa2.startStates];
  }
  
  // Final states: F• = F2
  const finalStates = [...nfa2.finalStates];
  
  return {
    states: allStates,
    alphabet,
    transitions,
    startStates: Array.from(new Set(startStates)),
    finalStates: Array.from(new Set(finalStates))
  };
}
