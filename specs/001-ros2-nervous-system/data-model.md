# Data Model: ROS 2 Robotics Education Module

## Key Entities

### ROS 2 Node
- **Name**: String identifier for the node
- **NodeID**: Unique identifier within the ROS 2 network
- **Status**: Current operational state (active, inactive, error)
- **Topics**: List of subscribed/published topics
- **Services**: List of provided services
- **Parameters**: Configuration parameters
- **Lifecycle**: Node lifecycle state (unconfigured, inactive, active, finalized)

### Topic Message
- **TopicName**: Name of the communication channel
- **MessageType**: Type of message being exchanged (e.g., std_msgs/String, sensor_msgs/JointState)
- **MessageData**: Actual payload data
- **Timestamp**: Time of message creation
- **PublisherNode**: Node that published the message
- **SubscriberNodes**: List of nodes subscribed to this topic

### Service Request/Response
- **ServiceName**: Name of the service
- **ServiceType**: Type definition (e.g., std_srvs/SetBool)
- **RequestData**: Data sent in the request
- **ResponseData**: Data returned in the response
- **ClientNode**: Node making the request
- **ServerNode**: Node providing the service
- **Status**: Request status (pending, success, error)

### URDF Robot Model
- **RobotName**: Name of the robot
- **Links**: Collection of rigid bodies (base_link, link1, link2, etc.)
  - **LinkName**: Unique name for the link
  - **Geometry**: Shape definition (box, cylinder, sphere, mesh)
  - **Visual**: Visual properties (color, material)
  - **Collision**: Collision properties
  - **Inertial**: Mass, center of mass, and inertia properties
- **Joints**: Connections between links
  - **JointName**: Unique name for the joint
  - **JointType**: Type (revolute, prismatic, fixed, etc.)
  - **ParentLink**: Parent link in the kinematic chain
  - **ChildLink**: Child link in the kinematic chain
  - **Limits**: Joint limits (min/max position, velocity, effort)
  - **Origin**: Position and orientation relative to parent

### Python Agent
- **AgentID**: Unique identifier for the agent
- **ConnectionStatus**: Connection state to ROS 2 network
- **CommandQueue**: Pending commands to send to ROS 2
- **CallbackHandlers**: Functions to handle incoming messages
- **ErrorHandling**: Configuration for error recovery
- **RetryPolicy**: Settings for connection retries

## Relationships

### Node-Topic Relationship
- A ROS 2 Node can publish to multiple Topics
- A ROS 2 Node can subscribe to multiple Topics
- Topics facilitate communication between Nodes in a publisher-subscriber pattern

### Node-Service Relationship
- A ROS 2 Node can provide multiple Services
- A ROS 2 Node can call multiple Services as a client
- Services enable synchronous request-response communication between Nodes

### URDF Components Relationship
- Links and Joints form a kinematic tree structure
- Each Joint connects exactly two Links (parent and child)
- The kinematic tree defines the robot's physical structure and movement capabilities

### Agent-Node Relationship
- A Python Agent communicates with multiple ROS 2 Nodes
- Agents send commands to Nodes and receive feedback
- Agents implement higher-level logic that orchestrates Node behavior

## State Transitions

### Node Lifecycle States
- **Unconfigured** → **Inactive**: configure() called
- **Inactive** → **Active**: activate() called
- **Active** → **Inactive**: deactivate() called
- **Inactive** → **Finalized**: cleanup() called
- **Any State** → **Error**: error condition detected

### Connection States
- **Disconnected** → **Connecting**: attempting to connect to ROS 2
- **Connecting** → **Connected**: successful connection established
- **Connected** → **Disconnected**: connection lost or closed
- **Connecting** → **Error**: connection attempt failed

## Validation Rules

### Topic Validation
- Topic names must follow ROS naming conventions (alphanumeric, underscores, forward slashes)
- Publishers and subscribers must use compatible message types
- Topic names must be unique within the ROS 2 network

### Service Validation
- Service names must follow ROS naming conventions
- Request and response types must match between client and server
- Services must have unique names within the ROS 2 network

### URDF Validation
- All links must have unique names
- Joint parent-child relationships must form a valid tree structure (no cycles)
- Joint limits must be within physical constraints
- Mass values must be positive
- Links must have valid geometry definitions

### Agent Validation
- Agents must handle connection failures gracefully
- Command validation must occur before sending to ROS 2
- Error recovery mechanisms must be in place