//! Basic usage example for my-package.
//!
//! This example demonstrates the basic functionality of the package.
//!
//! Run with: `cargo run --example basic_usage`

use my_package::{add, delay, multiply};

#[tokio::main]
async fn main() {
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

    // Example 3: Working with negative numbers
    println!("Example 3: Working with negative numbers");
    println!("-5 + 10 = {}", add(-5, 10));
    println!("-3 * 4 = {}", multiply(-3, 4));
    println!();

    // Example 4: Async delay
    println!("Example 4: Async delay");
    println!("Waiting for 1 second...");
    delay(1.0).await;
    println!("Done!");
}
