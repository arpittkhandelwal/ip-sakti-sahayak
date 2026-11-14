// ============================================================
// IP-SAKTI Sahayak – Anonymized Audit Logger
// No PII is logged. Only query hash, sources, confidence.
// DPDP Act 2023 aligned.
// ============================================================

import type { AuditLogEntry, Language, Jurisdiction, IPType, ConfidenceLevel } from '../types/index.js';
import { createHash } from 'crypto';

const auditLog: AuditLogEntry[] = [];

/** Hash a string with SHA-256 (first 16 chars). No PII. */
export function hashQuery(query: string): string {
  return createHash('sha256').update(query).digest('hex').slice(0, 16);
}

export function logQuery(entry: {
  query: string;
  detectedLanguage: Language;
  jurisdiction: Jurisdiction;
  ipType: IPType;
  sourceIds: string[];
  confidence: ConfidenceLevel;
  abstained: boolean;
}): void {
  const logEntry: AuditLogEntry = {
    queryHash: hashQuery(entry.query),
    timestamp: new Date().toISOString(),
    detectedLanguage: entry.detectedLanguage,
    jurisdiction: entry.jurisdiction,
    ipType: entry.ipType,
    sourceIds: entry.sourceIds,
    confidence: entry.confidence,
    abstained: entry.abstained,
  };
  
  auditLog.push(logEntry);
  
  // Console-only logging (no external sink, no PII)
  console.log('[AUDIT]', JSON.stringify(logEntry));
  
  // Keep in-memory log bounded
  if (auditLog.length > 1000) {
    auditLog.shift();
  }
}

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog];
}

