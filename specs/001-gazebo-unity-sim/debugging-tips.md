# Debugging Tips

## Common Issues and Solutions

### 1. Robot Not Moving
- Check if cmd_vel topic is receiving messages:
  ```bash
  ros2 topic echo /cmd_vel
  ```
- Verify the motor controller node is running:
  ```bash
  ros2 run my_robot motor_controller
  ```
- Check for errors in the terminal

### 2. Sensor Data Not Publishing
- Check if sensor topics exist:
  ```bash
  ros2 topic list | grep -E "(imu|camera|lidar)"
  ```
- Verify sensor nodes are running:
  ```bash
  ros2 node list | grep -E "(imu|camera|lidar)"
  ```
- Check node status and logs:
  ```bash
  ros2 lifecycle list <node_name>
  ```

### 3. Gazebo Physics Issues
- Check Gazebo status:
  ```bash
  gz stats
  ```
- Verify robot model is loaded:
  ```bash
  gz model -m mobile_robot -i
  ```
- Check for physics errors in Gazebo console

### 4. TF Frame Issues
- Check TF tree:
  ```bash
  ros2 run tf2_tools view_frames
  ```
- Echo TF transforms:
  ```bash
  ros2 run tf2_ros tf2_echo base_link camera_link
  ```
- Visualize TF in RViz2

## Performance Optimization

### 1. Reduce Simulation Load
- Lower Gazebo update rates for sensors that don't need high frequency
- Reduce camera image resolution
- Limit the number of active physics objects

### 2. Optimize ROS 2 Communication
- Use appropriate QoS settings
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

These debugging tips will help ensure that your ROS 2 robot simulation with Gazebo is functioning correctly with all sensors properly integrated and publishing data at the expected rates.