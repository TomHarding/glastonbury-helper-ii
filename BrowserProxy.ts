export class BrowserProxy {
  ip: string
  port: number
  username: string
  password: string

  constructor(ip: string, port: number, username: string, password: string) {
    this.ip = ip
    this.port = port
    this.username = username
    this.password = password
  }
}
