/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Module 1: The Robotic Nervous System (ROS 2)',
      items: [
        'modules/ros2-nervous-system/nodes',
        'modules/ros2-nervous-system/topics',
        'modules/ros2-nervous-system/services',
        'modules/ros2-nervous-system/urdf',
        'modules/ros2-nervous-system/python-agent',
      ],
    },
    {
      type: 'category',
      label: 'Module 2: ROS 2 Robotics Simulation with Gazebo',
      items: [
        'module-2/overview',
        'module-2/simulation-setup',
        'module-2/ros2-nodes',
        'module-2/sensor-integration',
        'module-2/testing-validation',
      ],
    },
    {
      type: 'category',
      label: 'Module 3: AI-Robot Brain (NVIDIA Isaac™)',
      items: [
        'module-3/index',
        'module-3/topic-1/photorealistic-simulation',
        'module-3/topic-2/isaac-ros-nodes',
        'module-3/topic-3/vslam-navigation',
      ],
    },
    {
      type: 'category',
      label: 'Module 4: Vision-Language-Action (VLA)',
      items: [
        'module-4/index',
        'module-4/topic-1/voice-to-action',
        'module-4/topic-2/cognitive-planning',
        'module-4/topic-3/capstone-project',
      ],
    },
  ],
};

export default sidebars;