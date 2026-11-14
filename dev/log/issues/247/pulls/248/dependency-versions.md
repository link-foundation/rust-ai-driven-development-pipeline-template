# Complete dependency comparison

Registry snapshot: 2026-11-14 UTC. Before is the prepared branch revision b6ede785b088becebb16be324866a541d61ee7cb.
After includes direct floors, every repository lock entry, and every resolved
inline rust-script project used by this checkout. Versions are deduplicated
per name; the JSON inventories retain every file occurrence. New Python
tool dependencies had no complete tracked manifest before this change.
A published version includes its release metadata suffix; a Cargo floor
without that suffix selects the same release. No package major is forced
through a transitive API constraint. Each retained older release is explained
below with its parent requirement, rather than hidden by an override.

## cargo

| Dependency | Before | Latest stable release | After | Decision |
| --- | --- | --- | --- | --- |
| [adler2](https://crates.io/crates/adler2) | absent | 2.0.1 | 2.0.1 | Current. |
| [aho-corasick](https://crates.io/crates/aho-corasick) | 1.1.4 | 1.1.5 | 1.1.5 | Current. |
| [android_system_properties](https://crates.io/crates/android_system_properties) | absent | 0.1.6 | 0.1.6 | Current. |
| [anstream](https://crates.io/crates/anstream) | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| [anstyle](https://crates.io/crates/anstyle) | 1.0.14 | 1.0.14 | 1.0.14 | Current. |
| [anstyle-parse](https://crates.io/crates/anstyle-parse) | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| [anstyle-query](https://crates.io/crates/anstyle-query) | 1.1.5 | 1.1.5 | 1.1.5 | Current. |
| [anstyle-wincon](https://crates.io/crates/anstyle-wincon) | 3.0.11 | 3.0.11 | 3.0.11 | Current. |
| [autocfg](https://crates.io/crates/autocfg) | absent | 1.5.1 | 1.5.1 | Current. |
| [base64](https://crates.io/crates/base64) | absent | 0.23.1 | 0.23.1 | Current. |
| [bumpalo](https://crates.io/crates/bumpalo) | absent | 3.20.4 | 3.20.4 | Current. |
| [bytes](https://crates.io/crates/bytes) | absent | 1.12.1 | 1.12.1 | Current. |
| [cargo-audit](https://crates.io/crates/cargo-audit) | 0.22.2 | 0.23.0 | 0.23.0 | Current CI tool, explicitly versioned. |
| [cargo-edit](https://crates.io/crates/cargo-edit) | absent | 0.13.14 | removed | Research tool only; not a build dependency. |
| [cargo-llvm-cov](https://crates.io/crates/cargo-llvm-cov) | unversioned | 0.9.1 | 0.9.1 | Current CI tool, explicitly versioned. |
| [cc](https://crates.io/crates/cc) | absent | 1.11.2 | 1.11.2 | Current. |
| [cfg-if](https://crates.io/crates/cfg-if) | absent | 1.0.5 | 1.0.5 | Current. |
| [chrono](https://crates.io/crates/chrono) | 0.4 | 0.4.45 | 0.4.45 | Current. |
| [clap](https://crates.io/crates/clap) | 4.4, 4.6.7 | 4.6.7 | 4.6.7 | Current. |
| [clap_builder](https://crates.io/crates/clap_builder) | 4.6.7 | 4.6.7 | 4.6.7 | Current. |
| [clap_derive](https://crates.io/crates/clap_derive) | 4.6.7 | 4.6.7 | 4.6.7 | Current. |
| [clap_lex](https://crates.io/crates/clap_lex) | 1.1.0 | 1.1.1 | 1.1.1 | Current. |
| [colorchoice](https://crates.io/crates/colorchoice) | 1.0.5 | 1.0.5 | 1.0.5 | Current. |
| [core-foundation-sys](https://crates.io/crates/core-foundation-sys) | absent | 0.8.7 | 0.8.7 | Current. |
| [crc32fast](https://crates.io/crates/crc32fast) | absent | 1.5.5 | 1.5.5 | Current. |
| [ctor](https://crates.io/crates/ctor) | 1.0.14 | 1.0.14 | 1.0.14 | Current. |
| [dotenvy](https://crates.io/crates/dotenvy) | 0.15.7 | 0.15.7 | 0.15.7 | Current. |
| [equivalent](https://crates.io/crates/equivalent) | 1.0.3 | 1.0.3 | 1.0.3 | Current. |
| [find-msvc-tools](https://crates.io/crates/find-msvc-tools) | absent | 0.1.15 | 0.1.15 | Current. |
| [flate2](https://crates.io/crates/flate2) | absent | 1.1.11 | 1.1.11 | Current. |
| [futures-core](https://crates.io/crates/futures-core) | absent | 0.3.34 | 0.3.34 | Current. |
| [futures-task](https://crates.io/crates/futures-task) | absent | 0.3.34 | 0.3.34 | Current. |
| [futures-util](https://crates.io/crates/futures-util) | absent | 0.3.34 | 0.3.34 | Current. |
| [getrandom](https://crates.io/crates/getrandom) | 0.2 | 0.4.3 | 0.2.17, 0.4.3 | Retained transitive API constraint: iana-time-zone@0.1.65 requires ^0.2.1; ring@0.17.14 requires ^0.2.10. Latest compatible resolution; audits clean. |
| [hashbrown](https://crates.io/crates/hashbrown) | 0.17.1 | 0.17.1 | 0.17.1 | Current. |
| [heck](https://crates.io/crates/heck) | 0.5.0 | 0.5.0 | 0.5.0 | Current. |
| [http](https://crates.io/crates/http) | absent | 1.5.0 | 1.5.0 | Current. |
| [httparse](https://crates.io/crates/httparse) | absent | 1.10.1 | 1.10.1 | Current. |
| [iana-time-zone](https://crates.io/crates/iana-time-zone) | absent | 0.1.65 | 0.1.65 | Current. |
| [iana-time-zone-haiku](https://crates.io/crates/iana-time-zone-haiku) | absent | 0.1.2 | 0.1.2 | Current. |
| [indexmap](https://crates.io/crates/indexmap) | 2.14.2 | 2.14.2 | 2.14.2 | Current. |
| [is_terminal_polyfill](https://crates.io/crates/is_terminal_polyfill) | 1.70.2 | 1.70.2 | 1.70.2 | Current. |
| [itoa](https://crates.io/crates/itoa) | 1.0.18 | 1.0.19 | 1.0.19 | Current. |
| [js-sys](https://crates.io/crates/js-sys) | absent | 0.3.107 | 0.3.107 | Current. |
| [libc](https://crates.io/crates/libc) | absent | 0.2.191 | 0.2.191 | Current. |
| [link-section](https://crates.io/crates/link-section) | 0.19.4 | 0.19.4 | 0.19.4 | Current. |
| [linktime-proc-macro](https://crates.io/crates/linktime-proc-macro) | 0.2.3 | 0.2.3 | 0.2.3 | Current. |
| [lino-arguments](https://crates.io/crates/lino-arguments) | 0.5, 0.5.0 | 0.5.0 | 0.5.0 | Current. |
| [lino-env](https://crates.io/crates/lino-env) | 0.1.0 | 0.1.0 | 0.1.0 | Current. |
| [log](https://crates.io/crates/log) | absent | 0.4.35 | 0.4.35 | Current. |
| [memchr](https://crates.io/crates/memchr) | 2.8.0 | 2.8.3 | 2.8.3 | Current. |
| [miniz_oxide](https://crates.io/crates/miniz_oxide) | absent | 0.9.1 | 0.9.1 | Current. |
| [num-traits](https://crates.io/crates/num-traits) | absent | 0.2.19 | 0.2.19 | Current. |
| [once_cell](https://crates.io/crates/once_cell) | absent | 1.21.4 | 1.21.4 | Current. |
| [once_cell_polyfill](https://crates.io/crates/once_cell_polyfill) | 1.70.2 | 1.70.2 | 1.70.2 | Current. |
| [percent-encoding](https://crates.io/crates/percent-encoding) | absent | 2.3.2 | 2.3.2 | Current. |
| [pin-project-lite](https://crates.io/crates/pin-project-lite) | absent | 0.2.17 | 0.2.17 | Current. |
| [proc-macro2](https://crates.io/crates/proc-macro2) | 1.0.107 | 1.0.107 | 1.0.107 | Current. |
| [quote](https://crates.io/crates/quote) | 1.0.47 | 1.0.47 | 1.0.47 | Current. |
| [r-efi](https://crates.io/crates/r-efi) | absent | 7.2.0 | 6.0.0 | Retained transitive API constraint: getrandom@0.4.3 requires ^6. Latest compatible resolution; audits clean. |
| [regex](https://crates.io/crates/regex) | 1, 1.13.1 | 1.13.1 | 1.13.1 | Current. |
| [regex-automata](https://crates.io/crates/regex-automata) | 0.4.18 | 0.4.18 | 0.4.18 | Current. |
| [regex-syntax](https://crates.io/crates/regex-syntax) | 0.8.11 | 0.8.11 | 0.8.11 | Current. |
| [ring](https://crates.io/crates/ring) | absent | 0.17.14 | 0.17.14 | Current. |
| [rust-script](https://crates.io/crates/rust-script) | 0.36.0 | 0.36.0 | 0.36.0 | Current CI tool, explicitly versioned. |
| [rustls](https://crates.io/crates/rustls) | absent | 0.23.46 | 0.23.46 | Current. |
| [rustls-pki-types](https://crates.io/crates/rustls-pki-types) | absent | 1.16.0 | 1.16.0 | Current. |
| [rustls-webpki](https://crates.io/crates/rustls-webpki) | absent | 0.103.17 | 0.103.17 | Current. |
| [rustversion](https://crates.io/crates/rustversion) | absent | 1.0.23 | 1.0.23 | Current. |
| [same-file](https://crates.io/crates/same-file) | 1.0.6 | 1.0.6 | 1.0.6 | Current. |
| [serde](https://crates.io/crates/serde) | 1, 1.0.229 | 1.0.229 | 1.0.229 | Current. |
| [serde_core](https://crates.io/crates/serde_core) | 1.0.229 | 1.0.229 | 1.0.229 | Current. |
| [serde_derive](https://crates.io/crates/serde_derive) | 1.0.229 | 1.0.229 | 1.0.229 | Current. |
| [serde_json](https://crates.io/crates/serde_json) | 1, 1.0.154 | 1.0.154 | 1.0.154 | Current. |
| [serde_spanned](https://crates.io/crates/serde_spanned) | 1.1.3 | 1.1.3 | 1.1.3 | Current. |
| [shlex](https://crates.io/crates/shlex) | absent | 2.0.1 | 2.0.1 | Current. |
| [simd-adler32](https://crates.io/crates/simd-adler32) | absent | 0.3.10 | 0.3.10 | Current. |
| [slab](https://crates.io/crates/slab) | absent | 0.4.12 | 0.4.12 | Current. |
| [strsim](https://crates.io/crates/strsim) | 0.11.1 | 0.11.1 | 0.11.1 | Current. |
| [subtle](https://crates.io/crates/subtle) | absent | 2.6.1 | 2.6.1 | Current. |
| [syn](https://crates.io/crates/syn) | 3.0.10 | 3.0.10 | 2.0.119, 3.0.10 | Retained transitive API constraint: clap_derive@4.6.7 requires ^3.0.2; serde_derive@1.0.229 requires ^3; thiserror-impl@2.0.21 requires ^3; wasm-bindgen-macro-support@0.2.130 requires ^3.0; windows-implement@0.60.2 requires ^2.0; windows-interface@0.59.3 requires ^2.0. Latest compatible resolution; audits clean. |
| [thiserror](https://crates.io/crates/thiserror) | 2.0.21 | 2.0.21 | 2.0.21 | Current. |
| [thiserror-impl](https://crates.io/crates/thiserror-impl) | 2.0.21 | 2.0.21 | 2.0.21 | Current. |
| [toml](https://crates.io/crates/toml) | 0.8, 1.2, 1.2.1+spec-1.1.0 | 1.2.1+spec-1.1.0 | 1.2.1, 1.2.1+spec-1.1.0 | Current. |
| [toml_datetime](https://crates.io/crates/toml_datetime) | 1.1.3+spec-1.1.0 | 1.1.3+spec-1.1.0 | 1.1.3+spec-1.1.0 | Current. |
| [toml_parser](https://crates.io/crates/toml_parser) | 1.1.5+spec-1.1.0 | 1.1.5+spec-1.1.0 | 1.1.5+spec-1.1.0 | Current. |
| [toml_writer](https://crates.io/crates/toml_writer) | 1.2.0+spec-1.1.0 | 1.2.0+spec-1.1.0 | 1.2.0+spec-1.1.0 | Current. |
| [unicode-ident](https://crates.io/crates/unicode-ident) | 1.0.22 | 1.0.27 | 1.0.27 | Current. |
| [untrusted](https://crates.io/crates/untrusted) | absent | 0.9.0 | 0.9.0 | Current. |
| [ureq](https://crates.io/crates/ureq) | 2 | 3.5.2 | 3.5.2 | Current. |
| [ureq-proto](https://crates.io/crates/ureq-proto) | absent | 0.7.1 | 0.7.1 | Current. |
| [utf8-zero](https://crates.io/crates/utf8-zero) | absent | 0.8.1 | 0.8.1 | Current. |
| [utf8parse](https://crates.io/crates/utf8parse) | 0.2.2 | 0.2.2 | 0.2.2 | Current. |
| [walkdir](https://crates.io/crates/walkdir) | 2, 2.5.0 | 2.5.0 | 2.5.0 | Current. |
| [wasi](https://crates.io/crates/wasi) | absent | 0.14.7+wasi-0.2.4 | 0.11.1+wasi-snapshot-preview1 | Retained transitive API constraint: getrandom@0.2.17 requires ^0.11. Latest compatible resolution; audits clean. |
| [wasm-bindgen](https://crates.io/crates/wasm-bindgen) | absent | 0.2.130 | 0.2.130 | Current. |
| [wasm-bindgen-macro](https://crates.io/crates/wasm-bindgen-macro) | absent | 0.2.130 | 0.2.130 | Current. |
| [wasm-bindgen-macro-support](https://crates.io/crates/wasm-bindgen-macro-support) | absent | 0.2.130 | 0.2.130 | Current. |
| [wasm-bindgen-shared](https://crates.io/crates/wasm-bindgen-shared) | absent | 0.2.130 | 0.2.130 | Current. |
| [webpki-roots](https://crates.io/crates/webpki-roots) | absent | 1.0.12 | 1.0.12 | Current. |
| [winapi-util](https://crates.io/crates/winapi-util) | 0.1.11 | 0.1.11 | 0.1.11 | Current. |
| [windows-core](https://crates.io/crates/windows-core) | absent | 0.100.0 | 0.62.2 | Retained transitive API constraint: iana-time-zone@0.1.65 requires >=0.56, <=0.62. Latest compatible resolution; audits clean. |
| [windows-implement](https://crates.io/crates/windows-implement) | absent | 0.100.0 | 0.60.2 | Retained transitive API constraint: windows-core@0.62.2 requires ^0.60.2. Latest compatible resolution; audits clean. |
| [windows-interface](https://crates.io/crates/windows-interface) | absent | 0.100.0 | 0.59.3 | Retained transitive API constraint: windows-core@0.62.2 requires ^0.59.3. Latest compatible resolution; audits clean. |
| [windows-link](https://crates.io/crates/windows-link) | 0.2.1 | 0.100.0 | 0.2.1 | Retained transitive API constraint: chrono@0.4.45 requires ^0.2; windows-core@0.62.2 requires ^0.2.1; windows-result@0.4.1 requires ^0.2.1; windows-strings@0.5.1 requires ^0.2.1; windows-sys@0.61.2 requires ^0.2.1. Latest compatible resolution; audits clean. |
| [windows-result](https://crates.io/crates/windows-result) | absent | 0.100.0 | 0.4.1 | Retained transitive API constraint: windows-core@0.62.2 requires ^0.4.1. Latest compatible resolution; audits clean. |
| [windows-strings](https://crates.io/crates/windows-strings) | absent | 0.100.0 | 0.5.1 | Retained transitive API constraint: windows-core@0.62.2 requires ^0.5.1. Latest compatible resolution; audits clean. |
| [windows-sys](https://crates.io/crates/windows-sys) | 0.61.2 | 0.61.2 | 0.52.0, 0.61.2 | Retained transitive API constraint: anstyle-query@1.1.5 requires >=0.60.2, <0.62; anstyle-wincon@3.0.11 requires >=0.60.2, <0.62; ring@0.17.14 requires ^0.52; winapi-util@0.1.11 requires >=0.48.0, <=0.61. Latest compatible resolution; audits clean. |
| [windows-targets](https://crates.io/crates/windows-targets) | absent | 0.53.5 | 0.52.6 | Retained transitive API constraint: windows-sys@0.52.0 requires ^0.52.0. Latest compatible resolution; audits clean. |
| [windows_aarch64_gnullvm](https://crates.io/crates/windows_aarch64_gnullvm) | absent | 0.53.1 | 0.52.6 | Retained transitive API constraint: windows-targets@0.52.6 requires ^0.52.6. Latest compatible resolution; audits clean. |
| [windows_aarch64_msvc](https://crates.io/crates/windows_aarch64_msvc) | absent | 0.53.1 | 0.52.6 | Retained transitive API constraint: windows-targets@0.52.6 requires ^0.52.6. Latest compatible resolution; audits clean. |
| [windows_i686_gnu](https://crates.io/crates/windows_i686_gnu) | absent | 0.53.1 | 0.52.6 | Retained transitive API constraint: windows-targets@0.52.6 requires ^0.52.6. Latest compatible resolution; audits clean. |
| [windows_i686_gnullvm](https://crates.io/crates/windows_i686_gnullvm) | absent | 0.53.1 | 0.52.6 | Retained transitive API constraint: windows-targets@0.52.6 requires ^0.52.6. Latest compatible resolution; audits clean. |
| [windows_i686_msvc](https://crates.io/crates/windows_i686_msvc) | absent | 0.53.1 | 0.52.6 | Retained transitive API constraint: windows-targets@0.52.6 requires ^0.52.6. Latest compatible resolution; audits clean. |
| [windows_x86_64_gnu](https://crates.io/crates/windows_x86_64_gnu) | absent | 0.53.1 | 0.52.6 | Retained transitive API constraint: windows-targets@0.52.6 requires ^0.52.6. Latest compatible resolution; audits clean. |
| [windows_x86_64_gnullvm](https://crates.io/crates/windows_x86_64_gnullvm) | absent | 0.53.1 | 0.52.6 | Retained transitive API constraint: windows-targets@0.52.6 requires ^0.52.6. Latest compatible resolution; audits clean. |
| [windows_x86_64_msvc](https://crates.io/crates/windows_x86_64_msvc) | absent | 0.53.1 | 0.52.6 | Retained transitive API constraint: windows-targets@0.52.6 requires ^0.52.6. Latest compatible resolution; audits clean. |
| [winnow](https://crates.io/crates/winnow) | 1.0.5 | 1.0.5 | 1.0.5 | Current. |
| [zeroize](https://crates.io/crates/zeroize) | absent | 1.9.1 | 1.9.1 | Current. |
| [zlib-rs](https://crates.io/crates/zlib-rs) | absent | 0.6.8 | 0.6.8 | Current. |
| [zmij](https://crates.io/crates/zmij) | 1.0.21 | 1.0.23 | 1.0.23 | Current. |

## pypi

| Dependency | Before | Latest stable release | After | Decision |
| --- | --- | --- | --- | --- |
| [boolean-py](https://pypi.org/project/boolean-py/) | absent | 5.0 | 5.0 | Current. |
| [cachecontrol](https://pypi.org/project/cachecontrol/) | absent | 0.14.4 | 0.14.4 | Current. |
| [certifi](https://pypi.org/project/certifi/) | absent | 2026.10.23 | 2026.10.23 | Current. |
| [cfgv](https://pypi.org/project/cfgv/) | absent | 3.5.0 | 3.5.0 | Current. |
| [charset-normalizer](https://pypi.org/project/charset-normalizer/) | absent | 3.5.2 | 3.5.2 | Current. |
| [cyclonedx-python-lib](https://pypi.org/project/cyclonedx-python-lib/) | absent | 11.12.0 | 11.12.0 | Current. |
| [defusedxml](https://pypi.org/project/defusedxml/) | absent | 0.7.1 | 0.7.1 | Current. |
| [distlib](https://pypi.org/project/distlib/) | absent | 0.4.4 | 0.4.4 | Current. |
| [filelock](https://pypi.org/project/filelock/) | absent | 4.2.10 | 4.2.10 | Current. |
| [identify](https://pypi.org/project/identify/) | absent | 2.6.20 | 2.6.20 | Current. |
| [idna](https://pypi.org/project/idna/) | absent | 3.20 | 3.20 | Current. |
| [license-expression](https://pypi.org/project/license-expression/) | absent | 30.4.4 | 30.4.4 | Current. |
| [markdown-it-py](https://pypi.org/project/markdown-it-py/) | absent | 4.3.0 | 4.3.0 | Current. |
| [mdurl](https://pypi.org/project/mdurl/) | absent | 0.1.2 | 0.1.2 | Current. |
| [msgpack](https://pypi.org/project/msgpack/) | absent | 1.2.4 | 1.2.4 | Current. |
| [nodeenv](https://pypi.org/project/nodeenv/) | absent | 1.12.0 | 1.12.0 | Current. |
| [packageurl-python](https://pypi.org/project/packageurl-python/) | absent | 0.17.6 | 0.17.6 | Current. |
| [packaging](https://pypi.org/project/packaging/) | absent | 26.3 | 26.3 | Current. |
| [pip](https://pypi.org/project/pip/) | absent | 26.3 | 26.3 | Current. |
| [pip-api](https://pypi.org/project/pip-api/) | absent | 0.0.35 | 0.0.35 | Current. |
| [pip-audit](https://pypi.org/project/pip-audit/) | absent | 2.10.1 | 2.10.1 | Current. |
| [pip-requirements-parser](https://pypi.org/project/pip-requirements-parser/) | absent | 32.0.1 | 32.0.1 | Current. |
| [platformdirs](https://pypi.org/project/platformdirs/) | absent | 4.14.5 | 4.14.5 | Current. |
| [pre-commit](https://pypi.org/project/pre-commit/) | absent | 4.7.0 | 4.7.0 | Current. |
| [pre-commit-hooks](https://pypi.org/project/pre-commit-hooks/) | absent | 6.0.0 | 6.0.0 | Current. |
| [py-serializable](https://pypi.org/project/py-serializable/) | absent | 2.2.0 | 2.2.0 | Current. |
| [pyflakes](https://pypi.org/project/pyflakes/) | absent | 4.1.0 | 4.1.0 | Current. |
| [pygments](https://pypi.org/project/pygments/) | absent | 2.21.0 | 2.21.0 | Current. |
| [pyparsing](https://pypi.org/project/pyparsing/) | absent | 3.3.3 | 3.3.3 | Current. |
| [python-discovery](https://pypi.org/project/python-discovery/) | absent | 1.9.5 | 1.9.5 | Current. |
| [pyyaml](https://pypi.org/project/pyyaml/) | absent | 6.0.3 | 6.0.3 | Current. |
| [requests](https://pypi.org/project/requests/) | absent | 2.34.2 | 2.34.2 | Current. |
| [rich](https://pypi.org/project/rich/) | absent | 15.0.0 | 15.0.0 | Current. |
| [ruamel-yaml](https://pypi.org/project/ruamel-yaml/) | absent | 0.19.1 | 0.19.1 | Current. |
| [shellcheck-py](https://pypi.org/project/shellcheck-py/) | absent | 0.11.0.1 | 0.11.0.1 | Current. |
| [sortedcontainers](https://pypi.org/project/sortedcontainers/) | absent | 2.4.0 | 2.4.0 | Current. |
| [tomli](https://pypi.org/project/tomli/) | absent | 2.5.0 | 2.5.0 | Current. |
| [tomli-w](https://pypi.org/project/tomli-w/) | absent | 1.2.0 | 1.2.0 | Current. |
| [typing-extensions](https://pypi.org/project/typing-extensions/) | absent | 4.16.0 | 4.16.0 | Current. |
| [urllib3](https://pypi.org/project/urllib3/) | absent | 2.8.0 | 2.8.0 | Current. |
| [uv](https://pypi.org/project/uv/) | absent | 0.13.8 | 0.13.8 | Current. |
| [virtualenv](https://pypi.org/project/virtualenv/) | absent | 21.15.6 | 21.15.6 | Current. |
| [zizmor](https://pypi.org/project/zizmor/) | absent | 1.32.0 | 1.32.0 | Current. |

## npm

| Dependency | Before | Latest stable release | After | Decision |
| --- | --- | --- | --- | --- |
| [@azu/format-text](https://registry.npmjs.org/@azu/format-text/latest) | 1.0.2 | 1.0.2 | 1.0.2 | Current. |
| [@azu/style-format](https://registry.npmjs.org/@azu/style-format/latest) | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| [@babel/code-frame](https://registry.npmjs.org/@babel/code-frame/latest) | 7.29.7 | 8.0.6 | 7.29.7 | Retained transitive API constraint: parse-json@8.3.0 requires ^7.26.2. Latest compatible resolution; audits clean. |
| [@babel/helper-validator-identifier](https://registry.npmjs.org/@babel/helper-validator-identifier/latest) | 7.29.7 | 8.0.6 | 7.29.7 | Retained transitive API constraint: @babel/code-frame@7.29.7 requires ^7.29.7. Latest compatible resolution; audits clean. |
| [@secretlint/config-creator](https://registry.npmjs.org/@secretlint/config-creator/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/config-loader](https://registry.npmjs.org/@secretlint/config-loader/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/core](https://registry.npmjs.org/@secretlint/core/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/formatter](https://registry.npmjs.org/@secretlint/formatter/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/node](https://registry.npmjs.org/@secretlint/node/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/profiler](https://registry.npmjs.org/@secretlint/profiler/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/resolver](https://registry.npmjs.org/@secretlint/resolver/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/secretlint-rule-preset-recommend](https://registry.npmjs.org/@secretlint/secretlint-rule-preset-recommend/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/source-creator](https://registry.npmjs.org/@secretlint/source-creator/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/types](https://registry.npmjs.org/@secretlint/types/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@secretlint/walker](https://registry.npmjs.org/@secretlint/walker/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [@textlint/ast-node-types](https://registry.npmjs.org/@textlint/ast-node-types/latest) | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| [@textlint/linter-formatter](https://registry.npmjs.org/@textlint/linter-formatter/latest) | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| [@textlint/module-interop](https://registry.npmjs.org/@textlint/module-interop/latest) | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| [@textlint/resolver](https://registry.npmjs.org/@textlint/resolver/latest) | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| [@textlint/types](https://registry.npmjs.org/@textlint/types/latest) | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| [@types/normalize-package-data](https://registry.npmjs.org/@types/normalize-package-data/latest) | 2.4.4 | 2.4.4 | 2.4.4 | Current. |
| [ajv](https://registry.npmjs.org/ajv/latest) | 8.20.0 | 8.20.0 | 8.20.0 | Current. |
| [ansi-escapes](https://registry.npmjs.org/ansi-escapes/latest) | 7.3.0 | 7.3.0 | 7.3.0 | Current. |
| [ansi-regex](https://registry.npmjs.org/ansi-regex/latest) | 5.0.1, 6.5.0 | 6.6.0 | 5.0.1 | Retained transitive API constraint: strip-ansi@6.0.1 requires ^5.0.1. Latest compatible resolution; audits clean. |
| [ansi-styles](https://registry.npmjs.org/ansi-styles/latest) | 4.3.0 | 7.0.0 | 4.3.0 | Retained transitive API constraint: slice-ansi@4.0.0 requires ^4.0.0. Latest compatible resolution; audits clean. |
| [argparse](https://registry.npmjs.org/argparse/latest) | 2.0.1 | 3.0.4 | 2.0.1 | Retained transitive API constraint: js-yaml@4.3.2 requires ^2.0.1. Latest compatible resolution; audits clean. |
| [astral-regex](https://registry.npmjs.org/astral-regex/latest) | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| [binaryextensions](https://registry.npmjs.org/binaryextensions/latest) | 6.11.0 | 6.11.0 | 6.11.0 | Current. |
| [boundary](https://registry.npmjs.org/boundary/latest) | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| [chalk](https://registry.npmjs.org/chalk/latest) | 5.6.2 | 6.0.1 | 5.6.2 | Retained transitive API constraint: @secretlint/formatter@13.1.0 requires ^5.6.2. Latest compatible resolution; audits clean. |
| [color-convert](https://registry.npmjs.org/color-convert/latest) | 2.0.1 | 3.1.3 | 2.0.1 | Retained transitive API constraint: ansi-styles@4.3.0 requires ^2.0.1. Latest compatible resolution; audits clean. |
| [color-name](https://registry.npmjs.org/color-name/latest) | 1.1.4 | 2.1.1 | 1.1.4 | Retained transitive API constraint: color-convert@2.0.1 requires ~1.1.4. Latest compatible resolution; audits clean. |
| [debug](https://registry.npmjs.org/debug/latest) | 4.4.3 | 4.4.3 | 4.4.3 | Current. |
| [editions](https://registry.npmjs.org/editions/latest) | 6.22.0 | 6.22.0 | 6.22.0 | Current. |
| [emoji-regex](https://registry.npmjs.org/emoji-regex/latest) | 8.0.0 | 11.0.0 | 8.0.0 | Retained transitive API constraint: string-width@4.2.3 requires ^8.0.0. Latest compatible resolution; audits clean. |
| [environment](https://registry.npmjs.org/environment/latest) | 1.1.0 | 1.1.0 | 1.1.0 | Current. |
| [fast-deep-equal](https://registry.npmjs.org/fast-deep-equal/latest) | 3.1.3 | 3.1.3 | 3.1.3 | Current. |
| [fast-uri](https://registry.npmjs.org/fast-uri/latest) | 3.1.9 | 4.2.3 | 3.1.9 | Retained transitive API constraint: ajv@8.20.0 requires ^3.0.1. Latest compatible resolution; audits clean. |
| [has-flag](https://registry.npmjs.org/has-flag/latest) | 5.0.1 | 5.0.1 | 5.0.1 | Current. |
| [hosted-git-info](https://registry.npmjs.org/hosted-git-info/latest) | 9.0.3 | 10.1.1 | 9.0.3 | Retained transitive API constraint: normalize-package-data@8.0.0 requires ^9.0.0. Latest compatible resolution; audits clean. |
| [ignore](https://registry.npmjs.org/ignore/latest) | 7.0.14 | 7.0.14 | 7.0.14 | Current. |
| [index-to-position](https://registry.npmjs.org/index-to-position/latest) | 1.2.0 | 1.2.0 | 1.2.0 | Current. |
| [is-fullwidth-code-point](https://registry.npmjs.org/is-fullwidth-code-point/latest) | 3.0.0 | 5.1.0 | 3.0.0 | Retained transitive API constraint: slice-ansi@4.0.0 requires ^3.0.0; string-width@4.2.3 requires ^3.0.0. Latest compatible resolution; audits clean. |
| [istextorbinary](https://registry.npmjs.org/istextorbinary/latest) | 9.5.0 | 9.5.0 | 9.5.0 | Current. |
| [js-tokens](https://registry.npmjs.org/js-tokens/latest) | 4.0.0 | 10.0.0 | 4.0.0 | Retained transitive API constraint: @babel/code-frame@7.29.7 requires ^4.0.0. Latest compatible resolution; audits clean. |
| [js-yaml](https://registry.npmjs.org/js-yaml/latest) | 4.3.2 | 5.5.0 | 4.3.2 | Retained transitive API constraint: @textlint/linter-formatter@15.8.0 requires ^4.3.0; rc-config-loader@4.1.4 requires ^4.1.1. Latest compatible resolution; audits clean. |
| [json-schema-traverse](https://registry.npmjs.org/json-schema-traverse/latest) | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| [json5](https://registry.npmjs.org/json5/latest) | 2.2.3 | 2.2.3 | 2.2.3 | Current. |
| [lodash](https://registry.npmjs.org/lodash/latest) | 4.18.1 | 4.18.1 | 4.18.1 | Current. |
| [lru-cache](https://registry.npmjs.org/lru-cache/latest) | 11.5.3 | 11.5.3 | 11.5.3 | Current. |
| [ms](https://registry.npmjs.org/ms/latest) | 2.1.3 | 2.1.3 | 2.1.3 | Current. |
| [normalize-package-data](https://registry.npmjs.org/normalize-package-data/latest) | 8.0.0 | 9.0.0 | 8.0.0 | Retained transitive API constraint: read-pkg@10.1.0 requires ^8.0.0. Latest compatible resolution; audits clean. |
| [p-map](https://registry.npmjs.org/p-map/latest) | 7.1.1 | 7.1.1 | 7.1.1 | Current. |
| [parse-json](https://registry.npmjs.org/parse-json/latest) | 8.3.0 | 8.3.0 | 8.3.0 | Current. |
| [picocolors](https://registry.npmjs.org/picocolors/latest) | 1.1.1 | 1.1.1 | 1.1.1 | Current. |
| [picomatch](https://registry.npmjs.org/picomatch/latest) | 4.0.7 | 4.0.7 | 4.0.7 | Current. |
| [pluralize](https://registry.npmjs.org/pluralize/latest) | 2.0.0, 8.0.0 | 8.0.0 | 2.0.0, 8.0.0 | Retained transitive API constraint: @secretlint/formatter@13.1.0 requires ^8.0.0; @textlint/linter-formatter@15.8.0 requires ^2.0.0. Latest compatible resolution; audits clean. |
| [rc-config-loader](https://registry.npmjs.org/rc-config-loader/latest) | 4.1.4 | 4.1.4 | 4.1.4 | Current. |
| [read-pkg](https://registry.npmjs.org/read-pkg/latest) | 10.1.0 | 10.1.0 | 10.1.0 | Current. |
| [require-from-string](https://registry.npmjs.org/require-from-string/latest) | 2.0.2 | 2.0.2 | 2.0.2 | Current. |
| [secretlint](https://registry.npmjs.org/secretlint/latest) | 13.0.7 | 13.1.0 | 13.1.0 | Current. |
| [semver](https://registry.npmjs.org/semver/latest) | 7.8.6 | 7.8.6 | 7.8.6 | Current. |
| [slice-ansi](https://registry.npmjs.org/slice-ansi/latest) | 4.0.0 | 10.0.1 | 4.0.0 | Retained transitive API constraint: table@6.10.1 requires ^4.0.0. Latest compatible resolution; audits clean. |
| [smol-toml](https://registry.npmjs.org/smol-toml/latest) | 1.9.1 | 1.9.1 | 1.9.1 | Current. |
| [spdx-correct](https://registry.npmjs.org/spdx-correct/latest) | 3.2.0 | 3.2.0 | 3.2.0 | Current. |
| [spdx-exceptions](https://registry.npmjs.org/spdx-exceptions/latest) | 2.5.0 | 2.5.0 | 2.5.0 | Current. |
| [spdx-expression-parse](https://registry.npmjs.org/spdx-expression-parse/latest) | 3.0.1 | 5.0.0 | 3.0.1 | Retained transitive API constraint: spdx-correct@3.2.0 requires ^3.0.0; validate-npm-package-license@3.0.4 requires ^3.0.0. Latest compatible resolution; audits clean. |
| [spdx-license-ids](https://registry.npmjs.org/spdx-license-ids/latest) | 3.0.24 | 3.0.24 | 3.0.24 | Current. |
| [string-width](https://registry.npmjs.org/string-width/latest) | 4.2.3 | 9.0.0 | 4.2.3 | Retained transitive API constraint: @textlint/linter-formatter@15.8.0 requires ^4.2.3; table@6.10.1 requires ^4.2.3. Latest compatible resolution; audits clean. |
| [strip-ansi](https://registry.npmjs.org/strip-ansi/latest) | 6.0.1, 7.2.0 | 7.2.0 | 6.0.1 | Retained transitive API constraint: @textlint/linter-formatter@15.8.0 requires ^6.0.1; string-width@4.2.3 requires ^6.0.1; table@6.10.1 requires ^6.0.1. Latest compatible resolution; audits clean. |
| [structured-source](https://registry.npmjs.org/structured-source/latest) | 4.0.0 | 4.0.0 | 4.0.0 | Current. |
| [supports-color](https://registry.npmjs.org/supports-color/latest) | 10.2.2 | 11.0.0 | 10.2.2 | Retained transitive API constraint: supports-hyperlinks@4.6.0 requires ^10.2.2. Latest compatible resolution; audits clean. |
| [supports-hyperlinks](https://registry.npmjs.org/supports-hyperlinks/latest) | 4.6.0 | 5.0.0 | 4.6.0 | Retained transitive API constraint: terminal-link@5.0.0 requires ^4.1.0. Latest compatible resolution; audits clean. |
| [table](https://registry.npmjs.org/table/latest) | 6.10.1 | 6.10.1 | 6.10.1 | Current. |
| [tagged-tag](https://registry.npmjs.org/tagged-tag/latest) | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| [terminal-link](https://registry.npmjs.org/terminal-link/latest) | 5.0.0 | 5.0.0 | 5.0.0 | Current. |
| [text-table](https://registry.npmjs.org/text-table/latest) | 0.2.0 | 0.2.0 | 0.2.0 | Current. |
| [textextensions](https://registry.npmjs.org/textextensions/latest) | 6.11.0 | 6.11.0 | 6.11.0 | Current. |
| [type-fest](https://registry.npmjs.org/type-fest/latest) | 4.41.0, 5.10.0 | 5.10.0 | 4.41.0, 5.10.0 | Retained transitive API constraint: parse-json@8.3.0 requires ^4.39.1; read-pkg@10.1.0 requires ^5.4.4. Latest compatible resolution; audits clean. |
| [unicorn-magic](https://registry.npmjs.org/unicorn-magic/latest) | 0.4.1 | 0.4.1 | 0.4.1 | Current. |
| [validate-npm-package-license](https://registry.npmjs.org/validate-npm-package-license/latest) | 3.0.4 | 3.0.4 | 3.0.4 | Current. |
| [version-range](https://registry.npmjs.org/version-range/latest) | 4.15.0 | 4.15.0 | 4.15.0 | Current. |
| [yaml](https://registry.npmjs.org/yaml/latest) | 2.9.1 | 2.9.1 | 2.9.1 | Current. |

## actions

| Dependency | Before | Latest stable release | After | Decision |
| --- | --- | --- | --- | --- |
| [actions/attest](https://github.com/actions/attest/releases) | v4 | HEAD 683b588c487a69d01f6c6ddf40f036ff682cc2c8 | v4 | Current release alias or verified immutable release commit. |
| [actions/cache](https://github.com/actions/cache/releases) | v6 | v6.1.0 | v6 | Current release alias or verified immutable release commit. |
| [actions/checkout](https://github.com/actions/checkout/releases) | 3d3c42e5aac5ba805825da76410c181273ba90b1, v7 | v7.0.1 | 3d3c42e5aac5ba805825da76410c181273ba90b1, v7 | Current release alias or verified immutable release commit. |
| [actions/configure-pages](https://github.com/actions/configure-pages/releases) | v6 | v6.0.0 | v6 | Current release alias or verified immutable release commit. |
| [actions/dependency-review-action](https://github.com/actions/dependency-review-action/releases) | v5 | v5.0.0 | v5 | Current release alias or verified immutable release commit. |
| [actions/deploy-pages](https://github.com/actions/deploy-pages/releases) | v5 | v5.0.1 | v5 | Current release alias or verified immutable release commit. |
| [actions/download-artifact](https://github.com/actions/download-artifact/releases) | 9000827ccba6bdab643e8b6fd33ac0654aef8333 | v8.0.2 | 9000827ccba6bdab643e8b6fd33ac0654aef8333 | Current release alias or verified immutable release commit. |
| [actions/setup-node](https://github.com/actions/setup-node/releases) | 949feb2413d6458794dcd2491c4babbbce0c15c1 | v7.1.0 | 949feb2413d6458794dcd2491c4babbbce0c15c1 | Current release alias or verified immutable release commit. |
| [actions/setup-python](https://github.com/actions/setup-python/releases) | absent | v7.1.0 | v7.1.0 | Current release alias or verified immutable release commit. |
| [actions/upload-artifact](https://github.com/actions/upload-artifact/releases) | v7 | v7.0.2 | v7 | Current release alias or verified immutable release commit. |
| [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact/releases) | v5 | v5.0.0 | v5 | Current release alias or verified immutable release commit. |
| [codecov/codecov-action](https://github.com/codecov/codecov-action/releases) | 303a32d7a59b442fa8d48b6a1cc6825c09c847a5 | v7.1.1 | 303a32d7a59b442fa8d48b6a1cc6825c09c847a5 | Current release alias or verified immutable release commit. |
| [docker/build-push-action](https://github.com/docker/build-push-action/releases) | v7 | v7.4.0 | v7 | Current release alias or verified immutable release commit. |
| [docker/login-action](https://github.com/docker/login-action/releases) | v4 | v4.8.0 | v4 | Current release alias or verified immutable release commit. |
| [docker/setup-buildx-action](https://github.com/docker/setup-buildx-action/releases) | v4 | v4.4.1 | v4 | Current release alias or verified immutable release commit. |
| [dtolnay/rust-toolchain](https://github.com/dtolnay/rust-toolchain/releases) | 683b588c487a69d01f6c6ddf40f036ff682cc2c8 | HEAD 683b588c487a69d01f6c6ddf40f036ff682cc2c8 | 683b588c487a69d01f6c6ddf40f036ff682cc2c8 | Upstream default branch has no newer release; verified HEAD, explicit compiler input. |
| [github/codeql-action](https://github.com/github/codeql-action/releases) | v4 | v4.39.3 | v4 | Current release alias or verified immutable release commit. Latest-release API returns a CLI bundle; action release verified separately. |
| [lycheeverse/lychee-action](https://github.com/lycheeverse/lychee-action/releases) | v2 | v2.9.0 | v2 | Current release alias or verified immutable release commit. |
| [peter-evans/create-pull-request](https://github.com/peter-evans/create-pull-request/releases) | 15733dbdfeedb4f7fdb73d13c6f5ac83b710fab8 | v8.1.3 | 3ffccacd46053766916f087ce41d627c0b8cf2d1 | Current release alias or verified immutable release commit. |
| [rust-lang/crates-io-auth-action](https://github.com/rust-lang/crates-io-auth-action/releases) | 3268eb413133e2960fa4ae0e963ca76380c54cd9 | v1.0.6 | 3268eb413133e2960fa4ae0e963ca76380c54cd9 | Current release alias or verified immutable release commit. |
| [taiki-e/install-action](https://github.com/taiki-e/install-action/releases) | 3a3daafd3b7f23b8f65d9f5ba2db203fb59b79e2 | v2.90.3 | cfdb7ed4ccc7c7dce37759eae89dc5674b469b39 | Current release alias or verified immutable release commit. |
| [zizmorcore/zizmor-action](https://github.com/zizmorcore/zizmor-action/releases) | v0.8.1 | v0.8.1 | v0.8.1 | Current release alias or verified immutable release commit. |
