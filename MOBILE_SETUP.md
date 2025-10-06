# Mobile Access Setup Guide

## How to Access Your App from Mobile Devices

### 1. Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your network interface

### 2. Start Your Servers

**Backend (Terminal 1):**
```bash
cd Backend
npm start
```

**Frontend (Terminal 2):**
```bash
cd Frontend
npm run dev
```

### 3. Access from Mobile

1. Make sure your mobile device is connected to the **same WiFi network** as your computer
2. Open your mobile browser
3. Navigate to: `http://YOUR_IP_ADDRESS:3000`
   - Replace `YOUR_IP_ADDRESS` with the IP you found in step 1
   - Example: `http://192.168.1.100:3000`

### 4. What I Fixed

✅ **CORS Configuration**: Updated backend to allow all origins for development
✅ **Dynamic API URLs**: Created smart API configuration that automatically detects the environment
✅ **Mobile-Friendly**: API calls now work from mobile devices by using the same hostname

### 5. Troubleshooting

- **Still getting errors?** Make sure both servers are running
- **Can't connect?** Check that your mobile device and computer are on the same WiFi
- **Firewall issues?** You might need to allow Node.js through Windows Firewall

The app will now automatically detect whether you're accessing it from localhost (desktop) or from a mobile device and use the appropriate API URLs.
