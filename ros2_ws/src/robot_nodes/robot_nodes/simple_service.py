import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts


class SimpleService(Node):
    def __init__(self):
        super().__init__('simple_service')
        self.srv = self.create_service(AddTwoInts, 'add_two_ints', self.add_two_ints_callback)

    def add_two_ints_callback(self, request, response):
        response.sum = request.a + request.b
        self.get_logger().info(f'Returning {request.a} + {request.b} = {response.sum}')
        return response


def main(args=None):
    rclpy.init(args=args)
    simple_service = SimpleService()
    rclpy.spin(simple_service)
    rclpy.shutdown()


if __name__ == '__main__':
    main()