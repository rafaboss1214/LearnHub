const { networkInterfaces } = require("node:os");

function isPrivateIPv4(address) {
  const parts = String(address).split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
  );
}

function adapterScore(name, address) {
  const normalizedName = name.toLowerCase();
  let score = 0;

  if (/wi-?fi|wlan|wireless|ethernet|lan/.test(normalizedName)) score += 100;
  if (/virtual|veth|vethernet|wsl|docker|vmware|hyper-v|loopback|bluetooth/.test(normalizedName)) score -= 200;
  if (address.startsWith("192.168.")) score += 30;
  if (address.startsWith("10.")) score += 20;
  if (address.startsWith("172.")) score += 10;
  if (address.startsWith("169.254.")) score -= 50;

  return score;
}

function getLocalIPv4Addresses(interfaces = networkInterfaces()) {
  const candidates = [];

  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries || []) {
      const isIPv4 = entry.family === "IPv4" || entry.family === 4;
      if (!isIPv4 || entry.internal || !isPrivateIPv4(entry.address)) continue;
      candidates.push({ name, address: entry.address, score: adapterScore(name, entry.address) });
    }
  }

  return candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function getPreferredLocalIPv4(interfaces) {
  return getLocalIPv4Addresses(interfaces)[0]?.address || null;
}

module.exports = { isPrivateIPv4, getLocalIPv4Addresses, getPreferredLocalIPv4 };
