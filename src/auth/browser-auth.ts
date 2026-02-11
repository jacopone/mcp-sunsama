import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { SunsamaClient } from 'sunsama-api/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getBrowserAuthConfig,
  type BrowserAuthConfig,
} from '../config/browser-auth-config.js';

/**
 * Session token storage location
 */
const SESSION_TOKEN_FILE = path.join(
  os.homedir(),
  '.sunsama-mcp',
  'session-token.json'
);

/**
 * Export BrowserAuthConfig type for external use
 */
export type { BrowserAuthConfig };

/**
 * Session token data structure
 */
interface SessionTokenData {
  token: string;
  expiresAt?: string;
  createdAt: string;
}

/**
 * Save session token to file
 * Note: In production, this should use system keychain (keytar)
 * For now, using JSON file with restricted permissions
 */
async function saveSessionToken(token: string): Promise<void> {
  const dir = path.dirname(SESSION_TOKEN_FILE);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  const data: SessionTokenData = {
    token,
    createdAt: new Date().toISOString(),
  };

  // Write with restricted permissions (600 = owner read/write only)
  fs.writeFileSync(SESSION_TOKEN_FILE, JSON.stringify(data, null, 2), {
    mode: 0o600,
  });

  console.error(`[Browser Auth] Session token saved to ${SESSION_TOKEN_FILE}`);
}

/**
 * Load session token from file
 */
async function loadSessionToken(): Promise<string | null> {
  if (!fs.existsSync(SESSION_TOKEN_FILE)) {
    return null;
  }

  try {
    const content = fs.readFileSync(SESSION_TOKEN_FILE, 'utf-8');
    const data: SessionTokenData = JSON.parse(content);

    console.error(`[Browser Auth] Loaded session token from ${SESSION_TOKEN_FILE}`);
    return data.token;
  } catch (error) {
    console.error(`[Browser Auth] Failed to load session token:`, error);
    return null;
  }
}

/**
 * Clear saved session token
 */
export function clearSessionToken(): void {
  if (fs.existsSync(SESSION_TOKEN_FILE)) {
    fs.unlinkSync(SESSION_TOKEN_FILE);
    console.error(`[Browser Auth] Session token cleared`);
  }
}

/**
 * Detect available browser channel
 */
function detectBrowserChannel(): 'chrome' | 'msedge' | 'chromium' | null {
  // Try to find Chrome
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const chromePath of chromePaths) {
    if (fs.existsSync(chromePath)) {
      console.error(`[Browser Auth] Found Chrome at ${chromePath}`);
      return 'chrome';
    }
  }

  // Try to find Edge
  const edgePaths = [
    '/usr/bin/microsoft-edge',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const edgePath of edgePaths) {
    if (fs.existsSync(edgePath)) {
      console.error(`[Browser Auth] Found Edge at ${edgePath}`);
      return 'msedge';
    }
  }

  console.error(`[Browser Auth] No browser found, will try 'chromium' channel`);
  return 'chromium';
}

/**
 * Launch browser and wait for user to login
 */
async function launchBrowserForLogin(
  config: BrowserAuthConfig = {}
): Promise<string> {
  const {
    loginTimeout = 5 * 60 * 1000, // 5 minutes
    browserChannel = detectBrowserChannel() || 'chromium',
    headless = false,
    executablePath,
  } = config;

  console.error(`[Browser Auth] Launching browser for authentication...`);
  console.error(`[Browser Auth] Browser channel: ${browserChannel}`);
  console.error(`[Browser Auth] Login timeout: ${loginTimeout}ms`);

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    // Launch browser with user's system browser
    browser = await chromium.launch({
      headless,
      channel: browserChannel as any,
      executablePath,
    });

    context = await browser.newContext();
    const page = await context.newPage();

    console.error(`[Browser Auth] Opening Sunsama login page...`);
    await page.goto('https://app.sunsama.com/login');

    console.error(`[Browser Auth] Waiting for user to complete login...`);
    console.error(`[Browser Auth] Please login in the browser window (Google OAuth or email)`);

    // Wait for successful redirect to main app
    await page.waitForURL('**/app/**', { timeout: loginTimeout });

    console.error(`[Browser Auth] Login successful! Extracting session token...`);

    // Extract all cookies
    const cookies = await context.cookies();

    // Look for Sunsama session cookie
    // Known names: 'sunsamaSession', 'connect.sid', 'session', or contains 'auth'/'session'
    const sessionCookie = cookies.find(
      (c) =>
        c.name === 'sunsamaSession' ||
        c.name === 'connect.sid' ||
        c.name === 'session' ||
        c.name.includes('auth') ||
        c.name.includes('session')
    );

    if (!sessionCookie) {
      throw new Error(
        'Could not find session cookie. Cookies found: ' +
          cookies.map((c) => c.name).join(', ')
      );
    }

    console.error(`[Browser Auth] Found session cookie: ${sessionCookie.name}`);

    const sessionToken = sessionCookie.value;

    await browser.close();

    return sessionToken;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * Authenticate using browser OAuth flow
 *
 * This function:
 * 1. Checks for saved session token
 * 2. If none found, launches browser for user login
 * 3. Extracts session token from browser cookies
 * 4. Saves token for future use
 * 5. Returns authenticated SunsamaClient
 *
 * @param config - Browser authentication configuration
 * @returns Authenticated SunsamaClient instance
 * @throws Error if authentication fails or browser cannot be launched
 */
export async function authenticateWithBrowser(
  config?: BrowserAuthConfig
): Promise<SunsamaClient> {
  console.error(`[Browser Auth] Starting browser authentication...`);

  // Merge provided config with environment config
  const envConfig = getBrowserAuthConfig();
  const mergedConfig: BrowserAuthConfig = {
    ...envConfig,
    ...config, // User-provided config takes precedence
  };

  // Try to load existing session token
  let sessionToken = await loadSessionToken();

  if (sessionToken) {
    console.error(`[Browser Auth] Found saved session token, attempting to use it...`);

    // Try to use saved token
    const client = new SunsamaClient();
    try {
      // Access private method using TypeScript casting
      (client as any).setSessionTokenAsCookie(sessionToken);

      // Verify token works by getting user
      await client.getUser();

      console.error(`[Browser Auth] Saved session token is valid!`);
      return client;
    } catch (error) {
      console.error(`[Browser Auth] Saved session token is invalid or expired`);
      console.error(`[Browser Auth] Error:`, error);
      clearSessionToken();
      sessionToken = null;
    }
  }

  // No valid saved token, launch browser for new login
  console.error(`[Browser Auth] No valid saved token, launching browser...`);
  sessionToken = await launchBrowserForLogin(mergedConfig);

  // Save token for future use
  await saveSessionToken(sessionToken);

  // Create authenticated client
  const client = new SunsamaClient();
  (client as any).setSessionTokenAsCookie(sessionToken);

  // Verify authentication works
  try {
    await client.getUser();
    console.error(`[Browser Auth] Authentication successful!`);
  } catch (error) {
    console.error(`[Browser Auth] Authentication failed:`, error);
    throw new Error('Failed to authenticate with extracted session token');
  }

  return client;
}

/**
 * Check if browser authentication is required
 * (no email/password provided)
 */
export function isBrowserAuthRequired(): boolean {
  return !process.env.SUNSAMA_EMAIL || !process.env.SUNSAMA_PASSWORD;
}
