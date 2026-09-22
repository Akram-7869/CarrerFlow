import { db } from '../config/database.js';

export const createTailoringSession = async (data) => {
  const [session] = await db('tailoring_sessions').insert(data).returning('*');
  return session;
};

export const findTailoringSession = (sessionId, userId) =>
  db('tailoring_sessions').where({ id: sessionId, user_id: userId }).first();

export const updateTailoringSession = async (sessionId, userId, changes) => {
  const [session] = await db('tailoring_sessions')
    .where({ id: sessionId, user_id: userId })
    .update({ ...changes, updated_at: db.fn.now() })
    .returning('*');
  return session;
};

export const insertProposals = async (sessionId, proposals) => {
  if (!proposals.length) return [];
  return db('resume_change_proposals').insert(proposals.map((proposal, index) => ({
    tailoring_session_id: sessionId,
    proposal_type: proposal.proposalType,
    section_type: proposal.sectionType,
    item_index: proposal.itemIndex,
    bullet_index: proposal.bulletIndex,
    original_text: proposal.originalText,
    proposed_text: proposal.proposedText,
    rationale: proposal.rationale,
    evidence_refs: JSON.stringify(proposal.evidenceRefs),
    display_order: index,
  }))).returning('*');
};

export const listProposals = (sessionId) =>
  db('resume_change_proposals').where({ tailoring_session_id: sessionId }).orderBy('display_order');

export const findProposal = (proposalId, sessionId) =>
  db('resume_change_proposals').where({ id: proposalId, tailoring_session_id: sessionId }).first();

export const updateProposal = async (proposalId, sessionId, changes) => {
  const [proposal] = await db('resume_change_proposals')
    .where({ id: proposalId, tailoring_session_id: sessionId })
    .update({ ...changes, updated_at: db.fn.now() })
    .returning('*');
  return proposal;
};
