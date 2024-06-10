How did I successful install SSL certificates for my ticketing app deployed at www.mytiket.xyz
1. I need a domain, I bought it from namecheap
2. Config in namecheap and digital ocean to point the domain do my digital ocean deployed app.
3. For the certificate
- Create the Issuer
- First, modify the Ingress: add the issuer, host, tls section...
- Install certmanager
- Delete the old certificate and wait for 2 days. Before that, the certifcate is not available yet.