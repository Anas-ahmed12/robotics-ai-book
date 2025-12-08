# Data Model: Gazebo-Unity Digital Twin

## Overview
This document defines the data models for the Gazebo-Unity digital twin simulation environment, focusing on the entities that represent the simulation state, robot models, sensors, and environment configurations.

## Core Entities

### Simulation Environment
**Description**: Represents the 3D world where robotics simulations occur, including terrain, objects, lighting, and physics properties

**Fields**:
- `id` (string): Unique identifier for the environment
- `name` (string): Human-readable name of the environment
- `description` (string): Detailed description of the environment
- `sdf_path` (string): Path to the SDF world file
- `unity_scene_path` (string): Path to the corresponding Unity scene
- `gravity` (Vector3): Gravity vector (x, y, z) in m/s²
- `time_step` (float): Physics simulation time step in seconds
- `real_time_factor` (float): Real-time factor for simulation speed
- `objects` (array): List of objects in the environment
- `lighting_config` (object): Lighting configuration parameters
- `physics_engine` (string): Physics engine used (ODE, Bullet, DART)

**Validation Rules**:
- `id` must be unique across all environments
- `gravity` magnitude should be between 0.1 and 20.0 m/s²
- `time_step` must be positive and typically between 0.001 and 0.01 seconds
- `real_time_factor` must be positive

### Robot Model
**Description**: Represents the physical robot with joints, links, sensors, and control interfaces that interact with the simulation environment

**Fields**:
- `id` (string): Unique identifier for the robot
- `name` (string): Human-readable name of the robot
- `urdf_path` (string): Path to the URDF robot description file
- `sdf_path` (string): Path to the SDF robot description file
- `gazebo_config` (object): Gazebo-specific configuration
- `unity_config` (object): Unity-specific visual configuration
- `joints` (array): List of robot joints with their properties
- `links` (array): List of robot links with their properties
- `sensors` (array): List of sensors attached to the robot
- `controllers` (array): List of robot controllers
- `initial_pose` (Pose): Initial position and orientation in the environment

**Validation Rules**:
- `id` must be unique across all robots
- Either `urdf_path` or `sdf_path` must be provided
- `initial_pose` must have valid position and orientation values
- All joint limits must be physically realistic

### Sensor Data
**Description**: Represents the output from simulated sensors including LiDAR point clouds, depth camera images, and IMU readings

**Fields**:
- `id` (string): Unique identifier for the sensor data instance
- `sensor_id` (string): Reference to the sensor that generated the data
- `timestamp` (float): Simulation time when data was captured
- `sensor_type` (string): Type of sensor (LIDAR, DEPTH_CAMERA, IMU, etc.)
- `data` (object): Sensor-specific data payload
  - For LiDAR: `ranges` (array), `intensities` (array), `angle_min` (float), `angle_max` (float), `angle_increment` (float)
  - For Depth Camera: `rgb_image` (base64), `depth_image` (base64), `camera_info` (object)
  - For IMU: `orientation` (Quaternion), `angular_velocity` (Vector3), `linear_acceleration` (Vector3)
- `frame_id` (string): Coordinate frame of the sensor data

**Validation Rules**:
- `timestamp` must be within the current simulation time
- Data format must match the sensor type
- `frame_id` must correspond to a valid transform in the TF tree

### User Input
**Description**: Represents commands and controls provided by human operators to interact with the simulated robot

**Fields**:
- `id` (string): Unique identifier for the input command
- `user_id` (string): Identifier of the user providing input
- `command_type` (string): Type of command (VELOCITY, POSITION, TRAJECTORY, etc.)
- `command_data` (object): Command-specific data payload
  - For Velocity: `linear` (Vector3), `angular` (Vector3)
  - For Position: `position` (Vector3), `orientation` (Quaternion)
  - For Trajectory: `waypoints` (array of Pose)
- `timestamp` (float): Time when command was issued
- `robot_id` (string): Target robot for the command
- `interface_type` (string): Input method (KEYBOARD, MOUSE, GAMEPAD, etc.)

**Validation Rules**:
- `command_type` must be a supported command type
- Command data must be valid for the command type
- `robot_id` must reference an existing robot in the simulation

## State Management Entities

### Simulation State
**Description**: Represents the complete state of the simulation at a given time

**Fields**:
- `simulation_time` (float): Current simulation time
- `real_time_elapsed` (float): Real time elapsed since simulation start
- `environment_state` (object): State of the simulation environment
- `robot_states` (array): Array of robot states
- `sensor_states` (array): Array of sensor states
- `physics_properties` (object): Current physics engine properties
- `rendering_properties` (object): Current rendering engine properties

**Validation Rules**:
- `simulation_time` must be non-negative
- All referenced entities must exist in the simulation

### Robot State
**Description**: Represents the state of a specific robot at a given time

**Fields**:
- `robot_id` (string): Reference to the robot
- `timestamp` (float): Simulation time of this state snapshot
- `pose` (Pose): Position and orientation in the world
- `velocity` (Twist): Linear and angular velocities
- `joint_states` (array): Array of joint positions, velocities, and efforts
- `sensor_readings` (array): Current sensor readings from this robot
- `control_mode` (string): Current control mode (VELOCITY, POSITION, TORQUE, etc.)

**Validation Rules**:
- `pose` and `velocity` must have valid values
- Joint states must correspond to the robot's joint configuration
- `control_mode` must be a supported control mode

## Communication Entities

### ROS Message Types
**Description**: Standardized message types used for communication between Gazebo and Unity

**TF Transform**:
- `header` (Header): Standard ROS header
- `child_frame_id` (string): Child frame identifier
- `transform` (Transform): Translation and rotation from parent to child

**Sensor Messages**:
- Standard ROS sensor message types (sensor_msgs/LaserScan, sensor_msgs/Image, sensor_msgs/Imu, etc.)

**Validation Rules**:
- All ROS messages must conform to standard message definitions
- Timestamps must be synchronized between systems

## Relationships

### Environment-Robot Relationship
- One Simulation Environment can contain multiple Robot Models
- Each Robot Model belongs to one Simulation Environment at a time

### Robot-Sensor Relationship
- One Robot Model can have multiple Sensor Data streams
- Each Sensor Data stream belongs to one Robot Model

### User-Simulation Relationship
- One User Input can affect multiple Robot Models in a Simulation Environment
- Each Simulation State can have multiple User Input commands

## State Transitions

### Simulation Lifecycle
1. **Created**: Environment and robots are defined but simulation is not running
2. **Initialized**: All systems are ready, waiting for start command
3. **Running**: Simulation is actively executing with physics updates
4. **Paused**: Simulation is temporarily stopped, state is preserved
5. **Stopped**: Simulation is ended, resources are released

### Robot Control Modes
1. **Manual**: Controlled by user input through interfaces
2. **Autonomous**: Controlled by AI/algorithmic behaviors
3. **Teleoperated**: Controlled remotely by human operator
4. **Scripted**: Following pre-defined trajectories or behaviors

## Data Flow

### Physics Simulation Data Flow
Simulation Environment → Robot Model → Physics Engine → Robot State → Sensor Simulation → Sensor Data

### Rendering Data Flow
Robot State → TF Transforms → Unity Scene → Visual Output

### User Input Data Flow
User Input → ROS Messages → Robot Control → Robot State Updates