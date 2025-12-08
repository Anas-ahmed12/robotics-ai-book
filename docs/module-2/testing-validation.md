# Testing and Validation

## Running the Simulation

### Prerequisites
Before running the simulation, ensure all dependencies are installed:

```bash
# Source ROS 2 Humble
source /opt/ros/humble/setup.bash

# Source your workspace
source ~/robotics_ws/install/setup.bash
```

### Launch the Complete Simulation
```bash
# Launch the simulation with robot model
ros2 launch my_robot sim_launch.py

# In another terminal, launch the sensor nodes
ros2 launch my_robot nodes_launch.py
```

### Alternative: Launch Everything Together
Create a combined launch file `~/robotics_ws/src/my_robot/launch/full_system_launch.py`:

```python
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import PathJoinSubstitution
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    return LaunchDescription([
        # Launch Gazebo simulation
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([
                PathJoinSubstitution([
                    FindPackageShare('my_robot'),
                    'launch',
                    'sim_launch.py'
                ])
            ])
        ),

        # Launch sensor nodes
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([
                PathJoinSubstitution([
                    FindPackageShare('my_robot'),
                    'launch',
                    'nodes_launch.py'
                ])
            ])
        )
    ])
```

Then run:
```bash
ros2 launch my_robot full_system_launch.py
```

## ROS 2 Topic Tests

### Verify Topic Publication
Check that all sensor topics are publishing data:

```bash
# Check available topics
ros2 topic list

# Verify IMU data
ros2 topic echo /imu_data sensor_msgs/msg/Imu

# Verify camera data
ros2 topic echo /camera_image sensor_msgs/msg/Image

# Verify LIDAR data
ros2 topic echo /lidar_scan sensor_msgs/msg/LaserScan

# Check topic statistics
ros2 topic info /imu_data
ros2 topic info /camera_image
ros2 topic info /lidar_scan
```

### Send Test Commands
Test the motor controller by sending velocity commands:

```bash
# Send a velocity command to move the robot forward
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.5}, angular: {z: 0.0}}'

# Send a rotation command
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.0}, angular: {z: 0.5}}'

# Send a combined command (move in a circle)
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.5}, angular: {z: 0.3}}'
```

## RViz2 Visualization

### Launch RViz2
```bash
# Launch RViz2 with a preconfigured setup
ros2 run rviz2 rviz2 -d ~/robotics_ws/src/my_robot/config/robot_visualization.rviz
```

### Create RViz2 Configuration File
Create `~/robotics_ws/src/my_robot/config/robot_visualization.rviz`:

```
Panels:
  - Class: rviz_common/Displays
    Help Height: 78
    Name: Displays
    Property Tree Widget:
      Expanded:
        - /Global Options1
        - /Status1
        - /RobotModel1
        - /TF1
        - /LaserScan1
        - /Image1
        - /Imu1
      Splitter Ratio: 0.5
    Tree Height: 787
  - Class: rviz_common/Selection
    Name: Selection
  - Class: rviz_common/Tool Properties
    Expanded:
      - /2D Goal Pose1
      - /Publish Point1
    Name: Tool Properties
    Splitter Ratio: 0.5886790156364441
  - Class: rviz_common/Views
    Expanded:
      - /Current View1
    Name: Views
    Splitter Ratio: 0.5
Visualization Manager:
  Class: ""
  Displays:
    - Alpha: 0.5
      Cell Size: 1
      Class: rviz_default_plugins/Grid
      Color: 160; 160; 164
      Enabled: true
      Line Style:
        Line Width: 0.029999999329447746
        Value: Lines
      Name: Grid
      Normal Cell Count: 0
      Offset:
        X: 0
        Y: 0
        Z: 0
      Plane: XY
      Plane Cell Count: 10
      Reference Frame: <Fixed Frame>
      Value: true
    - Alpha: 1
      Class: rviz_default_plugins/RobotModel
      Collision Enabled: false
      Description File: ""
      Description Source: Topic
      Description Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /robot_description
      Enabled: true
      Links:
        All Links Enabled: true
        Expand Joint Details: false
        Expand Link Details: false
        Expand Tree: false
        Link Tree Style: Links in Alphabetic Order
      Name: RobotModel
      TF Prefix: ""
      Update Interval: 0
      Value: true
      Visual Enabled: true
    - Class: rviz_default_plugins/TF
      Enabled: true
      Frame Timeout: 15
      Frames:
        All Enabled: true
      Marker Scale: 1
      Name: TF
      Show Arrows: true
      Show Axes: true
      Show Names: false
      Tree:
        {}
      Update Interval: 0
      Value: true
    - Alpha: 1
      Autocompute Intensity Bounds: true
      Autocompute Value Bounds:
        Max Value: 10
        Min Value: -10
        Value: true
      Axis: Z
      Channel Name: intensity
      Class: rviz_default_plugins/LaserScan
      Color: 255; 255; 255
      Color Transformer: Intensity
      Decay Time: 0
      Enabled: true
      Invert Rainbow: false
      Max Color: 255; 255; 255
      Max Intensity: 0
      Min Color: 0; 0; 0
      Name: LaserScan
      Position Transformer: XYZ
      Queue Size: 10
      Selectable: true
      Size (Pixels): 3
      Size (m): 0.009999999776482582
      Style: Flat Squares
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /lidar_scan
      Use Fixed Frame: true
      Use rainbow: true
      Value: true
    - Class: rviz_default_plugins/Image
      Enabled: true
      Max Value: 1
      Min Value: 0
      Name: Image
      Normalize Range: true
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /camera_image
      Value: true
    - Class: rviz_default_plugins/Imu
      Enabled: true
      Name: Imu
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /imu_data
      Value: true
  Enabled: true
  Global Options:
    Background Color: 48; 48; 48
    Fixed Frame: odom
    Frame Rate: 30
  Name: root
  Tools:
    - Class: rviz_default_plugins/Interact
      Hide Inactive Objects: true
    - Class: rviz_default_plugins/MoveCamera
    - Class: rviz_default_plugins/Select
    - Class: rviz_default_plugins/FocusCamera
    - Class: rviz_default_plugins/Measure
    - Class: rviz_default_plugins/SetInitialPose
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /initialpose
    - Class: rviz_default_plugins/SetGoal
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /goal_pose
    - Class: rviz_default_plugins/PublishPoint
      Single click: true
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /clicked_point
  Transformation:
    Current:
      Class: rviz_default_plugins/TF
  Value: true
  Views:
    Current:
      Class: rviz_default_plugins/Orbit
      Distance: 10
      Enable Stereo Rendering:
        Stereo Eye Separation: 0.05999999865889549
        Stereo Focal Distance: 1
        Swap Stereo Eyes: false
        Value: false
      Focal Point:
        X: 0
        Y: 0
        Z: 0
      Focal Shape Fixed Size: true
      Focal Shape Size: 0.05000000074505806
      Invert Z Axis: false
      Name: Current View
      Near Clip Distance: 0.009999999776482582
      Pitch: 0.7853981852531433
      Target Frame: <Fixed Frame>
      Value: Orbit (rviz)
      Yaw: 0.7853981852531433
    Saved: ~
Window Geometry:
  Displays:
    collapsed: false
  Height: 1025
  Hide Left Dock: false
  Hide Right Dock: false
  Image:
    collapsed: false
  QMainWindow State: 000000ff00000000fd000000040000000000000156000003a7fc0200000009fb0000001200530065006c0065006300740069006f006e00000001e10000009b0000005c00fffffffb0000001e0054006f006f006c002000500072006f007000650072007400690065007302000001ed000001df00000185000000a3fb000000120056006900650077007300200054006f006f02000001df000002110000018500000122fb000000200054006f006f006c002000500072006f0070006500720074006900650073003203000002880000011d000002210000017afb000000100044006900730070006c006100790073010000003d000003a7000000c900fffffffb0000002000730065006c0065006300740069006f006e00200062007500660066006500720200000138000000aa000025a9000002a0fb00000014005700690064006500530074006500720065006f02000000e6000000d2000003ee0000030bfb0000000c004b0069006e0065006300740200000186000001060000030c00000261000000010000010f000003a7fc0200000003fb0000001e0054006f006f006c002000500072006f00700065007200740069006500730100000041000000780000000000000000fb0000000a00560069006500770073010000003d000003a7000000a400fffffffb0000001200530065006c0065006300740069006f006e010000025a000000b200000000000000000000000200000490000000a9fc0100000001fb0000000a00560069006500770073030000004e00000080000002e10000019700000003000004420000003efc0100000002fb0000000800540069006d00650100000000000004420000000000000000fb0000000800540069006d00650100000000000004500000000000000000000004ba000003a700000004000000040000000800000008fc0000000100000002000000010000000a0054006f006f006c00730100000000ffffffff0000000000000000
  Selection:
    collapsed: false
  Tool Properties:
    collapsed: false
  Views:
    collapsed: false
  Width: 1853
  X: 67
  Y: 27
```

## Debugging Tips

### Common Issues and Solutions

#### 1. Robot Not Moving
```bash
# Check if cmd_vel topic is receiving messages
ros2 topic echo /cmd_vel

# Verify the motor controller node is running
ros2 run my_robot motor_controller

# Check for errors in the terminal
```

#### 2. Sensor Data Not Publishing
```bash
# Check if sensor topics exist
ros2 topic list | grep -E "(imu|camera|lidar)"

# Verify sensor nodes are running
ros2 node list | grep -E "(imu|camera|lidar)"

# Check node status and logs
ros2 lifecycle list <node_name>
```

#### 3. Gazebo Physics Issues
```bash
# Check Gazebo status
gz stats

# Verify robot model is loaded
gz model -m mobile_robot -i

# Check for physics errors in Gazebo console
```

#### 4. TF Frame Issues
```bash
# Check TF tree
ros2 run tf2_tools view_frames

# Echo TF transforms
ros2 run tf2_ros tf2_echo base_link camera_link

# Visualize TF in RViz2
```

### Performance Optimization

#### 1. Reduce Simulation Load
- Lower Gazebo update rates for sensors that don't need high frequency
- Reduce image resolution for camera sensors
- Limit the number of active physics objects

#### 2. Optimize ROS 2 Communication
- Use appropriate QoS settings for different sensor types
- Implement message throttling for high-frequency topics
- Use intra-process communication where possible

## Expected Output Screenshots (ASCII Representation)

### Gazebo Simulation View
```
    ┌─────────────────────────────────────────┐
    │  Gazebo Simulation Environment          │
    │                                         │
    │    ████████████  ← Robot Model          │
    │   ██          ██                        │
    │  ██  ▓▓▓▓▓▓  ██  ← LIDAR Sensor         │
    │  ██  ▓▓▓▓▓▓  ██  ← Camera Sensor        │
    │  ██  ▓▓▓▓▓▓  ██  ← IMU Sensor           │
    │   ██          ██                        │
    │    ████████████                         │
    │                                         │
    │  ██████    ← Obstacle 1                 │
    │                                         │
    │                    ██████  ← Obstacle 2 │
    │                                         │
    │                                         │
    └─────────────────────────────────────────┘
```

### RViz2 Visualization
```
    ┌─────────────────────────────────────────┐
    │  RViz2 Visualization                    │
    │                                         │
    │  ┌─Robot Model──┐                       │
    │  │    ██        │                       │
    │  │   ████       │ ← TF Frames          │
    │  │  ██████      │                       │
    │  └──────────────┘                       │
    │                                         │
    │  · · · · · · · · · ← LIDAR Scan        │
    │  ·     ● ● ●     ·                      │
    │  ·   ●       ●   ·                      │
    │  · ●           ● ·                      │
    │  ·●             ●·                      │
    │  ·●             ●· ← Obstacles          │
    │  · ●           ● ·                      │
    │  ·   ●       ●   ·                      │
    │  ·     ● ● ●     ·                      │
    │  · · · · · · · · ·                      │
    │                                         │
    └─────────────────────────────────────────┘
```

### Terminal Output Example
```
[INFO] [1699123456.789] [motor_controller]: Motor Controller Node initialized
[INFO] [1699123456.790] [imu_reader]: IMU Reader Node initialized
[INFO] [1699123456.791] [camera_stream]: Camera Stream Node initialized
[INFO] [1699123456.792] [lidar_scan]: LIDAR Scan Node initialized
[DEBUG] [1699123457.001] [motor_controller]: Left vel: 10.00, Right vel: 10.00
[DEBUG] [1699123457.020] [imu_reader]: Publishing IMU data
[DEBUG] [1699123457.033] [camera_stream]: Publishing camera image
[DEBUG] [1699123457.100] [lidar_scan]: Publishing LIDAR scan with 360 points
```

### Topic Monitoring Output
```
$ ros2 topic hz /lidar_scan
average rate: 10.000
        min: 0.099s max: 0.101s std dev: 0.00089s window: 10
$ ros2 topic bw /camera_image
Subscribed to [/camera_image]
Data rate: 24.5 MB/s
```

These testing and validation procedures ensure that your ROS 2 robot simulation with Gazebo is functioning correctly with all sensors properly integrated and publishing data at the expected rates.