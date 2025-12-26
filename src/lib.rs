//! Example module entry point.
//!
//! Replace this with your actual implementation.

/// Package version (matches Cargo.toml version).
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Adds two numbers together.
///
/// # Arguments
///
/// * `a` - First number
/// * `b` - Second number
///
/// # Returns
///
/// Sum of `a` and `b`
///
/// # Examples
///
/// ```
/// use my_package::add;
/// assert_eq!(add(2, 3), 5);
/// ```
#[must_use]
pub const fn add(a: i64, b: i64) -> i64 {
    a + b
}

/// Multiplies two numbers together.
///
/// # Arguments
///
/// * `a` - First number
/// * `b` - Second number
///
/// # Returns
///
/// Product of `a` and `b`
///
/// # Examples
///
/// ```
/// use my_package::multiply;
/// assert_eq!(multiply(2, 3), 6);
/// ```
#[must_use]
pub const fn multiply(a: i64, b: i64) -> i64 {
    a * b
}

/// Async delay function.
///
/// # Arguments
///
/// * `seconds` - Duration to wait in seconds
///
/// # Examples
///
/// ```
/// use my_package::delay;
///
/// #[tokio::main]
/// async fn main() {
///     delay(0.1).await;
/// }
/// ```
pub async fn delay(seconds: f64) {
    let duration = std::time::Duration::from_secs_f64(seconds);
    tokio::time::sleep(duration).await;
}

#[cfg(test)]
mod tests {
    use super::*;

    mod add_tests {
        use super::*;

        #[test]
        fn test_add_positive_numbers() {
            assert_eq!(add(2, 3), 5);
        }

        #[test]
        fn test_add_negative_numbers() {
            assert_eq!(add(-1, -2), -3);
        }

        #[test]
        fn test_add_zero() {
            assert_eq!(add(5, 0), 5);
        }

        #[test]
        fn test_add_large_numbers() {
            assert_eq!(add(1_000_000, 2_000_000), 3_000_000);
        }
    }

    mod multiply_tests {
        use super::*;

        #[test]
        fn test_multiply_positive_numbers() {
            assert_eq!(multiply(2, 3), 6);
        }

        #[test]
        fn test_multiply_by_zero() {
            assert_eq!(multiply(5, 0), 0);
        }

        #[test]
        fn test_multiply_negative_numbers() {
            assert_eq!(multiply(-2, 3), -6);
        }

        #[test]
        fn test_multiply_two_negatives() {
            assert_eq!(multiply(-2, -3), 6);
        }
    }

    mod delay_tests {
        use super::*;

        #[tokio::test]
        async fn test_delay() {
            let start = std::time::Instant::now();
            delay(0.1).await;
            let elapsed = start.elapsed();
            assert!(elapsed.as_secs_f64() >= 0.1);
        }
    }
}
