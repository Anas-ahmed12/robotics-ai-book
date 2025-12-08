# Simulation Setup

## Install Requirements (Ubuntu + ROS 2 Humble)

### System Requirements
- **Operating System**: Ubuntu 22.04 LTS
- **CPU**: 4+ cores (Intel i5/Ryzen 5 or better)
- **RAM**: 8GB minimum, 16GB recommended
- **GPU**: NVIDIA GTX 1060 or equivalent with OpenGL 4.5 support
- **Storage**: 10GB free space for simulation assets

### ROS 2 Humble Installation
```bash
# Add ROS 2 repository
sudo apt update && sudo apt install -y curl gnupg lsb-release
curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key | sudo gpg --dearmor -o /usr/share/keyrings/ros-archive-keyring.gpg

# Add repository to sources list
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null

# Install ROS 2 Humble packages
sudo apt update
sudo apt install -y ros-humble-desktop ros-humble-gazebo-ros-pkgs
sudo apt install -y python3-colcon-common-extensions python3-rosdep python3-vcstool

# Initialize rosdep
sudo rosdep init
rosdep update

# Source ROS 2 environment
source /opt/ros/humble/setup.bash
```

### Additional Dependencies
```bash
# Install development tools
sudo apt install -y build-essential cmake git
sudo apt install -y python3-pip python3-rosinstall

# Install graphics libraries for Gazebo
sudo apt install -y libgl1-mesa-glx libgl1-mesa-dri
sudo apt install -y libgazebo11-dev gazebo11-plugin-*

# Install Python packages
pip3 install transforms3d
```

## Create Gazebo World Environment

### Basic World File Structure
Create a new world file in `ros2_ws/worlds/basic_world.sdf`:

```xml
<?xml version="1.0" ?>
<sdf version="1.7">
  <world name="basic_world">
    <!-- Include default atmosphere -->
    <include>
      <uri>model://sun</uri>
    </include>

    <!-- Include ground plane -->
    <include>
      <uri>model://ground_plane</uri>
    </include>

    <!-- Physics engine configuration -->
    <physics name="1ms" type="ode">
      <max_step_size>0.001</max_step_size>
      <real_time_factor>1.0</real_time_factor>
      <real_time_update_rate>1000.0</real_time_update_rate>
      <gravity>0 0 -9.8</gravity>
    </physics>

    <!-- Ground plane with texture -->
    <model name="ground_plane">
      <static>true</static>
      <link name="link">
        <collision name="collision">
          <geometry>
            <plane>
              <normal>0 0 1</normal>
            </plane>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <plane>
              <normal>0 0 1</normal>
              <size>100 100</size>
            </plane>
          </geometry>
          <material>
            <diffuse>0.7 0.7 0.7 1</diffuse>
            <specular>0.1 0.1 0.1 1</specular>
          </material>
        </visual>
      </link>
    </model>

    <!-- Lighting -->
    <light name="sun" type="directional">
      <cast_shadows>true</cast_shadows>
      <pose>0 0 10 0 0 0</pose>
      <diffuse>0.8 0.8 0.8 1</diffuse>
      <specular>0.2 0.2 0.2 1</specular>
      <attenuation>
        <range>1000</range>
        <constant>0.9</constant>
        <linear>0.01</linear>
        <quadratic>0.001</quadratic>
      </attenuation>
      <direction>-0.5 0.1 -0.9</direction>
    </light>

    <!-- Add obstacles -->
    <model name="wall_1">
      <pose>0 5 0.5 0 0 0</pose>
      <link name="wall_1_link">
        <collision name="collision">
          <geometry>
            <box>
              <size>10 0.2 1</size>
            </box>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <box>
              <size>10 0.2 1</size>
            </box>
          </geometry>
          <material>
            <diffuse>0.4 0.4 0.4 1</diffuse>
          </material>
        </visual>
        <inertial>
          <mass>100</mass>
          <inertia>
            <ixx>1</ixx>
            <ixy>0</ixy>
            <ixz>0</ixz>
            <iyy>1</iyy>
            <iyz>0</iyz>
            <izz>1</izz>
          </inertia>
        </inertial>
      </link>
    </model>

  </world>
</sdf>
```

## Add Robot Model (URDF/SDF)

### Basic Differential Drive Robot URDF
Create `ros2_ws/src/gazebo_models/models/basic_robot/urdf/basic_robot.urdf.xacro`:

```xml
<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="basic_robot">
  <xacro:property name="M_PI" value="3.1415926535897931" />

  <!-- Robot base properties -->
  <xacro:property name="base_width" value="0.3" />
  <xacro:property name="base_length" value="0.4" />
  <xacro:property name="base_height" value="0.15" />
  <xacro:property name="base_mass" value="10" />

  <!-- Wheel properties -->
  <xacro:property name="wheel_radius" value="0.08" />
  <xacro:property name="wheel_width" value="0.04" />
  <xacro:property name="wheel_mass" value="0.5" />
  <xacro:property name="wheel_x_offset" value="0.15" />
  <xacro:property name="wheel_y_offset" value="0.18" />

  <!-- Base link -->
  <link name="base_link">
    <visual>
      <origin xyz="0 0 0" rpy="0 0 0" />
      <geometry>
        <box size="${base_length} ${base_width} ${base_height}" />
      </geometry>
      <material name="orange">
        <color rgba="1 0.5 0 1" />
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="0 0 0" />
      <geometry>
        <box size="${base_length} ${base_width} ${base_height}" />
      </geometry>
    </collision>
    <inertial>
      <mass value="${base_mass}" />
      <origin xyz="0 0 0" rpy="0 0 0" />
      <inertia ixx="0.1" ixy="0" ixz="0" iyy="0.1" iyz="0" izz="0.1" />
    </inertial>
  </link>

  <!-- Inertial unit -->
  <link name="imu_link">
    <inertial>
      <mass value="0.1" />
      <origin xyz="0 0 0" rpy="0 0 0" />
      <inertia ixx="0.0001" ixy="0" ixz="0" iyy="0.0001" iyz="0" izz="0.0001" />
    </inertial>
  </link>

  <joint name="imu_joint" type="fixed">
    <parent link="base_link" />
    <child link="imu_link" />
    <origin xyz="0 0 0.1" rpy="0 0 0" />
  </joint>

  <!-- Left wheel -->
  <link name="left_wheel">
    <visual>
      <origin xyz="0 0 0" rpy="${M_PI/2} 0 0" />
      <geometry>
        <cylinder radius="${wheel_radius}" length="${wheel_width}" />
      </geometry>
      <material name="black">
        <color rgba="0 0 0 1" />
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="${M_PI/2} 0 0" />
      <geometry>
        <cylinder radius="${wheel_radius}" length="${wheel_width}" />
      </geometry>
    </collision>
    <inertial>
      <mass value="${wheel_mass}" />
      <origin xyz="0 0 0" rpy="0 0 0" />
      <inertia ixx="0.001" ixy="0" ixz="0" iyy="0.001" iyz="0" izz="0.002" />
    </inertial>
  </link>

  <joint name="left_wheel_joint" type="continuous">
    <parent link="base_link" />
    <child link="left_wheel" />
    <origin xyz="${wheel_x_offset} ${wheel_y_offset} 0" rpy="0 0 0" />
    <axis xyz="0 1 0" />
  </joint>

  <!-- Right wheel -->
  <link name="right_wheel">
    <visual>
      <origin xyz="0 0 0" rpy="${M_PI/2} 0 0" />
      <geometry>
        <cylinder radius="${wheel_radius}" length="${wheel_width}" />
      </geometry>
      <material name="black" />
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="${M_PI/2} 0 0" />
      <geometry>
        <cylinder radius="${wheel_radius}" length="${wheel_width}" />
      </geometry>
    </collision>
    <inertial>
      <mass value="${wheel_mass}" />
      <origin xyz="0 0 0" rpy="0 0 0" />
      <inertia ixx="0.001" ixy="0" ixz="0" iyy="0.001" iyz="0" izz="0.002" />
    </inertial>
  </link>

  <joint name="right_wheel_joint" type="continuous">
    <parent link="base_link" />
    <child link="right_wheel" />
    <origin xyz="${wheel_x_offset} -${wheel_y_offset} 0" rpy="0 0 0" />
    <axis xyz="0 1 0" />
  </joint>

  <!-- Gazebo plugins -->
  <gazebo reference="base_link">
    <material>Gazebo/Orange</material>
  </gazebo>

  <gazebo reference="left_wheel">
    <material>Gazebo/Black</material>
    <mu1>1.0</mu1>
    <mu2>1.0</mu2>
    <kp>1000000.0</kp>
    <kd>100.0</kd>
  </gazebo>

  <gazebo reference="right_wheel">
    <material>Gazebo/Black</material>
    <mu1>1.0</mu1>
    <mu2>1.0</mu2>
    <kp>1000000.0</kp>
    <kd>100.0</kd>
  </gazebo>

  <!-- Differential drive plugin -->
  <gazebo>
    <plugin name="diff_drive" filename="libgazebo_ros_diff_drive.so">
      <ros>
        <namespace>robot1</namespace>
        <remapping>cmd_vel:=cmd_vel</remapping>
        <remapping>odom:=odom</remapping>
      </ros>
      <update_rate>50</update_rate>
      <left_joint>left_wheel_joint</left_joint>
      <right_joint>right_wheel_joint</right_joint>
      <wheel_separation>${2 * wheel_y_offset}</wheel_separation>
      <wheel_diameter>${2 * wheel_radius}</wheel_diameter>
      <max_wheel_torque>20</max_wheel_torque>
      <max_wheel_acceleration>10.0</max_wheel_acceleration>
      <publish_odom>true</publish_odom>
      <publish_odom_tf>true</publish_odom_tf>
      <publish_wheel_tf>true</publish_wheel_tf>
      <odometry_frame>odom</odometry_frame>
      <robot_base_frame>base_link</robot_base_frame>
    </plugin>
  </gazebo>

</robot>
```

## Add Physics and Plugin Configurations

### Gazebo Plugin Configuration
The robot URDF includes several plugins for simulation:

1. **Differential Drive Plugin**: Provides wheel control and odometry
2. **IMU Sensor Plugin**: Simulates inertial measurement unit
3. **Camera Plugin**: Simulates RGB camera
4. **LiDAR Plugin**: Simulates 2D laser scanner

### Environment Configuration
Create `ros2_ws/config/physics_params.yaml`:

```yaml
/**:
  ros__parameters:
    # Physics parameters
    gravity_x: 0.0
    gravity_y: 0.0
    gravity_z: -9.8
    physics_engine: "ode"

    # Simulation parameters
    max_step_size: 0.001
    real_time_factor: 1.0
    real_time_update_rate: 1000.0

    # Performance parameters
    solver_type: "quick"
    iters: 10
    sor: 1.3
```

## Example Launch File

### Basic Simulation Launch File
Create `ros2_ws/launch/basic_simulation.launch.py`:

```python
import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    # Launch configuration variables
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')
    world = LaunchConfiguration('world', default='basic_world.sdf')
    headless = LaunchConfiguration('headless', default='false')
    verbose = LaunchConfiguration('verbose', default='false')
    server_required = LaunchConfiguration('server_required', default='false')
    gui_required = LaunchConfiguration('gui_required', default='true')

    # Declare launch arguments
    declare_world_cmd = DeclareLaunchArgument(
        'world',
        default_value='basic_world.sdf',
        description='Choose one of the world files from `/ros2_ws/worlds`')

    declare_simulator_cmd = DeclareLaunchArgument(
        'headless',
        default_value='false',
        description='Whether to execute gzclient')

    declare_use_sim_time_cmd = DeclareLaunchArgument(
        'use_sim_time',
        default_value='true',
        description='Use simulation (Gazebo) clock if true')

    declare_verbose_cmd = DeclareLaunchArgument(
        'verbose',
        default_value='false',
        description='Whether to apply verbose cmd args')

    declare_server_required_cmd = DeclareLaunchArgument(
        'server_required',
        default_value='false',
        description='Whether to start the physics server')

    declare_gui_required_cmd = DeclareLaunchArgument(
        'gui_required',
        default_value='true',
        description='Whether to start the GUI client')

    # Specify the world
    world_path = PathJoinSubstitution([
        FindPackageShare('gazebo_models'),
        'worlds',
        world
    ])

    # Start Gazebo with the specified world
    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([
            FindPackageShare('gazebo_ros'),
            '/launch/gazebo.launch.py'
        ]),
        launch_arguments={
            'world': world_path,
            'headless': headless,
            'verbose': verbose,
            'server_required': server_required,
            'gui_required': gui_required
        }.items()
    )

    # Robot state publisher node
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{'use_sim_time': use_sim_time}],
        arguments=[PathJoinSubstitution([
            FindPackageShare('gazebo_models'),
            'models/basic_robot/urdf/basic_robot.urdf.xacro'
        ])]
    )

    # Spawn the robot in Gazebo
    spawn_entity = Node(
        package='gazebo_ros',
        executable='spawn_entity.py',
        arguments=[
            '-topic', 'robot_description',
            '-entity', 'robot1',
            '-x', '0.0',
            '-y', '0.0',
            '-z', '0.5'
        ],
        output='screen'
    )

    # Create the launch description and populate
    ld = LaunchDescription()

    # Declare launch options
    ld.add_action(declare_world_cmd)
    ld.add_action(declare_simulator_cmd)
    ld.add_action(declare_use_sim_time_cmd)
    ld.add_action(declare_verbose_cmd)
    ld.add_action(declare_server_required_cmd)
    ld.add_action(declare_gui_required_cmd)

    # Add nodes to launch
    ld.add_action(gazebo)
    ld.add_action(robot_state_publisher)
    ld.add_action(spawn_entity)

    return ld
```

### Running the Simulation
```bash
# Build the workspace
cd ros2_ws
source /opt/ros/humble/setup.bash
colcon build --packages-select gazebo_models
source install/setup.bash

# Launch the simulation
ros2 launch basic_simulation.launch.py
```