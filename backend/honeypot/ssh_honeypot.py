import os
import socket
import threading
import logging
import httpx
import paramiko

os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    handlers=[
        logging.FileHandler("logs/honeypot.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("honeypot")

BACKEND_URL = "http://localhost:8000/attack"

def send_to_backend(ip, username, password):
    """Forward captured attack data to FastAPI backend asynchronously."""
    try:
        with httpx.Client() as client:
            client.post(
                BACKEND_URL,
                json={
                    "ip": ip,
                    "username": username,
                    "password": password
                },
                timeout=5
            )
    except Exception as e:
        logger.error(f"Failed to forward data to backend: {e}")

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
        thread = threading.Thread(
            target=send_to_backend,
            args=(self.client_ip, username, password)
        )
        thread.daemon = True
        thread.start()

        return paramiko.AUTH_FAILED

HOST_KEY = paramiko.RSAKey.generate(2048)

def handle_connection(client_socket, client_ip):
    transport = None
    try:
        transport = paramiko.Transport(client_socket)
        transport.add_server_key(HOST_KEY)
        server = HoneypotServer(client_ip)
        transport.start_server(server=server)
        
        # Keep channel open for auth attempts
        channel = transport.accept(30)
        if channel is not None:
            channel.close()
    except Exception as e:
        logger.debug(f"Session ended for {client_ip}: {e}")
    finally:
        if transport is not None:
            transport.close()
        client_socket.close()

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