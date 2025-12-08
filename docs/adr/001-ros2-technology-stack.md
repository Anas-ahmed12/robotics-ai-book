# ADR-001: ROS 2 Technology Stack

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-06
- **Feature:** 001-ros2-nervous-system
- **Context:** Need to establish a stable, educational-friendly technology stack for humanoid robot control using ROS 2 middleware. The decision impacts how students will learn ROS 2 concepts and how engineers will structure the educational modules.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

- **ROS Distribution**: ROS 2 Humble Hawksbill (LTS) - provides long-term support and stability for educational use
- **Programming Language**: Python 3.8+ - ensures compatibility with ROS 2 Humble and provides beginner-friendly syntax
- **ROS Client Library**: rclpy - Python client library for ROS 2 communication
- **Simulation Environment**: Gazebo Classic/Ignition - physics simulation for robot environments
- **Visualization Tool**: rviz2 - standard ROS visualization for robot states and URDF models
- **Robot Description Format**: URDF (Unified Robot Description Format) - standard for humanoid kinematics
- **Launch System**: ROS 2 launch files - Python-based launch system for node orchestration
- **Testing Framework**: pytest + ROS 2 testing framework - combines Python testing with ROS-specific testing

## Consequences

### Positive

- Long-term support and stability with LTS ROS 2 distribution
- Educational focus with beginner-friendly Python syntax
- Full ROS 2 ecosystem integration with standard tools (rviz2, Gazebo)
- Proper separation of concerns with modular node architecture
- Industry-standard practices that align with professional robotics development
- Comprehensive testing approach covering both Python and ROS-specific aspects

### Negative

- Ubuntu 22.04 dependency limits cross-platform compatibility initially
- Learning curve for students new to ROS 2 concepts
- Potential complexity in initial setup for students
- Dependency on specific ROS 2 API versions creates upgrade challenges later

## Alternatives Considered

- **Alternative A**: ROS 2 Rolling + Python 3.9+ + Webots - Would provide newer features but lacks LTS stability and educational support
- **Alternative B**: ROS 1 Noetic + Python 2.7 - Familiar to some but lacks modern features and Python 2 is deprecated
- **Alternative C**: Custom communication layer without ROS 2 - Would avoid ROS 2 complexity but miss industry standard practices and rich ecosystem
- **Alternative D**: Iron Irwini + PyBullet - More modern but Iron is not LTS and PyBullet has less ROS 2 native integration

## References

- Feature Spec: specs/001-ros2-nervous-system/spec.md
- Implementation Plan: specs/001-ros2-nervous-system/plan.md
- Related ADRs: None
- Evaluator Evidence: specs/001-ros2-nervous-system/research.md