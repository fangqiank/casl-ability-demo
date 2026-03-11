/**
 * Universal CASL-based Permission System
 * Main entry point - exports all public APIs
 *
 * @version 1.0.0
 */

// Core types and interfaces
export * from "./core/types";

// Core builders and utilities
export * from "./core/builder";

// Permission checking utilities
export * from "./core/permissions";

// Query adapters for different ORMs
export * from "./core/adapter";

// Preset configurations
export * from "./presets";
