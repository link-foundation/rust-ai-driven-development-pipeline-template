//! Shared release lookups: uncertainty must never authorize publication.
//!
//! ```cargo
//! [dependencies]
//! ureq = "3.5.2"
//! serde_json = "1.0.154"
//! ```
#![allow(dead_code)] // Each standalone script uses a different subset of this module.

use std::time::Duration;

// Keep rust-script from wrapping this shared module as an expression.
#[cfg(test)]
fn main() {}

#[derive(Debug)]
pub enum Failure {
    Transient(String),
    Permanent(String),
    UnreadableBody(String),
}

pub fn with_retries<T>(
    attempts: u32,
    delay: Duration,
    mut operation: impl FnMut() -> Result<T, Failure>,
) -> Result<T, String> {
    if !(1..=10).contains(&attempts) {
        return Err("Registry attempts must be between 1 and 10".into());
    }
    for attempt in 1..=attempts {
        match operation() {
            Ok(value) => return Ok(value),
            Err(Failure::Permanent(error)) => return Err(error),
            Err(Failure::Transient(error) | Failure::UnreadableBody(error))
                if attempt == attempts =>
            {
                return Err(format!("{error} (after {attempts} attempts)"));
            }
            Err(Failure::Transient(error) | Failure::UnreadableBody(error)) => {
                eprintln!("Registry lookup retry {}/{attempts}: {error}", attempt + 1);
                std::thread::sleep(delay * 2_u32.pow(attempt - 1));
            }
        }
    }
    unreachable!()
}

fn bounded_agent() -> ureq::Agent {
    ureq::Agent::config_builder()
        .timeout_connect(Some(Duration::from_secs(10)))
        .timeout_per_read(Some(Duration::from_secs(20)))
        .timeout_per_write(Some(Duration::from_secs(20)))
        .timeout_global(Some(Duration::from_secs(30)))
        .http_status_as_error(false)
        .build()
        .into()
}

fn fetch_body(
    agent: &ureq::Agent,
    url: &str,
    headers: &[(&str, &str)],
    user_agent: &str,
) -> Result<Option<String>, Failure> {
    let mut request = agent.get(url).header("User-Agent", user_agent);
    for (key, value) in headers {
        request = request.header(*key, *value);
    }
    let mut response = request
        .call()
        .map_err(|error| Failure::Transient(format!("{url}: {error}")))?;
    match response.status().as_u16() {
        200 => {
            let unreadable =
                |error| Failure::UnreadableBody(format!("Unreadable response from {url}: {error}"));
            // Keep ureq's size bound and require UTF-8 without replacement characters.
            let bytes = response
                .body_mut()
                .read_to_vec()
                .map_err(|error| unreadable(error.to_string()))?;
            String::from_utf8(bytes)
                .map(Some)
                .map_err(|error| unreadable(error.to_string()))
        }
        404 => Ok(None),
        status if status == 429 || status >= 500 => {
            Err(Failure::Transient(format!("{url}: HTTP {status}")))
        }
        status => Err(Failure::Permanent(format!(
            "{url}: unexpected HTTP {status}"
        ))),
    }
}

pub fn get_body_once(url: &str, user_agent: &str) -> Result<Option<String>, Failure> {
    fetch_body(&bounded_agent(), url, &[], user_agent)
}

fn get_body_with_policy(
    url: &str,
    headers: &[(&str, &str)],
    attempts: u32,
    delay: Duration,
) -> Result<Option<String>, String> {
    let agent = bounded_agent();
    with_retries(attempts, delay, || {
        fetch_body(&agent, url, headers, "rust-template-release-check/1.0")
    })
}

pub fn get_body(url: &str, headers: &[(&str, &str)]) -> Result<Option<String>, String> {
    get_body_with_policy(url, headers, 4, Duration::from_secs(1))
}

pub fn or_exit<T>(lookup: &str, result: Result<T, String>) -> T {
    result.unwrap_or_else(|error| {
        eprintln!("::error::{lookup} failed: {error}. Re-run after the service recovers.");
        std::process::exit(1);
    })
}

pub fn parse_semver(version: &str) -> Option<(u32, u32, u32)> {
    let parts: Vec<_> = version.split(['-', '+']).next()?.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    Some((
        parts[0].parse().ok()?,
        parts[1].parse().ok()?,
        parts[2].parse().ok()?,
    ))
}

pub fn parse_max_version_name(body: &str) -> Result<Option<String>, String> {
    let data: serde_json::Value =
        serde_json::from_str(body).map_err(|e| format!("Invalid crates.io JSON: {e}"))?;
    let versions = data
        .get("versions")
        .and_then(serde_json::Value::as_array)
        .ok_or("Missing crates.io versions array")?;
    let mut max: Option<((u32, u32, u32), &str)> = None;
    for version in versions {
        let number = version
            .get("num")
            .and_then(serde_json::Value::as_str)
            .ok_or("Missing version number")?;
        let yanked = version
            .get("yanked")
            .and_then(serde_json::Value::as_bool)
            .ok_or("Missing yanked status")?;
        if !yanked {
            let parsed = parse_semver(number)
                .ok_or_else(|| format!("Unsupported published version: {number}"))?;
            if max.is_none_or(|(current, _)| parsed > current) {
                max = Some((parsed, number));
            }
        }
    }
    Ok(max.map(|(_, number)| number.to_string()))
}

pub fn parse_max_version(body: &str) -> Result<Option<(u32, u32, u32)>, String> {
    Ok(parse_max_version_name(body)?.and_then(|number| parse_semver(&number)))
}

pub fn max_published_name(crate_name: &str) -> Result<Option<String>, String> {
    let url = format!("https://crates.io/api/v1/crates/{crate_name}");
    get_body(&url, &[])?
        .map(|body| parse_max_version_name(&body))
        .transpose()
        .map(Option::flatten)
}

pub fn max_published(crate_name: &str) -> Result<Option<(u32, u32, u32)>, String> {
    Ok(max_published_name(crate_name)?.and_then(|number| parse_semver(&number)))
}

pub fn version_exists(crate_name: &str, version: &str) -> Result<bool, String> {
    let url = format!("https://crates.io/api/v1/crates/{crate_name}/{version}");
    let Some(body) = get_body(&url, &[])? else {
        return Ok(false);
    };
    validate_crate_version(&body, crate_name, version)?;
    Ok(true)
}

pub fn validate_crate_version(body: &str, crate_name: &str, version: &str) -> Result<(), String> {
    let data: serde_json::Value =
        serde_json::from_str(body).map_err(|e| format!("Invalid crates.io JSON: {e}"))?;
    let record = &data["version"];
    let name_matches = record
        .get("crate")
        .is_none_or(|name| name.as_str() == Some(crate_name));
    if record["num"].as_str() != Some(version) || !name_matches {
        return Err(format!(
            "Invalid crates.io version response for {crate_name}@{version}"
        ));
    }
    Ok(())
}

pub fn artifact_exists(
    url: &str,
    headers: &[(&str, &str)],
    field: &str,
    expected: &str,
) -> Result<bool, String> {
    let Some(body) = get_body(url, headers)? else {
        return Ok(false);
    };
    let data: serde_json::Value = serde_json::from_str(&body)
        .map_err(|e| format!("Invalid artifact JSON from {url}: {e}"))?;
    if data.get(field).and_then(serde_json::Value::as_str) != Some(expected) {
        return Err(format!(
            "Invalid artifact response from {url}: expected {field}={expected}"
        ));
    }
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    #[test]
    fn version_response_checks_crate_identity_when_present() {
        for (record, valid) in [
            (r#"{"num":"1.2.3","crate":"fixture"}"#, true),
            (r#"{"num":"1.2.3","crate":"Fixture"}"#, false),
            (r#"{"num":"1.2.3"}"#, true),
            (r#"{"num":"1.2.3","crate":"other"}"#, false),
            (r#"{"num":"1.2.3","crate":null}"#, false),
            (r#"{"num":"1.2.30","crate":"fixture"}"#, false),
        ] {
            let body = format!(r#"{{"version":{record}}}"#);
            assert_eq!(
                validate_crate_version(&body, "fixture", "1.2.3").is_ok(),
                valid
            );
        }
    }

    #[test]
    fn retries_transient_errors_but_not_permanent_errors() {
        let mut calls = 0;
        assert_eq!(
            with_retries(4, Duration::ZERO, || {
                calls += 1;
                if calls < 3 {
                    Err(Failure::Transient("reset".into()))
                } else {
                    Ok(42)
                }
            })
            .unwrap(),
            42
        );
        assert_eq!(calls, 3);
        let error = with_retries::<()>(4, Duration::ZERO, || {
            Err(Failure::Transient("HTTP 503".into()))
        })
        .unwrap_err();
        assert!(error.contains("after 4 attempts"));
        calls = 0;
        assert!(
            with_retries::<()>(4, Duration::ZERO, || {
                calls += 1;
                Err(Failure::Permanent("HTTP 403".into()))
            })
            .is_err()
        );
        assert_eq!(calls, 1);
    }

    #[test]
    fn http_errors_and_dropped_connections_are_not_absence() {
        for statuses in [
            vec![429, 503, 0, 200],
            vec![404],
            vec![403],
            vec![503, 503, 503, 503],
        ] {
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            listener.set_nonblocking(true).unwrap();
            let url = format!("http://{}", listener.local_addr().unwrap());
            let expected = statuses.last().copied().unwrap();
            let server = std::thread::spawn(move || {
                let deadline = std::time::Instant::now() + Duration::from_secs(10);
                for status in statuses {
                    let mut stream = loop {
                        if let Ok((stream, _)) = listener.accept() {
                            break stream;
                        }
                        assert!(
                            std::time::Instant::now() < deadline,
                            "Registry fixture deadline"
                        );
                        std::thread::sleep(Duration::from_millis(1));
                    };
                    stream
                        .set_read_timeout(Some(Duration::from_secs(1)))
                        .unwrap();
                    let _ = stream.read(&mut [0_u8; 4096]);
                    if status != 0 {
                        write!(stream, "HTTP/1.1 {status} Fixture\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok").unwrap();
                    }
                }
            });
            let result = get_body_with_policy(&url, &[], 4, Duration::ZERO);
            server.join().unwrap();
            match expected {
                200 => assert_eq!(result.unwrap(), Some("ok".into())),
                404 => assert_eq!(result.unwrap(), None),
                _ => assert!(result.is_err()),
            }
        }
    }

    #[test]
    fn maximum_version_requires_a_complete_readable_registry_answer() {
        assert_eq!(parse_max_version(r#"{"versions":[{"num":"1.9.0","yanked":false},{"num":"2.0.0","yanked":true},{"num":"1.10.1","yanked":false}]}"#).unwrap(), Some((1,10,1)));
        assert_eq!(parse_max_version(r#"{"versions":[]}"#).unwrap(), None);
        assert_eq!(
            parse_max_version_name(r#"{"versions":[{"num":"2.0.0-rc.1+build","yanked":false}]}"#)
                .unwrap(),
            Some("2.0.0-rc.1+build".into())
        );
        for body in ["not json", "{}", r#"{"versions":[{"num":"1.2.3"}]}"#] {
            assert!(parse_max_version(body).is_err());
        }
    }
}
