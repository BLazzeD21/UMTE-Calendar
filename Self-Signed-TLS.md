### Using a Self-Signed TLS Certificate in Nginx

> [!IMPORTANT]
> To do this, you must have your own domain associated with your server's IP address.

Let's issue a certificate for the domain name `<domain>` and IP address `<ip>`. In all commands you will need to replace with your own.

Create a directory where certificates will be stored:

```bash
mkdir ~/tls && cd ~/tls
```

Issue a key and certificate for our CA (Certificate authority):

```bash
openssl ecparam -out myCA.key -name prime256v1 -genkey
```

```bash
openssl req -x509 -new -nodes -key myCA.key -sha256 -days 365 -out myCA.crt
```

You will be asked a series of questions. Answer all the questions.

Issue a key and certificate for the server:

```bash
openssl genrsa -out <domain>.key 2048
openssl req -new -key <domain>.key -out <domain>.csr
```

Again answers all questions. Prepare the configuration file:

```bash
nano zabbix.internal.ext
```

Insert this config:

```bash
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
IP.1 = <ip>
DNS.1 = <domain>
```

Generate a certificate based on it:

```bash
openssl x509 -req -in <domain>.csr -CA myCA.crt -CAkey myCA.key -CAcreateserial -out <domain>.crt -days 9999 -sha256 -extfile <domain>.ext
```

Copy the certificate and key to the Nginx directory:

```bash
mkdir /etc/nginx/certs
cp <domain>.crt /etc/nginx/certs/.
cp <domain>.key /etc/nginx/certs/.
```

Create a `dhparam` file that will be needed to configure Nginx:

```bash
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
```

Open the nginx configuration file for editing:

`sudo nano /etc/nginx/sites-available/default`

Replace:

```bash
listen 80;
server_name yourdomain.com;
```

on

```bash
listen 443 http2 ssl;
server_name <domain> <ip>;
ssl_certificate /etc/nginx/certs/<domain>.crt;
ssl_certificate_key /etc/nginx/certs/<domain>.key;
ssl_dhparam /etc/ssl/certs/dhparam.pem;
```

Save and close the configuration file. Now let's test the configuration:

```bash
nginx -t
```

If you did everything correctly, then it should display:

```bash
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Restart Nginx:

```bash
nginx -s reload
```

Transfer the myCA.crt file to your computer and add it to the root trusted certification authority store. The configuration will be performed from an external system. If you need to immediately configure the protection of this CA locally on the server, do the following:

```bash
cp myCA.crt /usr/local/share/ca-certificates/.
update-ca-certificates
```

Now you can use your browser to access the domain name or IP address, and the self-signed certificate will work.
