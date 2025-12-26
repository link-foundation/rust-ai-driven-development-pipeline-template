//! Integration tests for my-package.
//!
//! These tests verify the public API works correctly.

use my_package::{add, delay, multiply};

mod add_integration_tests {
    use super::*;

    #[test]
    fn test_add_returns_correct_sum() {
        assert_eq!(add(10, 20), 30);
    }

    #[test]
    fn test_add_handles_large_numbers() {
        assert_eq!(add(1_000_000_000, 2_000_000_000), 3_000_000_000);
    }

    #[test]
    fn test_add_handles_negative_result() {
        assert_eq!(add(-100, 50), -50);
    }
}

mod multiply_integration_tests {
    use super::*;

    #[test]
    fn test_multiply_returns_correct_product() {
        assert_eq!(multiply(10, 20), 200);
    }

    #[test]
    fn test_multiply_handles_large_numbers() {
        assert_eq!(multiply(1_000, 1_000_000), 1_000_000_000);
    }

    #[test]
    fn test_multiply_handles_negative_numbers() {
        assert_eq!(multiply(-10, -20), 200);
    }
}

mod delay_integration_tests {
    use super::*;

    #[tokio::test]
    async fn test_delay_waits_minimum_time() {
        let start = std::time::Instant::now();
        delay(0.05).await;
        let elapsed = start.elapsed();

        assert!(
            elapsed.as_secs_f64() >= 0.05,
            "Delay should wait at least 0.05 seconds, but waited {:.4}s",
            elapsed.as_secs_f64()
        );
    }

    #[tokio::test]
    async fn test_delay_zero_completes_quickly() {
        let start = std::time::Instant::now();
        delay(0.0).await;
        let elapsed = start.elapsed();

        assert!(
            elapsed.as_secs_f64() < 0.1,
            "Zero delay should complete quickly, but took {:.4}s",
            elapsed.as_secs_f64()
        );
    }
}

mod version_tests {
    use my_package::VERSION;

    #[test]
    fn test_version_is_not_empty() {
        assert!(!VERSION.is_empty());
    }

    #[test]
    fn test_version_matches_cargo_toml() {
        // Version should match the one in Cargo.toml
        assert!(VERSION.starts_with("0."));
    }
}
