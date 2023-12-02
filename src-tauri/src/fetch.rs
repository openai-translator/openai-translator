// use debug_print::debug_println;
use futures_util::StreamExt;
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

    let mut stream = request_builder
        .body(options.body)
        .send()
        .await
        .map_err(|err| format!("failed to call API: {}", err))?
        .bytes_stream();

    let app_handle = APP_HANDLE.get().unwrap();
    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|err| format!("failed to read response: {}", err))?;
        let chunk_str = String::from_utf8(chunk.to_vec()).unwrap();
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

    Ok("".to_string())
}
