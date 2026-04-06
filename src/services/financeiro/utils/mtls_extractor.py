import os
import tempfile
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding, PrivateFormat, NoEncryption
from cryptography.hazmat.backends import default_backend

class MTlsExtractor:
    def __init__(self, cert_path=None, password=None, pfx_data=None):
        self.cert_path = cert_path
        self.password = password.encode() if password else None
        self.pfx_data = pfx_data
        
        self.temp_cert_file = None
        self.temp_key_file = None

    def extract_to_temp_files(self):
        """
        Extracts the certificate and private key from the PFX and saves them 
        into secure temporary files. Returns the file paths (cert, key).
        """
        if self.pfx_data is not None:
            pfx_bytes = self.pfx_data
        elif self.cert_path and os.path.exists(self.cert_path):
            with open(self.cert_path, "rb") as f:
                pfx_bytes = f.read()
        else:
            raise ValueError("No PFX data or valid cert_path provided.")

        private_key, certificate, _ = pkcs12.load_key_and_certificates(
            pfx_bytes, self.password, default_backend()
        )

        cert_pem = certificate.public_bytes(Encoding.PEM)
        key_pem = private_key.private_bytes(
            Encoding.PEM,
            PrivateFormat.PKCS8,
            encryption_algorithm=NoEncryption()
        )

        # Create temporary files
        cert_fd, cert_path = tempfile.mkstemp(suffix=".pem")
        with os.fdopen(cert_fd, 'wb') as f:
            f.write(cert_pem)
        self.temp_cert_file = cert_path

        key_fd, key_path = tempfile.mkstemp(suffix=".key")
        with os.fdopen(key_fd, 'wb') as f:
            f.write(key_pem)
        self.temp_key_file = key_path

        return self.temp_cert_file, self.temp_key_file

    def cleanup(self):
        """
        Securely removes the temporary unencrypted PEM/KEY files from disk.
        """
        if self.temp_cert_file and os.path.exists(self.temp_cert_file):
            try:
                os.remove(self.temp_cert_file)
            except Exception as e:
                print(f"Error cleaning up temp cert file: {e}")
        
        if self.temp_key_file and os.path.exists(self.temp_key_file):
            try:
                os.remove(self.temp_key_file)
            except Exception as e:
                print(f"Error cleaning up temp key file: {e}")
