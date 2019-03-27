import * as fs from 'fs-extra';
import * as forge from 'node-forge';
import * as path from 'path';
import { globalState } from './global-state';
import { tempPath } from './structor-config';

export function generateCertificate() {
  const cacheDir = path.join(globalState.projectRootPath, `${tempPath.dir}/ssl`);

  const privateKeyPath = path.join(cacheDir, 'private.pem');
  const certPath = path.join(cacheDir, 'primary.crt');
  const cachedKey = fs.existsSync(privateKeyPath) && fs.readFileSync(privateKeyPath);
  const cachedCert = fs.existsSync(certPath) && fs.readFileSync(certPath);
  if (cachedKey && cachedCert) {
    return {
      key: cachedKey,
      cert: cachedCert
    };
  }

  const {pki} = forge;
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '02';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    {
      name: 'commonName',
      value: 'prijs.org'
    },
    {
      name: 'countryName',
      value: 'China'
    },
    {
      shortName: 'ST',
      value: 'Virginiae'
    },
    {
      name: 'localityName',
      value: 'Blacks'
    },
    {
      name: 'organizationName',
      value: 'pri'
    },
    {
      shortName: 'OU',
      value: 'pri test'
    }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 6, // URI
          value: 'http://pri.org/webid#me'
        },
        {
          type: 7, // IP
          ip: '127.0.0.1'
        }
      ]
    },
    {
      name: 'subjectKeyIdentifier'
    }
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  const privPem = pki.privateKeyToPem(keys.privateKey);
  const certPem = pki.certificateToPem(cert);

  fs.ensureDirSync(cacheDir);
  fs.writeFileSync(privateKeyPath, privPem);
  fs.writeFileSync(certPath, certPem);

  return {
    key: privPem,
    cert: certPem
  };
}
