use tauri::State;
use crate::db::{DbPool, upsert_session, list_sessions, append_event, get_rev, mark_device_paired, save_pairing_code, verify_pairing_code};
use crate::ws_server::{WsHandle, broadcast_event};
use serde_json::json;
use chrono::Utc;
use uuid::Uuid;
use fastrand;

#[tauri::command]
pub fn list_sessions_cmd(db_pool: State<'_, DbPool>) -> Result<String, String> {
    let sessions = list_sessions(&db_pool).map_err(|e| e.to_string())?;
    Ok(serde_json::to_string(&sessions).map_err(|e| e.to_string())?)
}

#[tauri::command]
pub fn resolve_permission(
    db_pool: State<'_, DbPool>,
    ws_handle: State<'_, WsHandle>,
    session_id: String,
    req_id: String,
    allow: bool,
) -> Result<String, String> {
    let conn = db_pool.0.lock().map_err(|e| e.to_string())?;
    let status = if allow { "working" } else { "idle" };
    conn.execute(
        "UPDATE sessions SET status = ?1, pending_permission = NULL WHERE id = ?2",
        rusqlite::params![status, session_id],
    ).map_err(|e| e.to_string())?;
    drop(conn);

    let event = json!({
        "v": 1,
        "type": "event",
        "event": "session.permission.resolve",
        "data": {
            "sessionId": session_id,
            "reqId": req_id,
            "allow": allow,
            "resolvedAt": Utc::now().timestamp(),
        },
    });

    let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
    rt.block_on(broadcast_event(&ws_handle.event_bus, &event));

    Ok(json!({"ok": true, "sessionId": session_id, "allow": allow}).to_string())
}

#[tauri::command]
pub fn send_reply(
    db_pool: State<'_, DbPool>,
    session_id: String,
    text: String,
) -> Result<String, String> {
    let ts = Utc::now().timestamp();
    append_event(&db_pool, &session_id, ts, "response", &json!({"text": text}).to_string())
        .map_err(|e| e.to_string())?;
    Ok(json!({"ok": true, "sessionId": session_id, "ts": ts}).to_string())
}

#[tauri::command]
pub fn pair_device(
    db_pool: State<'_, DbPool>,
    device_id: String,
    code: String,
) -> Result<String, String> {
    if !verify_pairing_code(&db_pool, &device_id, &code).map_err(|e| e.to_string())? {
        return Err("Código de pareamento inválido ou expirado".to_string());
    }
    mark_device_paired(&db_pool, &device_id, "remote", "{}")
        .map_err(|e| e.to_string())?;
    Ok(json!({"ok": true, "deviceId": device_id}).to_string())
}

#[tauri::command]
pub fn install_desk_app(
    _path: String,
) -> Result<String, String> {
    Ok(json!({"ok": true, "message": "install_desk_app será implementado no M7"}).to_string())
}

#[tauri::command]
pub fn update_hooks(
    _claude: bool,
    _codex: bool,
) -> Result<String, String> {
    Ok(json!({"ok": true, "message": "update_hooks será implementado no M2"}).to_string())
}

#[tauri::command]
pub fn generate_pairing_code(
    db_pool: State<'_, DbPool>,
    device_id: String,
    client_kind: String,
    capabilities: String,
) -> Result<String, String> {
    let code: String = (0..6).map(|_| fastrand::u8(0..10) + b'0').map(|b| b as char).collect();
    let expires_at = Utc::now().timestamp() + 600;
    save_pairing_code(&db_pool, &device_id, &code, expires_at).map_err(|e| e.to_string())?;
    mark_device_paired(&db_pool, &device_id, &client_kind, &capabilities).map_err(|e| e.to_string())?;
    Ok(json!({"code": code, "ttlSec": 600, "deviceId": device_id}).to_string())
}

#[tauri::command]
pub fn hub_info() -> Result<String, String> {
    Ok(json!({
        "hubId": "coding-outside-hub",
        "wsPort": 8787,
        "mdnsService": "_coding-outside._tcp.local",
        "protocolVersion": 1,
    }).to_string())
}

#[tauri::command]
pub fn simulate_session(
    db_pool: State<'_, DbPool>,
    tool: String,
    label: String,
    cwd: String,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    upsert_session(
        &db_pool,
        &id,
        1,
        &tool,
        "working",
        &cwd,
        &label,
        now,
        now,
        0,
        0,
        0.0,
        Some("Edit main.rs"),
    ).map_err(|e| e.to_string())?;
    Ok(json!({"id": id, "rev": 1, "status": "working"}).to_string())
}

#[tauri::command]
pub fn append_session_event(
    db_pool: State<'_, DbPool>,
    session_id: String,
    kind: String,
    payload: String,
) -> Result<String, String> {
    let ts = Utc::now().timestamp();
    append_event(&db_pool, &session_id, ts, &kind, &payload).map_err(|e| e.to_string())?;
    Ok(json!({"ok": true, "ts": ts}).to_string())
}

#[tauri::command]
pub fn bump_session_rev(
    db_pool: State<'_, DbPool>,
    session_id: String,
) -> Result<String, String> {
    let current = get_rev(&db_pool, &session_id).map_err(|e| e.to_string())?
        .unwrap_or(0);
    let new_rev = current + 1;
    let conn = db_pool.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE sessions SET rev = ?1 WHERE id = ?2",
        rusqlite::params![new_rev, session_id],
    ).map_err(|e| e.to_string())?;
    Ok(json!({"sessionId": session_id, "rev": new_rev}).to_string())
}
