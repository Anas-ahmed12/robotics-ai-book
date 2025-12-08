from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package='robot_nodes',
            executable='simple_publisher',
            name='simple_publisher',
            output='screen'
        ),
        Node(
            package='robot_nodes',
            executable='simple_subscriber',
            name='simple_subscriber',
            output='screen'
        )
    ])