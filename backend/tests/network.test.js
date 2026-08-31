const test = require("node:test");
const assert = require("node:assert/strict");
const { getPreferredLocalIPv4, isPrivateIPv4 } = require("../src/utils/network");

test("identifica faixas IPv4 locais comuns", () => {
  assert.equal(isPrivateIPv4("192.168.1.20"), true);
  assert.equal(isPrivateIPv4("10.0.0.5"), true);
  assert.equal(isPrivateIPv4("172.16.4.5"), true);
  assert.equal(isPrivateIPv4("172.32.0.1"), false);
  assert.equal(isPrivateIPv4("8.8.8.8"), false);
});

test("prioriza adaptador físico em vez de virtual", () => {
  const interfaces = {
    "vEthernet (WSL)": [{ family: "IPv4", internal: false, address: "172.20.0.1" }],
    "Wi-Fi": [{ family: "IPv4", internal: false, address: "192.168.0.25" }],
  };
  assert.equal(getPreferredLocalIPv4(interfaces), "192.168.0.25");
});
