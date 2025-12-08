# Sensor Integration

## Sensor Overview

This module integrates three primary sensors for the robot simulation:
- IMU (Inertial Measurement Unit) - Provides orientation and acceleration data
- Camera - Provides visual perception capabilities
- LIDAR - Provides distance measurements for navigation and obstacle detection

## IMU Plugin Configuration

### Gazebo IMU Plugin
The IMU sensor is integrated using the Gazebo ROS IMU plugin which provides realistic sensor data with configurable noise parameters.

### Configuration File
Create `~/robotics_ws/src/my_robot/config/imu_config.yaml`:

```yaml
# IMU Sensor Configuration
imu_sensor:
  sensor_type: "imu"
  topic_name: "imu_data"
  frame_id: "imu_link"

  # Update rate in Hz
  update_rate: 100

  # Noise parameters for realistic simulation
  noise:
    # Angular velocity noise (gyroscope)
    angular_velocity:
      mean: 0.0
      stddev: 2e-4
      bias_mean: 0.0
      bias_stddev: 0.0001
    # Linear acceleration noise (accelerometer)
    linear_acceleration:
      mean: 0.0
      stddev: 1.7e-2
      bias_mean: 0.0
      bias_stddev: 0.01

# ROS interface parameters
ros:
  # Topic to publish IMU data
  topic: "imu_data"
  # Frame ID for the sensor
  frame_id: "imu_link"
```

### URDF Integration
Add the IMU plugin to your robot URDF file:

```xml
<!-- IMU Sensor in URDF -->
<link name="imu_link">
  <inertial>
    <mass value="0.01"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <inertia ixx="0.0001" ixy="0" ixz="0" iyy="0.0001" iyz="0" izz="0.0001"/>
  </inertial>
</link>

<joint name="imu_joint" type="fixed">
  <parent link="base_link"/>
  <child link="imu_link"/>
  <origin xyz="0 0 0.1" rpy="0 0 0"/>
</joint>

<!-- Gazebo Plugin for IMU -->
<gazebo reference="imu_link">
  <sensor name="imu_sensor" type="imu">
    <always_on>true</always_on>
    <update_rate>100</update_rate>
    <imu>
      <angular_velocity>
        <x>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>2e-4</stddev>
            <bias_mean>0.0</bias_mean>
            <bias_stddev>0.0001</bias_stddev>
          </noise>
        </x>
        <y>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>2e-4</stddev>
            <bias_mean>0.0</bias_mean>
            <bias_stddev>0.0001</bias_stddev>
          </noise>
        </y>
        <z>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>2e-4</stddev>
            <bias_mean>0.0</bias_mean>
            <bias_stddev>0.0001</bias_stddev>
          </noise>
        </z>
      </angular_velocity>
      <linear_acceleration>
        <x>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>1.7e-2</stddev>
            <bias_mean>0.0</bias_mean>
            <bias_stddev>0.01</bias_stddev>
          </noise>
        </x>
        <y>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>1.7e-2</stddev>
            <bias_mean>0.0</bias_mean>
            <bias_stddev>0.01</bias_stddev>
          </noise>
        </y>
        <z>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>1.7e-2</stddev>
            <bias_mean>0.0</bias_mean>
            <bias_stddev>0.01</bias_stddev>
          </noise>
        </z>
      </linear_acceleration>
    </imu>
  </sensor>
  <plugin name="imu_plugin" filename="libgazebo_ros_imu.so">
    <ros>
      <namespace>/</namespace>
      <remapping>~/out:=imu_data</remapping>
    </ros>
    <initial_orientation_as_reference>false</initial_orientation_as_reference>
    <update_rate>100</update_rate>
  </plugin>
</gazebo>
```

## Camera Plugin Configuration

### Gazebo Camera Plugin
The camera sensor provides visual data for perception tasks. It simulates a standard RGB camera with configurable resolution and field of view.

### Configuration File
Create `~/robotics_ws/src/my_robot/config/camera_config.yaml`:

```yaml
# Camera Sensor Configuration
camera_sensor:
  sensor_type: "camera"
  topic_name: "camera_image"
  frame_id: "camera_link"

  # Camera parameters
  image:
    width: 640
    height: 480
    format: "R8G8B8"

  # Camera properties
  camera:
    horizontal_fov: 1.3962634  # 80 degrees in radians
    near: 0.1  # Near clipping distance
    far: 100   # Far clipping distance

  # Update rate in Hz
  update_rate: 30

# ROS interface parameters
ros:
  # Topic to publish camera images
  image_topic: "camera_image"
  # Frame ID for the sensor
  frame_id: "camera_link"
```

### URDF Integration
Add the camera plugin to your robot URDF file:

```xml
<!-- Camera Sensor in URDF -->
<link name="camera_link">
  <inertial>
    <mass value="0.01"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <inertia ixx="0.0001" ixy="0" ixz="0" iyy="0.0001" iyz="0" izz="0.0001"/>
  </inertial>
  <visual>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <geometry>
      <box size="0.02 0.02 0.02"/>
    </geometry>
    <material name="red">
      <color rgba="1 0 0 1"/>
    </material>
  </visual>
</link>

<joint name="camera_joint" type="fixed">
  <parent link="base_link"/>
  <child link="camera_link"/>
  <origin xyz="0.15 0 0.05" rpy="0 0 0"/>
</joint>

<!-- Gazebo Plugin for Camera -->
<gazebo reference="camera_link">
  <sensor name="camera" type="camera">
    <update_rate>30</update_rate>
    <camera name="head">
      <horizontal_fov>1.3962634</horizontal_fov>
      <image>
        <width>640</width>
        <height>480</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.1</near>
        <far>100</far>
      </clip>
    </camera>
    <plugin name="camera_controller" filename="libgazebo_ros_camera.so">
      <ros>
        <namespace>/</namespace>
        <remapping>image_raw:=camera_image</remapping>
        <remapping>camera_info:=camera_info</remapping>
      </ros>
      <frame_name>camera_link</frame_name>
      <min_depth>0.1</min_depth>
      <max_depth>100.0</max_depth>
    </plugin>
  </sensor>
</gazebo>
```

## LIDAR Plugin Configuration

### Gazebo LIDAR Plugin
The LIDAR sensor provides 360-degree distance measurements for navigation and obstacle detection. It simulates a 2D planar LIDAR with configurable range and resolution.

### Configuration File
Create `~/robotics_ws/src/my_robot/config/lidar_config.yaml`:

```yaml
# LIDAR Sensor Configuration
lidar_sensor:
  sensor_type: "ray"
  topic_name: "lidar_scan"
  frame_id: "lidar_link"

  # LIDAR parameters
  ray:
    scan:
      horizontal:
        samples: 360        # Number of rays per scan
        resolution: 1.0     # Resolution of rays (1.0 = 1 ray per degree)
        min_angle: -3.14159 # -π radians (-180 degrees)
        max_angle: 3.14159  # π radians (180 degrees)
    range:
      min: 0.1     # Minimum range (meters)
      max: 10.0    # Maximum range (meters)
      resolution: 0.01  # Range resolution (meters)

  # Update rate in Hz
  update_rate: 10

# ROS interface parameters
ros:
  # Topic to publish LIDAR scans
  scan_topic: "lidar_scan"
  # Frame ID for the sensor
  frame_id: "lidar_link"
```

### URDF Integration
Add the LIDAR plugin to your robot URDF file:

```xml
<!-- LIDAR Sensor in URDF -->
<link name="lidar_link">
  <inertial>
    <mass value="0.01"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <inertia ixx="0.0001" ixy="0" ixz="0" iyy="0.0001" iyz="0" izz="0.0001"/>
  </inertial>
  <visual>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <geometry>
      <cylinder radius="0.02" length="0.02"/>
    </geometry>
    <material name="green">
      <color rgba="0 1 0 1"/>
    </material>
  </visual>
</link>

<joint name="lidar_joint" type="fixed">
  <parent link="base_link"/>
  <child link="lidar_link"/>
  <origin xyz="0 0 0.15" rpy="0 0 0"/>
</joint>

<!-- Gazebo Plugin for LIDAR -->
<gazebo reference="lidar_link">
  <sensor name="lidar" type="ray">
    <ray>
      <scan>
        <horizontal>
          <samples>360</samples>
          <resolution>1.0</resolution>
          <min_angle>-3.14159</min_angle>
          <max_angle>3.14159</max_angle>
        </horizontal>
      </scan>
      <range>
        <min>0.1</min>
        <max>10.0</max>
        <resolution>0.01</resolution>
      </range>
    </ray>
    <plugin name="lidar_controller" filename="libgazebo_ros_laser.so">
      <ros>
        <namespace>/</namespace>
        <remapping>scan:=lidar_scan</remapping>
      </ros>
      <frame_name>lidar_link</frame_name>
      <min_range>0.1</min_range>
      <max_range>10.0</max_range>
      <update_rate>10</update_rate>
    </plugin>
  </sensor>
</gazebo>
```

## Topic Mapping

### Sensor Topic Mapping Table

| Sensor Type | Gazebo Topic | ROS Topic | Message Type | Frequency |
|-------------|--------------|-----------|--------------|-----------|
| IMU | /imu_data | /imu_data | sensor_msgs/Imu | 100 Hz |
| Camera | /camera_image | /camera_image | sensor_msgs/Image | 30 Hz |
| LIDAR | /lidar_scan | /lidar_scan | sensor_msgs/LaserScan | 10 Hz |

### Topic Remapping Example
In your launch files, you can remap topics as needed:

```python
# Example launch file with topic remapping
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='my_robot',
            executable='imu_reader',
            name='imu_reader',
            remappings=[
                ('imu_data', 'sensors/imu'),
            ],
            parameters=[{'use_sim_time': True}]
        ),
        Node(
            package='my_robot',
            executable='camera_stream',
            name='camera_stream',
            remappings=[
                ('camera_image', 'sensors/camera/image_raw'),
            ],
            parameters=[{'use_sim_time': True}]
        ),
        Node(
            package='my_robot',
            executable='lidar_scan',
            name='lidar_scan',
            remappings=[
                ('lidar_scan', 'sensors/lidar/scan'),
            ],
            parameters=[{'use_sim_time': True}]
        )
    ])
```

## Calibration

### IMU Calibration
IMU sensors typically require calibration to account for biases and noise. In simulation, calibration parameters are set in the URDF/plugin configuration.

### Camera Calibration
For real cameras, calibration involves determining intrinsic and extrinsic parameters. In simulation, these are configured in the camera plugin.

Create `~/robotics_ws/src/my_robot/config/camera_calibration.yaml`:

```yaml
# Camera Calibration Parameters
image_width: 640
image_height: 480
camera_name: my_robot_camera
camera_matrix:
  rows: 3
  cols: 3
  data: [640.0, 0.0, 320.0, 0.0, 640.0, 240.0, 0.0, 0.0, 1.0]
distortion_coefficients:
  rows: 1
  cols: 5
  data: [0.0, 0.0, 0.0, 0.0, 0.0]
rectification_matrix:
  rows: 3
  cols: 3
  data: [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]
projection_matrix:
  rows: 3
  cols: 4
  data: [640.0, 0.0, 320.0, 0.0, 0.0, 640.0, 240.0, 0.0, 0.0, 0.0, 1.0, 0.0]
```

### LIDAR Calibration
LIDAR calibration typically involves aligning the sensor data with the robot's coordinate frame. In simulation, this is handled by the joint placement in the URDF.