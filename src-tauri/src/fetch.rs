use futures_util::StreamExt;
use futures_util::stream::{Abortable, AbortHandle};
use std::collections::HashMap;

use tauri::Manager;
use reqwest::{Client, header::{HeaderMap, HeaderName}};
use serde::{Serialize, Deserialize};

use crate::APP_HANDLE;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct FetchOptions {
    method: String,
    headers: HashMap<String, String>,
    body: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct StreamChunk {
    id: String,
    data: String,
    done: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct AbortEventPayload {
    id: String,
}

#[tauri::command]
pub async fn fetch_stream(id: String, url: String, options_str: String) -> Result<String, String> {
    let options: FetchOptions = serde_json::from_str(&options_str).unwrap();
    let mut headers = HeaderMap::new();
    for (key, value) in options.headers {
        headers.insert(key.parse::<HeaderName>().unwrap(), value.parse().unwrap());
    }

    let client = Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|err| format!("failed to generate client: {}", err))?;
    
    let request_builder = client.request(options.method.parse().unwrap(), url.parse::<reqwest::Url>().unwrap());

    let stream = request_builder
        .body(options.body)
        .send()
        .await
        .map_err(|err| format!("failed to call API: {}", err))?
        .bytes_stream();

    let app_handle = APP_HANDLE.get().unwrap();
    let (abort_handle, abort_registration) = AbortHandle::new_pair();
    let cloned_id = id.clone();
    let listen_id = app_handle.listen_global("abort-fetch-stream", move |msg| {
        let payload: AbortEventPayload = serde_json::from_str(&msg.payload()).unwrap();
        if payload.id == cloned_id {
            abort_handle.abort();
        }
    });

    let mut stream = Abortable::new(stream, abort_registration);

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|err| format!("failed to read response: {}", err))?;
        let chunk_str = String::from_utf8(chunk.to_vec()).unwrap();
        // use debug_print::debug_println;
        // debug_println!("chunk: {}", chunk_str);
        app_handle.emit("fetch-stream-chunk", StreamChunk {
            id: id.clone(),
            data: chunk_str.clone(),
            done: false,
        }).unwrap();
    }

    app_handle.emit("fetch-stream-chunk", StreamChunk {
        id: id.clone(),
        data: "".to_string(),
        done: true,
    }).unwrap();

    app_handle.unlisten(listen_id);

    Ok("".to_string())
}
