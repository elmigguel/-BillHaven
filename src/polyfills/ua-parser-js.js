// ESM wrapper for ua-parser-js (CommonJS compatibility)
// This fixes: "does not provide an export named 'default'"

const EMPTY = '';
const UNKNOWN = '?';

// Simplified UAParser for browser
class UAParser {
  constructor(ua) {
    this.ua = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  }

  getBrowser() {
    const ua = this.ua;
    let name = UNKNOWN;
    let version = UNKNOWN;

    if (/firefox/i.test(ua)) {
      name = 'Firefox';
      version = ua.match(/firefox\/(\d+(\.\d+)?)/i)?.[1] || UNKNOWN;
    } else if (/edg/i.test(ua)) {
      name = 'Edge';
      version = ua.match(/edg\/(\d+(\.\d+)?)/i)?.[1] || UNKNOWN;
    } else if (/chrome/i.test(ua)) {
      name = 'Chrome';
      version = ua.match(/chrome\/(\d+(\.\d+)?)/i)?.[1] || UNKNOWN;
    } else if (/safari/i.test(ua)) {
      name = 'Safari';
      version = ua.match(/version\/(\d+(\.\d+)?)/i)?.[1] || UNKNOWN;
    }

    return { name, version, major: version.split('.')[0] };
  }

  getDevice() {
    const ua = this.ua;
    let type = undefined;
    let vendor = UNKNOWN;
    let model = UNKNOWN;

    if (/mobile/i.test(ua)) type = 'mobile';
    else if (/tablet/i.test(ua)) type = 'tablet';

    if (/iphone/i.test(ua)) { vendor = 'Apple'; model = 'iPhone'; type = 'mobile'; }
    else if (/ipad/i.test(ua)) { vendor = 'Apple'; model = 'iPad'; type = 'tablet'; }
    else if (/android/i.test(ua)) { vendor = 'Android'; }

    return { type, vendor, model };
  }

  getOS() {
    const ua = this.ua;
    let name = UNKNOWN;
    let version = UNKNOWN;

    if (/windows/i.test(ua)) {
      name = 'Windows';
      if (/windows nt 10/i.test(ua)) version = '10';
      else if (/windows nt 6.3/i.test(ua)) version = '8.1';
      else if (/windows nt 6.2/i.test(ua)) version = '8';
      else if (/windows nt 6.1/i.test(ua)) version = '7';
    } else if (/mac os x/i.test(ua)) {
      name = 'macOS';
      version = ua.match(/mac os x (\d+[._]\d+)/i)?.[1]?.replace('_', '.') || UNKNOWN;
    } else if (/linux/i.test(ua)) {
      name = 'Linux';
    } else if (/android/i.test(ua)) {
      name = 'Android';
      version = ua.match(/android (\d+(\.\d+)?)/i)?.[1] || UNKNOWN;
    } else if (/ios|iphone|ipad/i.test(ua)) {
      name = 'iOS';
      version = ua.match(/os (\d+[._]\d+)/i)?.[1]?.replace('_', '.') || UNKNOWN;
    }

    return { name, version };
  }

  getEngine() {
    const ua = this.ua;
    let name = UNKNOWN;
    let version = UNKNOWN;

    if (/webkit/i.test(ua)) {
      name = 'WebKit';
      version = ua.match(/webkit\/(\d+(\.\d+)?)/i)?.[1] || UNKNOWN;
    } else if (/gecko/i.test(ua)) {
      name = 'Gecko';
      version = ua.match(/rv:(\d+(\.\d+)?)/i)?.[1] || UNKNOWN;
    }

    return { name, version };
  }

  getCPU() {
    const ua = this.ua;
    let architecture = UNKNOWN;

    if (/x86_64|x64|amd64|win64/i.test(ua)) architecture = 'amd64';
    else if (/ia32|x86|wow64/i.test(ua)) architecture = 'ia32';
    else if (/arm64|aarch64/i.test(ua)) architecture = 'arm64';
    else if (/arm/i.test(ua)) architecture = 'arm';

    return { architecture };
  }

  getResult() {
    return {
      ua: this.ua,
      browser: this.getBrowser(),
      device: this.getDevice(),
      os: this.getOS(),
      engine: this.getEngine(),
      cpu: this.getCPU()
    };
  }

  setUA(ua) {
    this.ua = ua;
    return this;
  }
}

// Named exports
export { UAParser };

// Default export
export default UAParser;
