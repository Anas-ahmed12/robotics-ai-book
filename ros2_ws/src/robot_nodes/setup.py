from setuptools import setup
import os
from glob import glob

package_name = 'robot_nodes'

setup(
    name=package_name,
    version='0.0.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.py')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='ROS 2 Education Team',
    maintainer_email='education@ros2.example.com',
    description='Simple ROS 2 nodes for educational purposes',
    license='Apache License 2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'simple_publisher = robot_nodes.simple_publisher:main',
            'simple_subscriber = robot_nodes.simple_subscriber:main',
            'simple_service = robot_nodes.simple_service:main',
            'simple_client = robot_nodes.simple_client:main',
            'agent_bridge = robot_nodes.agent_bridge:main',
        ],
    },
)