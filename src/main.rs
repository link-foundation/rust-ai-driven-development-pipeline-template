//! Example binary entry point.
//!
//! This is a simple CLI that demonstrates the library functionality.

use my_package::{add, delay, multiply};

#[tokio::main]
async fn main() {
    println!("my-package v{}", my_package::VERSION);
    println!();

    // Example 1: Basic arithmetic
    println!("Example 1: Basic arithmetic");
    println!("2 + 3 = {}", add(2, 3));
    println!("2 * 3 = {}", multiply(2, 3));
    println!();

    // Example 2: Working with larger numbers
    println!("Example 2: Working with larger numbers");
    println!("1000 + 2000 = {}", add(1000, 2000));
    println!("100 * 200 = {}", multiply(100, 200));
    println!();

    // Example 3: Async delay
    println!("Example 3: Async delay");
    println!("Waiting for 1 second...");
    delay(1.0).await;
    println!("Done!");
}
