use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use anyhow::{anyhow, bail, Context, Result};
use argh::FromArgs;
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use serde_json::{json, Value};

/// Render a local HTML file or URL in headless Firefox via geckodriver and
/// save desktop + mobile full-page screenshots to a temp directory.
#[derive(FromArgs)]
struct Args {
    /// path to an HTML file or an http(s):// URL
    #[argh(positional)]
    target: String,

    /// label prefix for the output PNGs (defaults to the file stem or URL host)
    #[argh(option)]
    label: Option<String>,

    /// path to the geckodriver binary (defaults to `geckodriver` on PATH,
    /// falling back to ~/.cargo/bin/geckodriver)
    #[argh(option)]
    geckodriver: Option<String>,
}

/// RAII guard: keeps the geckodriver child reachable for the lifetime of the
/// binding and kills + reaps it on every exit path, including panic unwind.
struct ChildGuard(Child);
impl Drop for ChildGuard {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

/// RAII guard that sends `DELETE /session/<id>` on drop so a crash or early
/// return still releases the Firefox session held by geckodriver.
struct SessionGuard<'a> {
    base: &'a str,
    session_id: String,
}
impl<'a> Drop for SessionGuard<'a> {
    fn drop(&mut self) {
        let url = format!("{}/session/{}", self.base, self.session_id);
        let _ = ureq::delete(&url).call();
    }
}

fn main() {
    if let Err(e) = run() {
        eprintln!("render-page: {e:#}");
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let args: Args = argh::from_env();

    let (url, default_label) = resolve_target(&args.target)?;
    let label = args.label.unwrap_or(default_label);

    let gecko = resolve_geckodriver(args.geckodriver.as_deref())?;
    let (child_guard, port) = spawn_geckodriver(&gecko)?;
    let base = format!("http://127.0.0.1:{port}");

    wait_ready(&base, Duration::from_secs(10))
        .context("geckodriver did not become ready within 10s")?;

    let session_id = new_session(&base).context("failed to create WebDriver session")?;
    let session = SessionGuard {
        base: &base,
        session_id,
    };

    let out_dir = tempfile::Builder::new()
        .prefix("mzenas-render-")
        .tempdir()?
        .keep();

    let viewports = [("desktop", 1440u32, 900u32), ("mobile", 390, 844)];
    let mut outputs: Vec<(&str, PathBuf)> = Vec::with_capacity(viewports.len());

    for (suffix, w, h) in viewports {
        set_window_rect(&base, &session.session_id, w, h)?;
        navigate(&base, &session.session_id, &url)?;
        wait_document_ready(&base, &session.session_id, Duration::from_secs(15))?;
        // Brief pause so custom web fonts finish swapping before we snapshot;
        // without it the first viewport occasionally captures fallback glyphs.
        thread::sleep(Duration::from_millis(250));
        let png = full_page_screenshot(&base, &session.session_id)?;
        let path = out_dir.join(format!("{label}-{suffix}.png"));
        std::fs::write(&path, &png)
            .with_context(|| format!("writing screenshot to {}", path.display()))?;
        outputs.push((suffix, path));
    }

    // Drop order matters: the session's DELETE must hit a live geckodriver,
    // so tear the session down first and only then stop the child.
    drop(session);
    drop(child_guard);

    for (label, path) in &outputs {
        println!("{label}: {}", path.display());
    }
    Ok(())
}

fn resolve_target(target: &str) -> Result<(String, String)> {
    if target.starts_with("http://") || target.starts_with("https://") {
        let host = target
            .split('/')
            .nth(2)
            .unwrap_or("page")
            .replace(':', "_");
        return Ok((target.to_string(), host));
    }

    let (path_part, query_part) = match target.split_once('?') {
        Some((p, q)) => (p, Some(q)),
        None => (target, None),
    };

    let p = Path::new(path_part);
    if !p.exists() {
        bail!(
            "target `{target}` is neither an existing file nor an http(s):// URL"
        );
    }
    let abs = std::fs::canonicalize(p)
        .with_context(|| format!("canonicalizing {}", p.display()))?;
    let label = abs
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("page")
        .to_string();
    let url = match query_part {
        Some(q) => format!("file://{}?{}", abs.display(), q),
        None => format!("file://{}", abs.display()),
    };
    Ok((url, label))
}

fn resolve_geckodriver(explicit: Option<&str>) -> Result<String> {
    if let Some(p) = explicit {
        return Ok(p.to_string());
    }
    // Try bare name first (lets PATH win).
    if Command::new("geckodriver")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .is_ok()
    {
        return Ok("geckodriver".to_string());
    }
    if let Some(home) = std::env::var_os("HOME") {
        let cargo_bin = Path::new(&home).join(".cargo/bin/geckodriver");
        if cargo_bin.exists() {
            return Ok(cargo_bin.to_string_lossy().into_owned());
        }
    }
    Err(anyhow!(
        "geckodriver not found — install with `cargo install geckodriver` or pass --geckodriver"
    ))
}

fn spawn_geckodriver(bin: &str) -> Result<(ChildGuard, u16)> {
    // --port 0 asks the OS for a free port; geckodriver logs the chosen port
    // on stdout at info level as `Listening on 127.0.0.1:<port>`.
    let mut child = Command::new(bin)
        .args(["--port", "0", "--log", "info", "--host", "127.0.0.1"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .with_context(|| format!("spawning {bin}"))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| anyhow!("geckodriver stdout not captured"))?;
    let mut reader = BufReader::new(stdout);

    let deadline = Instant::now() + Duration::from_secs(5);
    let mut port: Option<u16> = None;
    let mut line = String::new();
    while Instant::now() < deadline {
        line.clear();
        let n = reader.read_line(&mut line)?;
        if n == 0 {
            break;
        }
        if let Some(rest) = line.split("Listening on").nth(1) {
            if let Some(p) = rest.trim().rsplit(':').next() {
                if let Ok(parsed) = p.trim().parse::<u16>() {
                    port = Some(parsed);
                    break;
                }
            }
        }
    }

    // Drain the rest of stdout in a background thread so the pipe doesn't fill.
    thread::spawn(move || {
        let mut sink = String::new();
        while reader.read_line(&mut sink).unwrap_or(0) > 0 {
            sink.clear();
        }
    });

    match port {
        Some(p) => Ok((ChildGuard(child), p)),
        None => {
            let _ = child.kill();
            Err(anyhow!(
                "could not determine geckodriver port from its stdout"
            ))
        }
    }
}

fn wait_ready(base: &str, timeout: Duration) -> Result<()> {
    let deadline = Instant::now() + timeout;
    let url = format!("{base}/status");
    loop {
        if let Ok(resp) = ureq::get(&url).call() {
            if let Ok(v) = resp.into_json::<Value>() {
                if v["value"]["ready"].as_bool() == Some(true) {
                    return Ok(());
                }
            }
        }
        if Instant::now() >= deadline {
            bail!("timed out waiting for /status");
        }
        thread::sleep(Duration::from_millis(100));
    }
}

fn new_session(base: &str) -> Result<String> {
    let body = json!({
        "capabilities": {
            "alwaysMatch": {
                "browserName": "firefox",
                "moz:firefoxOptions": { "args": ["-headless"] },
                "acceptInsecureCerts": true
            }
        }
    });
    let resp = ureq::post(&format!("{base}/session"))
        .send_json(body)
        .context("POST /session")?;
    let v: Value = resp.into_json()?;
    v["value"]["sessionId"]
        .as_str()
        .map(str::to_string)
        .ok_or_else(|| anyhow!("no sessionId in response: {v}"))
}

fn set_window_rect(base: &str, sid: &str, w: u32, h: u32) -> Result<()> {
    ureq::post(&format!("{base}/session/{sid}/window/rect"))
        .send_json(json!({ "width": w, "height": h, "x": 0, "y": 0 }))
        .context("set window rect")?;
    Ok(())
}

fn navigate(base: &str, sid: &str, url: &str) -> Result<()> {
    ureq::post(&format!("{base}/session/{sid}/url"))
        .send_json(json!({ "url": url }))
        .context("navigate")?;
    Ok(())
}

fn wait_document_ready(base: &str, sid: &str, timeout: Duration) -> Result<()> {
    let deadline = Instant::now() + timeout;
    let url = format!("{base}/session/{sid}/execute/sync");
    loop {
        let resp = ureq::post(&url)
            .send_json(json!({ "script": "return document.readyState", "args": [] }))
            .context("execute readyState")?;
        let v: Value = resp.into_json()?;
        if v["value"].as_str() == Some("complete") {
            return Ok(());
        }
        if Instant::now() >= deadline {
            bail!("document never reached readyState=complete");
        }
        thread::sleep(Duration::from_millis(100));
    }
}

fn full_page_screenshot(base: &str, sid: &str) -> Result<Vec<u8>> {
    let resp = ureq::get(&format!("{base}/session/{sid}/moz/screenshot/full"))
        .call()
        .context("full screenshot")?;
    let v: Value = resp.into_json()?;
    let b64 = v["value"]
        .as_str()
        .ok_or_else(|| anyhow!("screenshot response missing base64 payload"))?;
    Ok(B64.decode(b64)?)
}
