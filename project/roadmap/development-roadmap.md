# Heptalogos Development Roadmap

**Status:** living roadmap  
**Updated:** 2026-09-25  
**Implementation baseline before this documentation change:** `a5287a01b42e3d09f445e96982caf6842ed74674`

Long-term product design lives in Architecture-Vault. This roadmap only orders implementation capabilities in this repository.

## Current executable foundation

The repository has already established the Foundation and headless Product Host line: bootstrap/host ownership, canonical PostgreSQL mutation, runtime composition, durable work, effect uncertainty, management contracts, a minimal Subject behavior path and a bounded OpenAI provider route. Detailed proof remains in current Specs and qualification records.

Completed plans retain historical execution evidence; they do not define the next product architecture.

## Current architecture transition

The Heptalogos / Nous Wave split is now explicit:

- Nous Wave owns long-term cognition.
- Heptalogos owns Subject agency, interaction, behavior commits, commitments, effects and product runtime.
- The two systems share SubjectId and communicate through typed cognition/agency contracts.

Existing basic Reaction/Behavior specs remain current implementation contracts. Pursuit and external cognition integration require new Plans and Specs before implementation.

## Next capability groups

### 1. Cognition integration contract

Define the implementation boundary for Nous Wave availability, cognition query, Context contribution, Desired Condition input, proposal/receipt flow and SubjectId/revision references. This work must not copy Nous Wave's internal ontology into Heptalogos.

### 2. Pursuit and proactive agency

After the cross-system contract is stable, specify Pursuit lifecycle, adoption/review, revalidation on Desired Condition revision, cancellation/closure, interaction with Attention/Appraisal, and resource competition.

### 3. Commitment integration

Specify how Pursuit, BehaviorIntent, ActionPlan, Commitment/Obligation and WorkItem relate. A completed action or commitment supplies evidence; it does not directly mutate Nous Wave cognition.

### 4. Real interaction surfaces

Continue qualifying external Messaging Drivers, tool/capability execution and effect handling through the existing behavior authority spine. New surfaces must preserve current authority, uncertainty and lineage rules.

### 5. Product lifecycle and distribution

Close remaining platform, source-less, service/headless, update/restore and release qualification only when the corresponding product claim is required.

## Ordering rules

Canonical facts precede durable work. Behavior proposal precedes DecisionCommit. Consequential effects stay behind EffectOperation. Cognition remains an input/proposal source and cannot bypass behavior review. Product management and machine operations retain separate authority paths.

No capability enters implementation solely because it appears in the target design. Each new durable state family receives an accepted Plan and current Spec first.
