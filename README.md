# ◈ ORION Messenger

Communication P2P sans SIM, sans serveur central — chiffrement E2E Ed25519.

## Architecture

```
Téléphone A  ←──── WebRTC P2P direct ────→  Téléphone B
                         ↑
              /api/signal (Vercel Serverless)
              Sert uniquement au handshake WebRTC
              Ne voit JAMAIS les messages
```

## Déploiement GitHub + Vercel

### 1. Crée le repo GitHub

```bash
git init
git add .
git commit -m "ORION init"
git remote add origin https://github.com/TON_USER/orion-messenger.git
git push -u origin main
```

### 2. Déploie sur Vercel

- Va sur [vercel.com](https://vercel.com)
- **Add New Project** → importe ton repo GitHub
- Framework Preset : **Other**
- Root Directory : `.` (racine)
- Clique **Deploy**

C'est tout. Vercel détecte automatiquement `vercel.json`.

### 3. Utilisation

1. Ouvre `ton-projet.vercel.app` sur ton téléphone
2. Entre un code room (ex: `ORION42`)
3. Ton contact ouvre la même URL et entre le même code
4. La connexion WebRTC s'établit automatiquement
5. Les messages passent directement de navigateur en navigateur

## Structure

```
orion-messenger/
├── public/
│   └── index.html      ← App complète (WebRTC + Ed25519 + UI)
├── api/
│   └── signal.js       ← Serveur signaling WebRTC (Vercel Serverless)
├── vercel.json         ← Config routing Vercel
└── README.md
```

## Sécurité

- **Ed25519** : chaque message est signé avec la clé privée de l'expéditeur
- **WebRTC** : canal DTLS chiffré, les messages ne passent pas par le serveur
- **Clé privée** : reste en mémoire locale, ne quitte jamais le navigateur
- **Serveur signaling** : données en mémoire, TTL 60s, aucune persistance

## Limitations actuelles

- Nécessite internet pour le handshake initial (STUN/signaling)
- Fonctionne tant que les deux onglets sont ouverts (pas de background sur mobile)
- Pour fonctionnement hors-ligne total → version React Native avec Bluetooth

## Roadmap

- [ ] PWA avec service worker
- [ ] Rooms persistantes (localStorage)
- [ ] Relay TURN pour réseaux restrictifs
- [ ] Version React Native (Bluetooth + WiFi Direct)
