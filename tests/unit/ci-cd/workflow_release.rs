use std::fs;

fn release_workflow() -> String {
    fs::read_to_string(format!(
        "{}/.github/workflows/release.yml",
        env!("CARGO_MANIFEST_DIR")
    ))
    .unwrap()
    .replace("\r\n", "\n")
}

fn job_block<'a>(workflow: &'a str, job_name: &str) -> &'a str {
    let marker = format!("  {job_name}:\n");
    let start = workflow.find(&marker).unwrap();
    let body_start = start + marker.len();
    let rest = &workflow[body_start..];

    let next_job = rest
        .lines()
        .scan(0usize, |offset, line| {
            let current_offset = *offset;
            *offset += line.len() + 1;
            Some((current_offset, line))
        })
        .find_map(|(offset, line)| {
            let starts_at_job_indent = line.starts_with("  ") && !line.starts_with("    ");
            (starts_at_job_indent && line.trim_end().ends_with(':')).then_some(offset)
        });

    next_job.map_or_else(
        || &workflow[start..],
        |end| &workflow[start..body_start + end],
    )
}

#[test]
fn documentation_deploy_is_independent_from_release_publication() {
    let workflow = release_workflow();
    let deploy_docs = job_block(&workflow, "deploy-docs");

    assert!(deploy_docs.contains("needs: [build]"));
    assert!(deploy_docs.contains("needs.build.result == 'success'"));
    assert!(deploy_docs.contains("github.ref == 'refs/heads/main'"));
    assert!(!deploy_docs.contains("needs: [auto-release, manual-release]"));
    assert!(!deploy_docs.contains("needs.auto-release.result"));
    assert!(!deploy_docs.contains("needs.manual-release.result"));
}
