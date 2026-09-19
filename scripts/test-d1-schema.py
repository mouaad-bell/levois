#!/usr/bin/env python3
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "db" / "evidence-library-schema.sql"
TRACE = ROOT / "db" / "content-traceability-schema.sql"
LEGACY = ROOT / "db" / "evidence-library-v21-migration.sql"

def table_columns(db, table):
    return {row[1] for row in db.execute(f"PRAGMA table_info({table})")}

def test_fresh_schema():
    db = sqlite3.connect(":memory:")
    db.executescript(SCHEMA.read_text(encoding="utf-8"))
    db.executescript(TRACE.read_text(encoding="utf-8"))

    # Fresh schema must remain idempotent.
    db.executescript(SCHEMA.read_text(encoding="utf-8"))
    db.executescript(TRACE.read_text(encoding="utf-8"))

    columns = table_columns(db, "evidence")
    required = {
        "evidence_id",
        "engine_use_class",
        "verification_required_before_publication",
        "decision_use",
        "search_text",
    }
    missing = required - columns
    if missing:
        raise SystemExit(f"Fresh schema missing columns: {sorted(missing)}")

    db.execute(
        """
        INSERT INTO evidence (
          evidence_id, topic, claim, library_version,
          engine_use_class, search_text
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            "TEST-1",
            "definitions",
            "Surface du logement",
            "V21",
            "REUSABLE_IMMEDIATELY",
            "surface logement",
        ),
    )
    db.execute(
        """
        INSERT INTO evidence_search (
          evidence_id, topic, subtopic,
          geographic_label, period, claim, decision_use
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "TEST-1",
            "definitions",
            "surface",
            "France",
            "static",
            "Surface du logement",
            "Lire une définition de surface",
        ),
    )
    count = db.execute(
        "SELECT COUNT(*) FROM evidence_search WHERE evidence_search MATCH 'surface'"
    ).fetchone()[0]
    if count != 1:
        raise SystemExit("FTS5 smoke test failed")

    db.execute(
        """
        INSERT INTO content_artifacts (
          artifact_id, artifact_type, title, canon_version,
          content_version, status
        ) VALUES ('A1','article','Test','CONTENT_EXPERIENCE_V1_2026-09-19','draft-1','DRAFT')
        """
    )
    db.execute(
        """
        INSERT INTO content_evidence_dependencies (
          artifact_id, evidence_id, dependency_role,
          evidence_library_version
        ) VALUES ('A1','TEST-1','central','V21')
        """
    )

def test_traceability_lifecycle():
    db = sqlite3.connect(":memory:")
    db.executescript(SCHEMA.read_text(encoding="utf-8"))
    db.executescript(TRACE.read_text(encoding="utf-8"))

    db.execute(
        """
        INSERT INTO evidence (
          evidence_id, topic, claim, library_version,
          status, engine_use_class, next_review_date,
          verification_required_before_publication, search_text
        ) VALUES ('E1','definitions','Test','V21',
                  'VERIFIED','REUSABLE_IMMEDIATELY','2027-01-01',0,'test')
        """
    )

    db.execute(
        """
        INSERT INTO content_artifacts (
          artifact_id, artifact_type, title, canon_version,
          content_version, status
        ) VALUES ('ART1','article','Article test',
                  'CONTENT_EXPERIENCE_V1_2026-09-19','draft-1','DRAFT_REVIEWED')
        """
    )

    db.execute(
        """
        INSERT INTO content_evidence_dependencies (
          artifact_id, evidence_id, dependency_role,
          evidence_library_version,
          evidence_status_snapshot,
          engine_use_class_snapshot,
          next_review_date_snapshot,
          verification_required_before_publication_snapshot
        ) VALUES (
          'ART1','E1','central','V21',
          'VERIFIED','REUSABLE_IMMEDIATELY','2027-01-01',0
        )
        """
    )

    db.execute(
        """
        UPDATE evidence
        SET status='REVERIFIED_PRIMARY',
            engine_use_class='REFRESH_REQUIRED',
            next_review_date='2026-09-19',
            verification_required_before_publication=1
        WHERE evidence_id='E1'
        """
    )

    stale = db.execute(
        """
        SELECT COUNT(*)
        FROM content_evidence_dependencies d
        JOIN evidence e ON e.evidence_id=d.evidence_id
        WHERE COALESCE(d.evidence_status_snapshot,'') <> COALESCE(e.status,'')
           OR COALESCE(d.engine_use_class_snapshot,'') <> COALESCE(e.engine_use_class,'')
           OR COALESCE(d.next_review_date_snapshot,'') <> COALESCE(e.next_review_date,'')
           OR COALESCE(d.verification_required_before_publication_snapshot,0)
              <> COALESCE(e.verification_required_before_publication,0)
        """
    ).fetchone()[0]

    if stale != 1:
        raise SystemExit("Traceability stale detection smoke test failed")

    db.execute(
        """
        INSERT INTO content_review_queue (
          review_id, artifact_id, evidence_id,
          trigger_type, reason, severity, status
        ) VALUES (
          'R1','ART1','E1',
          'EVIDENCE_STATE_CHANGE','Evidence changed','HIGH','OPEN'
        )
        """
    )

    current = db.execute(
        """
        SELECT status, engine_use_class, next_review_date,
               verification_required_before_publication
        FROM evidence WHERE evidence_id='E1'
        """
    ).fetchone()

    db.execute(
        """
        UPDATE content_evidence_dependencies
        SET evidence_status_snapshot=?,
            engine_use_class_snapshot=?,
            next_review_date_snapshot=?,
            verification_required_before_publication_snapshot=?
        WHERE artifact_id='ART1' AND evidence_id='E1'
        """,
        current,
    )
    db.execute(
        """
        UPDATE content_review_queue
        SET status='RESOLVED', resolved_at=CURRENT_TIMESTAMP,
            resolution='Human review complete'
        WHERE review_id='R1'
        """
    )

    remaining = db.execute(
        """
        SELECT COUNT(*)
        FROM content_evidence_dependencies d
        JOIN evidence e ON e.evidence_id=d.evidence_id
        WHERE COALESCE(d.evidence_status_snapshot,'') <> COALESCE(e.status,'')
           OR COALESCE(d.engine_use_class_snapshot,'') <> COALESCE(e.engine_use_class,'')
           OR COALESCE(d.next_review_date_snapshot,'') <> COALESCE(e.next_review_date,'')
           OR COALESCE(d.verification_required_before_publication_snapshot,0)
              <> COALESCE(e.verification_required_before_publication,0)
        """
    ).fetchone()[0]

    if remaining != 0:
        raise SystemExit("Traceability snapshot refresh smoke test failed")


def test_legacy_migration():
    db = sqlite3.connect(":memory:")
    db.executescript(
        """
        CREATE TABLE evidence (
          evidence_id TEXT PRIMARY KEY,
          topic TEXT,
          claim TEXT
        );
        """
    )
    db.executescript(LEGACY.read_text(encoding="utf-8"))

    columns = table_columns(db, "evidence")
    required = {
        "engine_use_class",
        "verification_required_before_publication",
        "search_text",
    }
    missing = required - columns
    if missing:
        raise SystemExit(f"Legacy migration missing columns: {sorted(missing)}")

    fts = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='evidence_search'"
    ).fetchone()
    if not fts:
        raise SystemExit("Legacy migration did not create evidence_search")

if __name__ == "__main__":
    test_fresh_schema()
    test_traceability_lifecycle()
    test_legacy_migration()
    print("D1 schema + traceability smoke test OK")
