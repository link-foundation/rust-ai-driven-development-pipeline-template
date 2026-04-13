[![Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](http://unlicense.org/)
[![Crates.io](https://img.shields.io/crates/v/platform-trees?label=crates.io&style=flat)](https://crates.io/crates/platform-trees)
[![CI/CD Pipeline](https://github.com/linksplatform/trees-rs/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/linksplatform/trees-rs/actions?workflow=CI%2FCD+Pipeline)
[![Docs.rs](https://docs.rs/platform-trees/badge.svg)](https://docs.rs/platform-trees)

# [Trees](https://github.com/linksplatform/trees-rs) for Rust

LinksPlatform's `platform-trees` crate — tree and linked list data
structure traits for the Links platform.

Crates.io package: [platform-trees](https://crates.io/crates/platform-trees)

## Overview

This crate provides generic traits for size-balanced binary trees and
circular linked lists used throughout the LinksPlatform ecosystem:

- **`RecursiveSizeBalancedTree<T>`** — Base size-balanced binary tree
  trait with node navigation, tree rotations, size management, and
  tree queries (`contains`, `get_leftest`, `get_rightest`).
- **`IterativeSizeBalancedTree<T>`** — Extends
  `RecursiveSizeBalancedTree` with iterative `attach` and `detach`
  operations that avoid stack overflow on deep trees.
- **`LinkedList<T>`** — Base doubly-linked list trait with
  `get_previous`, `get_next`, `set_previous`, `set_next`.
- **`AbsoluteLinkedList<T>`** — Linked list with direct access to
  `first` and `last` elements and size tracking.
- **`RelativeLinkedList<T>`** — Linked list with head-relative
  positioning, supporting multiple independent lists sharing storage.
- **`AbsoluteCircularLinkedList<T>`** — Circular doubly-linked list
  with absolute positioning: `attach_before`, `attach_after`,
  `attach_as_first`, `attach_as_last`, `detach`.
- **`RelativeCircularLinkedList<T>`** — Circular doubly-linked list
  with head-relative positioning, supporting multiple circular lists
  in shared storage.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
platform-trees = "0.2.0"
```

## Usage

### Implementing `RecursiveSizeBalancedTree`

```rust
use platform_trees::{IterativeSizeBalancedTree, RecursiveSizeBalancedTree};

struct MyTreeStorage {
    nodes: Vec<Node>,
}

struct Node {
    left: usize,
    right: usize,
    size: usize,
}

impl RecursiveSizeBalancedTree<usize> for MyTreeStorage {
    unsafe fn get_mut_left_reference(&mut self, node: usize) -> *mut usize {
        &mut self.nodes[node].left
    }

    unsafe fn get_mut_right_reference(&mut self, node: usize) -> *mut usize {
        &mut self.nodes[node].right
    }

    unsafe fn get_left_reference(&self, node: usize) -> *const usize {
        &self.nodes[node].left
    }

    unsafe fn get_right_reference(&self, node: usize) -> *const usize {
        &self.nodes[node].right
    }

    unsafe fn get_left(&self, node: usize) -> usize {
        self.nodes[node].left
    }

    unsafe fn get_right(&self, node: usize) -> usize {
        self.nodes[node].right
    }

    unsafe fn get_size(&self, node: usize) -> usize {
        self.nodes[node].size
    }

    unsafe fn set_left(&mut self, node: usize, left: usize) {
        self.nodes[node].left = left;
    }

    unsafe fn set_right(&mut self, node: usize, right: usize) {
        self.nodes[node].right = right;
    }

    unsafe fn set_size(&mut self, node: usize, size: usize) {
        self.nodes[node].size = size;
    }

    unsafe fn first_is_to_the_left_of_second(&self, first: usize, second: usize) -> bool {
        first < second
    }

    unsafe fn first_is_to_the_right_of_second(&self, first: usize, second: usize) -> bool {
        first > second
    }
}

impl IterativeSizeBalancedTree<usize> for MyTreeStorage {}
```

### Implementing `LinkedList`

```rust
use platform_trees::{LinkedList, AbsoluteLinkedList, AbsoluteCircularLinkedList};

struct MyListStorage {
    elements: Vec<ListElement>,
    first: usize,
    last: usize,
    size: usize,
}

struct ListElement {
    prev: usize,
    next: usize,
}

impl LinkedList<usize> for MyListStorage {
    fn get_previous(&self, element: usize) -> usize {
        self.elements[element].prev
    }

    fn get_next(&self, element: usize) -> usize {
        self.elements[element].next
    }

    fn set_previous(&mut self, element: usize, previous: usize) {
        self.elements[element].prev = previous;
    }

    fn set_next(&mut self, element: usize, next: usize) {
        self.elements[element].next = next;
    }
}

impl AbsoluteLinkedList<usize> for MyListStorage {
    fn get_first(&self) -> usize { self.first }
    fn get_last(&self) -> usize { self.last }
    fn get_size(&self) -> usize { self.size }

    fn set_first(&mut self, element: usize) { self.first = element; }
    fn set_last(&mut self, element: usize) { self.last = element; }
    fn set_size(&mut self, size: usize) { self.size = size; }
}

impl AbsoluteCircularLinkedList<usize> for MyListStorage {}
```

## Depend on

- [num-traits](https://crates.io/crates/num-traits)
- [platform-num](https://crates.io/crates/platform-num)
  ([Numbers](https://github.com/linksplatform/Numbers))

## Dependent libraries

- [doublets](https://crates.io/crates/doublets)
  ([doublets-rs](https://github.com/linksplatform/doublets-rs))

## License

This crate is released to the **public domain** under the [Unlicense](http://unlicense.org/).

The Unlicense is the most permissive license available — it places no
restrictions whatsoever on users. You are free to copy, modify, publish,
use, compile, sell, or distribute this software for any purpose,
commercial or non-commercial, in any way you choose, with no conditions
attached.

Unlike LGPL, which forces users to redistribute modifications under the
same license and comply with specific obligations (linking restrictions,
source disclosure for modifications), the Unlicense imposes
**no obligations at all**. It is truly free as in freedom.
