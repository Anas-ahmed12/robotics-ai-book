# Robot Nodes Package

This package contains educational ROS 2 nodes for the robotics-ai-book project, demonstrating the fundamental concepts of the robotic nervous system using ROS 2.

## Overview

The `robot_nodes` package includes:

- **Publisher/Subscriber Nodes**: Basic communication patterns
- **Service/Client Nodes**: Request-response communication
- **Python Agent Bridge**: Integration between Python applications and ROS 2
- **URDF Model**: Simple humanoid robot description

## Installation

1. Make sure you have ROS 2 Humble Hawksbill installed
2. Clone or copy this package to your ROS 2 workspace:
   ```bash
   cd ~/ros2_ws/src
   # Copy the robot_nodes package here
   ```
3. Build the package:
   ```bash
   cd ~/ros2_ws
   colcon build --packages-select robot_nodes
   source install/setup.bash
   ```

## Nodes

### Simple Publisher
Publishes messages to the `robot_commands` topic:

```bash
ros2 run robot_nodes simple_publisher
```

### Simple Subscriber
Subscribes to messages from the `robot_commands` topic:

```bash
ros2 run robot_nodes simple_subscriber
```

### Simple Service
Provides a service for adding two integers:

```bash
ros2 run robot_nodes simple_service
```

### Simple Client
Calls the add_two_ints service:

```bash
ros2 run robot_nodes simple_client <a> <b>
```

### Agent Bridge
Bridges external Python applications with ROS 2:

```bash
ros2 run robot_nodes agent_bridge
```

## Launch Files

Run both publisher and subscriber nodes simultaneously:

```bash
ros2 launch robot_nodes simple_launch.py
```

## URDF Model

The package includes a simple humanoid robot model in `robot_nodes/simple_humanoid.urdf`.

To visualize in RViz:
```bash
# Terminal 1
rviz2

# Terminal 2
ros2 run robot_state_publisher robot_state_publisher --ros-args -p robot_description:=$(cat install/robot_nodes/share/robot_nodes/robot_nodes/simple_humanoid.urdf)
```

## Educational Content

This package is part of the robotics-ai-book educational series. For complete documentation, see the Docusaurus site:

- [Nodes](../../docs/modules/001-ros2-nervous-system/nodes.mdx)
- [Topics](../../docs/modules/001-ros2-nervous-system/topics.mdx)
- [Services](../../docs/modules/001-ros2-nervous-system/services.mdx)
- [URDF](../../docs/modules/001-ros2-nervous-system/urdf.mdx)
- [Python Agent](../../docs/modules/001-ros2-nervous-system/python-agent.mdx)

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.