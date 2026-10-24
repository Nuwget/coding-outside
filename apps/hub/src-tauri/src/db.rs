use rusqlite::Connection;
use rusqlite::OptionalExtension;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use chrono::Utc;

#[derive(Clone)]
pub struct DbPool(pub Arc<Mutex<Connection>>);

pub fn init_db() -> Result<DbPool, Box<dyn std::error::Error + Send + Sync>> {
    let mut path = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("coding-outside");
    path.push("hub");
    std::fs::create_dir_all(&path)?;
    path.push("hub.db");

    let conn = Connection::open(&path)?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            rev INTEGER NOT NULL DEFAULT 0,
            tool TEXT NOT NULL,
            status TEXT NOT NULL,
            cwd TEXT NOT NULL,
            label TEXT NOT NULL,
            started_at INTEGER NOT NULL,
            last_event_at INTEGER NOT NULL,
            tokens_in INTEGER NOT NULL DEFAULT 0,
            tokens_out INTEGER NOT NULL DEFAULT 0,
            cost_usd REAL NOT NULL DEFAULT 0,
            current_action TEXT,
            pending_permission TEXT
        );
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            ts INTEGER NOT NULL,
            kind TEXT NOT NULL,
            payload TEXT NOT NULL DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            client_kind TEXT NOT NULL,
            paired_at INTEGER NOT NULL,
            last_seen INTEGER NOT NULL,
            capabilities TEXT NOT NULL DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pairing_codes (
            device_id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        );
        "#,
    )?;

    Ok(DbPool(Arc::new(Mutex::new(conn))))
}

pub fn upsert_session(
    pool: &DbPool,
    id: &str,
    rev: i64,
    tool: &str,
    status: &str,
    cwd: &str,
    label: &str,
    started_at: i64,
    last_event_at: i64,
    tokens_in: i64,
    tokens_out: i64,
    cost_usd: f64,
    current_action: Option<&str>,
) -> Result<(), rusqlite::Error> {
    let conn = pool.0.lock().unwrap();
    conn.execute(
        r#"
        INSERT INTO sessions (id, rev, tool, status, cwd, label, started_at, last_event_at, tokens_in, tokens_out, cost_usd, current_action)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        ON CONFLICT(id) DO UPDATE SET
            rev = excluded.rev,
            tool = excluded.tool,
            status = excluded.status,
            cwd = excluded.cwd,
            label = excluded.label,
            started_at = excluded.started_at,
            last_event_at = excluded.last_event_at,
            tokens_in = excluded.tokens_in,
            tokens_out = excluded.tokens_out,
            cost_usd = excluded.cost_usd,
            current_action = excluded.current_action
        "#,
        rusqlite::params![
            id, rev, tool, status, cwd, label, started_at, last_event_at,
            tokens_in, tokens_out, cost_usd, current_action
        ],
    )?;
    Ok(())
}

pub fn list_sessions(pool: &DbPool) -> Result<Vec<serde_json::Value>, rusqlite::Error> {
    let conn = pool.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, rev, tool, status, cwd, label, started_at, last_event_at, tokens_in, tokens_out, cost_usd, current_action FROM sessions ORDER BY last_event_at DESC"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "rev": row.get::<_, i64>(1)?,
            "tool": row.get::<_, String>(2)?,
            "status": row.get::<_, String>(3)?,
            "cwd": row.get::<_, String>(4)?,
            "label": row.get::<_, String>(5)?,
            "startedAt": row.get::<_, i64>(6)?,
            "lastEventAt": row.get::<_, i64>(7)?,
            "tokensIn": row.get::<_, i64>(8)?,
            "tokensOut": row.get::<_, i64>(9)?,
            "costUsd": row.get::<_, f64>(10)?,
            "currentAction": row.get::<_, Option<String>>(11)?,
        }))
    })?;
    let mut sessions = Vec::new();
    for row in rows {
        sessions.push(row?);
    }
    Ok(sessions)
}

pub fn append_event(
    pool: &DbPool,
    session_id: &str,
    ts: i64,
    kind: &str,
    payload: &str,
) -> Result<(), rusqlite::Error> {
    let conn = pool.0.lock().unwrap();
    conn.execute(
        "INSERT INTO events (session_id, ts, kind, payload) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![session_id, ts, kind, payload],
    )?;
    Ok(())
}

pub fn get_rev(pool: &DbPool, id: &str) -> Result<Option<i64>, rusqlite::Error> {
    let conn = pool.0.lock().unwrap();
    conn.query_row(
        "SELECT rev FROM sessions WHERE id = ?1",
        [id],
        |row| row.get::<_, i64>(0),
    )
    .optional()
}

pub fn save_pairing_code(
    pool: &DbPool,
    device_id: &str,
    code: &str,
    expires_at: i64,
) -> Result<(), rusqlite::Error> {
    let conn = pool.0.lock().unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO pairing_codes (device_id, code, expires_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![device_id, code, expires_at],
    )?;
    Ok(())
}

pub fn verify_pairing_code(
    pool: &DbPool,
    device_id: &str,
    code: &str,
) -> Result<bool, rusqlite::Error> {
    let conn = pool.0.lock().unwrap();
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pairing_codes WHERE device_id = ?1 AND code = ?2 AND expires_at > ?3",
        rusqlite::params![device_id, code, Utc::now().timestamp()],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

pub fn mark_device_paired(
    pool: &DbPool,
    device_id: &str,
    client_kind: &str,
    capabilities: &str,
) -> Result<(), rusqlite::Error> {
    let conn = pool.0.lock().unwrap();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT OR REPLACE INTO devices (id, client_kind, paired_at, last_seen, capabilities) VALUES (?1, ?2, ?3, ?3, ?4)",
        rusqlite::params![device_id, client_kind, now, capabilities],
    )?;
    Ok(())
}

pub fn is_device_paired(pool: &DbPool, device_id: &str) -> Result<bool, rusqlite::Error> {
    let conn = pool.0.lock().unwrap();
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM devices WHERE id = ?1",
        [device_id],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}
