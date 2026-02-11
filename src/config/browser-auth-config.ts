/**
 * Browser authentication configuration
 *
 * Configuration for browser-based OAuth authentication flow.
 * All settings can be overridden via environment variables.
 */

export interface BrowserAuthConfig {
  /**
   * Timeout for user to complete login (milliseconds)
   * Default: 5 minutes (300000ms)
   * Environment: BROWSER_AUTH_TIMEOUT
   */
  loginTimeout?: number;

  /**
   * Browser to launch (chrome, msedge, chromium)
   * Default: auto-detect (tries chrome → msedge → chromium)
   * Environment: BROWSER_AUTH_CHANNEL
   */
  browserChannel?: "chrome" | "msedge" | "chromium";

  /**
   * Whether to show browser window (false = headless)
   * Default: false (show browser for user to login)
   * Environment: BROWSER_AUTH_HEADLESS
   */
  headless?: boolean;

  /**
   * Custom browser executable path (optional)
   * Environment: BROWSER_AUTH_EXECUTABLE_PATH
   */
  executablePath?: string;
}

/**
 * Get browser auth configuration from environment variables
 */
export function getBrowserAuthConfig(): BrowserAuthConfig {
  const config: BrowserAuthConfig = {};

  // Login timeout (default: 5 minutes)
  if (process.env.BROWSER_AUTH_TIMEOUT) {
    const timeout = parseInt(process.env.BROWSER_AUTH_TIMEOUT, 10);
    if (!isNaN(timeout) && timeout > 0) {
      config.loginTimeout = timeout;
    } else {
      console.error(
        `[Browser Auth Config] Invalid BROWSER_AUTH_TIMEOUT: ${process.env.BROWSER_AUTH_TIMEOUT}, using default (300000ms)`
      );
    }
  }

  // Browser channel
  if (process.env.BROWSER_AUTH_CHANNEL) {
    const channel = process.env.BROWSER_AUTH_CHANNEL.toLowerCase();
    if (channel === "chrome" || channel === "msedge" || channel === "chromium") {
      config.browserChannel = channel;
    } else {
      console.error(
        `[Browser Auth Config] Invalid BROWSER_AUTH_CHANNEL: ${process.env.BROWSER_AUTH_CHANNEL}, using auto-detect`
      );
    }
  }

  // Headless mode
  if (process.env.BROWSER_AUTH_HEADLESS) {
    const headless = process.env.BROWSER_AUTH_HEADLESS.toLowerCase();
    if (headless === "true" || headless === "1") {
      config.headless = true;
    } else if (headless === "false" || headless === "0") {
      config.headless = false;
    } else {
      console.error(
        `[Browser Auth Config] Invalid BROWSER_AUTH_HEADLESS: ${process.env.BROWSER_AUTH_HEADLESS}, using default (false)`
      );
    }
  }

  // Custom executable path
  if (process.env.BROWSER_AUTH_EXECUTABLE_PATH) {
    config.executablePath = process.env.BROWSER_AUTH_EXECUTABLE_PATH;
  }

  return config;
}

/**
 * Default browser auth configuration values
 */
export const DEFAULT_BROWSER_AUTH_CONFIG: Required<BrowserAuthConfig> = {
  loginTimeout: 5 * 60 * 1000, // 5 minutes
  browserChannel: "chrome",
  headless: false,
  executablePath: "",
};
