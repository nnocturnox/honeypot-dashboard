import socket
import threading
import paramiko
import logging
from datetime import datetime, timezone

# Logger configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    handlers=[
        logging.FileHandler("logs/honeypot.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("honeypot")

# SSH Server implementation
class HoneypotServer(paramiko.ServerInterface):
    def __init__(self, client_ip):
        self.client_ip = client_ip
        self.event = threading.Event()

    def check_channel_request(self, kind, chanid):
        if kind == "session":
            return paramiko.OPEN_SUCCEEDED
        return paramiko.OPEN_FAILED_ADMINISTRATIVELY_PROHIBITED

    def get_allowed_auths(self, username):
        return "password"

    def check_auth_none(self, username):
        return paramiko.AUTH_FAILED

    def check_auth_password(self, username, password):
        logger.info(
            f"LOGIN_ATTEMPT | ip={self.client_ip} | "
            f"user={username} | password={password}"
        )
        return paramiko.AUTH_FAILED

# Generate Host RSA Key
HOST_KEY = paramiko.RSAKey.generate(2048)

# Connection handler
def handle_connection(client_socket, client_ip):
    try:
        transport = paramiko.Transport(client_socket)
        transport.add_server_key(HOST_KEY)
        server = HoneypotServer(client_ip)
        transport.start_server(server=server)
        transport.accept(20)  # Wait up to 20 seconds for auth attempt
    except Exception as e:
        logger.debug(f"Connection error from {client_ip}: {e}")
    finally:
        client_socket.close()

# Main listener
def start_honeypot(host="0.0.0.0", port=2222):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((host, port))
    server_socket.listen(100)
    logger.info(f"SSH Honeypot listening on {host}:{port}")

    while True:
        client_socket, addr = server_socket.accept()
        client_ip = addr[0]
        logger.info(f"CONNECTION | ip={client_ip}")
        thread = threading.Thread(
            target=handle_connection,
            args=(client_socket, client_ip)
        )
        thread.daemon = True
        thread.start()

if __name__ == "__main__":
    start_honeypot()