# ROS 2 API Contracts: Robotics Education Module

## Overview
This document defines the API contracts for the ROS 2 Robotics Education Module. These contracts specify the interfaces between different components and the expected message formats for educational purposes.

## Node Communication Contracts

### Publisher Node Contract
**Topic**: `/robot_commands`
**Message Type**: `std_msgs/String`
**Description**: Publisher node sends commands to control the robot

**Message Format**:
```yaml
data: string  # Command string to be sent to the robot
```

**Example**:
```yaml
data: "move_forward"
```

### Subscriber Node Contract
**Topic**: `/robot_commands`
**Message Type**: `std_msgs/String`
**Description**: Subscriber node receives commands from other nodes

**Message Format**:
```yaml
data: string  # Received command string
```

### Publisher-Subscriber Communication Pattern
- Publisher and subscriber must agree on topic name and message type
- Publisher sends messages at a fixed frequency (1 Hz by default)
- Subscriber processes messages as they arrive

## Service Contracts

### Add Two Ints Service
**Service Name**: `/add_two_ints`
**Service Type**: `example_interfaces/srv/AddTwoInts`
**Description**: Service that adds two integer values

**Request Format**:
```yaml
a: int64  # First integer
b: int64  # Second integer
```

**Response Format**:
```yaml
sum: int64  # Sum of the two integers
```

**Example Request**:
```yaml
a: 5
b: 3
```

**Example Response**:
```yaml
sum: 8
```

### Robot Control Service
**Service Name**: `/robot_control`
**Service Type**: `example_interfaces/srv/Trigger`
**Description**: Service to trigger robot actions

**Request Format**:
```yaml
# Empty request
```

**Response Format**:
```yaml
success: bool    # Whether the action was successful
message: string  # Additional information about the result
```

## Python Agent Contracts

### Agent Command Topic
**Topic**: `/agent_commands`
**Message Type**: `std_msgs/String`
**Description**: Topic for commands sent from Python agent to ROS 2 system

**Message Format**:
```yaml
data: string  # Command from the Python agent
```

### Robot Feedback Topic
**Topic**: `/robot_feedback`
**Message Type**: `std_msgs/String`
**Description**: Topic for feedback from robot to Python agent

**Message Format**:
```yaml
data: string  # Feedback message from the robot
```

## Launch File Contracts

### Node Launch Contract
All nodes in the educational module must:
- Have a unique name within the launch context
- Support parameter configuration via launch files
- Output logs to the console for debugging purposes
- Handle graceful shutdown on termination signals

### Launch File Interface
Launch files must:
- Define all required nodes with their package, executable, and name
- Set appropriate parameters for each node
- Configure required remappings for topic connections
- Enable console output for debugging

## URDF Model Contract

### URDF Structure Requirements
All URDF models in the educational module must:
- Have a single base link
- Define proper joint connections between links
- Include visual and collision properties for each link
- Specify inertial properties for physics simulation
- Use proper joint limits where applicable

### Joint Types Supported
- `revolute`: Rotational joint with limits
- `prismatic`: Linear joint with limits
- `fixed`: Rigid connection without movement
- `continuous`: Rotational joint without limits
- `floating`: 6 DOF joint (not recommended for beginners)

## Error Handling Contracts

### Connection Error Handling
- Python agents must implement retry logic for failed connections
- Nodes should log connection status changes
- Error messages should be descriptive and actionable
- Graceful degradation should be implemented when possible

### Message Validation
- All incoming messages should be validated before processing
- Invalid messages should be logged and rejected
- Error responses should follow standard ROS 2 practices
- Validation failures should not crash the system

## Quality of Service (QoS) Contracts

### Default QoS Settings
For educational purposes, the following QoS settings are recommended:

- **Reliability**: Reliable (ensures message delivery)
- **Durability**: Volatile (no message persistence)
- **History**: Keep last N messages (default: 10)
- **Depth**: Queue size (default: 10)

### QoS Configuration
```yaml
reliability: reliable
durability: volatile
history: keep_last
depth: 10
```

## Testing Contracts

### Unit Test Requirements
Each component must include:
- At least 3 unit tests covering basic functionality
- Mock objects for ROS 2 interfaces where appropriate
- Proper test assertions for expected behavior
- Test coverage of error handling paths

### Integration Test Requirements
- Test node-to-node communication
- Verify service request/response cycles
- Validate launch file functionality
- Confirm URDF model loading

## Naming Conventions

### Topic Naming
- Use lowercase with underscores: `/robot_commands`
- Group related topics: `/robot/commands`, `/robot/sensors`
- Avoid special characters except underscores and forward slashes

### Service Naming
- Use lowercase with underscores: `/robot_control`
- Be descriptive but concise: `/get_robot_state`
- Follow the same grouping rules as topics

### Node Naming
- Use descriptive names: `simple_publisher`, `agent_bridge`
- Include functional context: `robot_controller`, `sensor_reader`
- Avoid generic names like `node1`, `node2`

## Validation Checklist

- [ ] All topics have appropriate message types
- [ ] Services have proper request/response structures
- [ ] Node names follow naming conventions
- [ ] Error handling is implemented
- [ ] QoS settings are appropriate for use case
- [ ] URDF models are valid and complete
- [ ] Launch files configure all necessary parameters
- [ ] Components handle graceful shutdown