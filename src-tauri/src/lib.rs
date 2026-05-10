use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tauri::{Emitter, Manager, State};

// === STATE ===========================================================
// Shared state lives behind a Mutex and is registered via .manage().
// Every command receives it through the State<T> extractor.
struct TickerState {
  running: bool,
  count: u64,
  started_at: Option<u64>,
}

#[derive(Serialize, Clone)]
struct Pulse {
  count: u64,
  timestamp: u64,
  elapsed_secs: u64,
}

fn now() -> u64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_secs())
    .unwrap_or(0)
}

// === COMMANDS ========================================================
// Each #[tauri::command] is callable from the frontend via invoke().
// State<T> is automatically injected.

#[tauri::command]
fn start_pulse(state: State<Mutex<TickerState>>) {
  let mut s = state.lock().unwrap();
  if !s.running {
    s.running = true;
    if s.started_at.is_none() {
      s.started_at = Some(now());
    }
  }
}

#[tauri::command]
fn stop_pulse(state: State<Mutex<TickerState>>) {
  let mut s = state.lock().unwrap();
  s.running = false;
}

#[tauri::command]
fn reset_pulse(state: State<Mutex<TickerState>>) {
  let mut s = state.lock().unwrap();
  s.running = false;
  s.count = 0;
  s.started_at = None;
}

#[tauri::command]
fn get_status(state: State<Mutex<TickerState>>) -> bool {
  state.lock().unwrap().running
}

// === RUN =============================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .manage(Mutex::new(TickerState {
      running: false,
      count: 0,
      started_at: None,
    }))
    .invoke_handler(tauri::generate_handler![
      start_pulse,
      stop_pulse,
      reset_pulse,
      get_status
    ])
    .setup(|app| {
      // === EVENTS: background thread emits "pulse" once per second ====
      let app_handle = app.handle().clone();
      std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_secs(1));
        let state: State<Mutex<TickerState>> = app_handle.state();
        let pulse = {
          let mut s = state.lock().unwrap();
          if !s.running {
            continue;
          }
          s.count += 1;
          Pulse {
            count: s.count,
            timestamp: now(),
            elapsed_secs: now().saturating_sub(s.started_at.unwrap_or(now())),
          }
        };
        let _ = app_handle.emit("pulse", pulse);
      });
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
