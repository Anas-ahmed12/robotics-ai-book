import sys
import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts


class SimpleClient(Node):
    def __init__(self):
        super().__init__('simple_client')
        self.cli = self.create_client(AddTwoInts, 'add_two_ints')
        while not self.cli.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Service not available, waiting again...')
        self.req = AddTwoInts.Request()

    def send_request(self, a, b):
        self.req.a = a
        self.req.b = b
        self.future = self.cli.call_async(self.req)
        rclpy.spin_until_future_complete(self, self.future)
        return self.future.result()


def main(args=None):
    rclpy.init(args=args)
    simple_client = SimpleClient()
    response = simple_client.send_request(int(sys.argv[1]), int(sys.argv[2]))
    if response is not None:
        simple_client.get_logger().info(f'Result of add_two_ints: {response.sum}')
    else:
        simple_client.get_logger().info('Service call failed')
    simple_client.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()