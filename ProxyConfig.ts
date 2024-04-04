import { BrowserProxy } from "./BrowserProxy"

export function ProxyConfig() {
  return [
    new BrowserProxy("00.000.000.000", 9999, "username", "password"),
  ]
}
