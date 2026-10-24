#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod db;
mod ws_server;
mod commands;

fn main() {
    let db_pool = db::init_db().expect("Falha ao inicializar SQLite");
    let ws_handle = ws_server::start_ws_server(db_pool.clone())
        .expect("Falha ao iniciar servidor WebSocket");
    ws_server::advertise_mdns();

    tauri::Builder::default()
        .manage(db_pool)
        .manage(ws_handle)
        .invoke_handler(tauri::generate_handler![
            commands::list_sessions_cmd,
            commands::resolve_permission,
            commands::send_reply,
            commands::pair_device,
            commands::install_desk_app,
            commands::update_hooks,
            commands::generate_pairing_code,
            commands::hub_info,
            commands::simulate_session,
            commands::append_session_event,
            commands::bump_session_rev,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let _ = window.maximize();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Erro ao executar o Hub");
}
