import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import time


class AgentBridge(Node):
    def __init__(self):
        super().__init__('agent_bridge')
        self.publisher = self.create_publisher(String, 'agent_commands', 10)
        self.subscription = self.create_subscription(
            String,
            'agent_feedback',
            self.feedback_callback,
            10)
        self.get_logger().info('Agent bridge initialized')

    def send_command(self, command):
        msg = String()
        msg.data = command
        self.publisher.publish(msg)
        self.get_logger().info(f'Agent sent: "{command}"')

    def feedback_callback(self, msg):
        self.get_logger().info(f'Agent received feedback: "{msg.data}"')


def main(args=None):
    rclpy.init(args=args)
    agent_bridge = AgentBridge()

    # Send some commands
    for i in range(5):
        agent_bridge.send_command(f'Command from agent: {i}')
        time.sleep(1)

    rclpy.spin(agent_bridge)
    agent_bridge.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()