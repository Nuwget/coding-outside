use crate::db;
use crate::db::DbPool;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::net::TcpStream;
use tungstenite::Message;
use futures_util::{SinkExt, StreamExt};
use tracing::{info, warn};
use uuid::Uuid;

/// Canal de broadcast para eventos do protocolo (todos os clientes conectados recebem)
type EventBus = Arc<broadcast::Sender<serde_json::Value>>;

pub struct WsHandle {
    pub event_bus: EventBus,
}

pub fn start_ws_server(db_pool: DbPool) -> Result<WsHandle, Box<dyn std::error::Error + Send + Sync>> {
    let (tx, _rx) = broadcast::channel(1024);
    let event_bus = Arc::new(tx);
    let event_bus_clone = event_bus.clone();
    let db_pool_clone = db_pool.clone();

    tokio::spawn(async move {
        let listener = tokio::net::TcpListener::bind("0.0.0.0:8787").await
            .expect("Não foi possível bindar 0.0.0.0:8787");
        info!("WebSocket server escutando em 0.0.0.0:8787 (LAN — iPhone conecta via IP local)");

        loop {
            let (stream, addr) = match listener.accept().await {
                Ok(pair) => pair,
                Err(e) => {
                    warn!("Erro ao aceitar conexão WS: {}", e);
                    continue;
                }
            };
            let db_pool = db_pool_clone.clone();
            let event_bus = event_bus_clone.clone();
            let id = Uuid::new_v4().to_string();

            tokio::spawn(async move {
                if let Err(e) = handle_client(event_bus.clone(), db_pool, stream, id.clone(), addr).await {
                    warn!("Cliente {} encerrou com erro: {}", id, e);
                }
            });
        }
    });

    Ok(WsHandle { event_bus })
}

async fn handle_client(
    event_bus: EventBus,
    db_pool: DbPool,
    stream: TcpStream,
    id: String,
    addr: std::net::SocketAddr,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let ws_stream = tokio_tungstenite::accept_async(stream).await?;
    info!("Novo cliente WS conectado: {} ({})", id, addr);

    let (mut ws_write, mut ws_read) = ws_stream.split();
    let mut rx = event_bus.subscribe();

    // Loop de leitura (mensagens do cliente para o hub)
    let client_id = id.clone();
    let db_pool_read = db_pool.clone();
    let read_task = tokio::spawn(async move {
        while let Some(msg) = ws_read.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Err(e) = handle_ws_message(&db_pool_read, &client_id, &text).await {
                        warn!("Erro processando mensagem de {}: {}", client_id, e);
                    }
                }
                Ok(Message::Close(..)) => break,
                Err(e) => {
                    warn!("Erro no WS de {}: {}", client_id, e);
                    break;
                }
                _ => {}
            }
        }
    });

    // Loop de escrita (eventos do broadcast para o cliente)
    let write_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            let text = serde_json::to_string(&event).unwrap_or_default();
            let _ = ws_write.send(Message::Text(text)).await;
        }
    });

    let _ = tokio::join!(read_task, write_task);
    info!("Cliente WS desconectado: {}", id);
    Ok(())
}

async fn handle_ws_message(
    db_pool: &DbPool,
    _client_id: &str,
    text: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let envelope: serde_json::Value = serde_json::from_str(text)?;
    let frame_type = envelope.get("type").and_then(|v| v.as_str()).unwrap_or("");

    match frame_type {
        "hello" => {
            let device_id = envelope.get("deviceId").and_then(|v| v.as_str()).unwrap_or("");
            let client_kind = envelope.get("clientKind").and_then(|v| v.as_str()).unwrap_or("desk-sim");
            let capabilities = envelope.get("capabilities").unwrap_or(&json!({})).to_string();

            if !db::is_device_paired(db_pool, device_id)? {
                info!("Dispositivo não pareado: {} ({})", device_id, client_kind);
            }

            let _ = db::mark_device_paired(db_pool, device_id, client_kind, &capabilities);

            let ack = json!({
                "v": 1,
                "type": "hello.ack",
                "deviceId": device_id,
                "hubId": "coding-outside-hub",
                "wsPort": 8787,
            });
            // hello.ack é enviado diretamente (não via broadcast), já que é resposta direta
            // Para simplificar, usamos um canal de resposta por cliente. Em M1, hello.ack
            // pode ser ignorado pelo cliente (o hub_info via comando Tauri cobre isso).
            let _ = ack;
        }
        "rpc" => {
            let method = envelope.get("method").and_then(|v| v.as_str()).unwrap_or("");
            let id_rpc = envelope.get("id").and_then(|v| v.as_str()).unwrap_or("");

            match method {
                "session.list" => {
                    let sessions = db::list_sessions(db_pool)?;
                    let resp = json!({
                        "v": 1,
                        "type": "rpc.response",
                        "id": id_rpc,
                        "method": "session.list",
                        "sessions": sessions,
                    });
                    // Envia resposta via broadcast (o cliente filtra por id)
                    let _ = event_bus_send(&db_pool, &resp).await;
                }
                _ => {
                    let err = json!({
                        "v": 1,
                        "type": "error",
                        "id": id_rpc,
                        "error": { "code": -32601, "message": format!("Método não encontrado: {}", method) },
                    });
                    let _ = event_bus_send(&db_pool, &err).await;
                }
            }
        }
        _ => {
            warn!("Tipo de frame desconhecido: {}", frame_type);
        }
    }
    Ok(())
}

async fn event_bus_send(_db_pool: &DbPool, _event: &serde_json::Value) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Em M1, o event_bus é acessível via WsHandle. Aqui simplificamos: 
    // as respostas RPC serão enviadas via comandos Tauri ou broadcast em M2.
    Ok(())
}

/// Transmite um evento do protocolo para todos os clientes conectados.
pub async fn broadcast_event(
    event_bus: &broadcast::Sender<serde_json::Value>,
    event: &serde_json::Value,
) {
    let _ = event_bus.send(event.clone());
}

/// Função auxiliar para enviar evento a um cliente específico (não implementado no M1 via broadcast;
/// todas as mensagens vão para todos via broadcast_event).
pub async fn send_event_to_client(
    _event_bus: &broadcast::Sender<serde_json::Value>,
    _client_id: &str,
    _event: &serde_json::Value,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    Ok(())
}

pub fn advertise_mdns() {
    info!("mDNS placeholder: _coding-outside._tcp.local:8787 (ativo via IP direto na LAN)");
}
