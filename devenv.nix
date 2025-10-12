{ pkgs, lib, config, inputs, ... }:

{
  # Package management
  packages = with pkgs; [
    # Node.js ecosystem
    nodejs_20
    bun

    # Build tools for native dependencies
    gcc
    gnumake
    pkg-config
    python3

    # Development tools
    git
  ];

  # Language-specific configuration
  languages.typescript.enable = true;
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_20;
    npm.enable = true;
    npm.install.enable = true;
  };

  # Environment variables
  env = {
    # Ensure native modules can find system libraries
    NPM_CONFIG_BUILD_FROM_SOURCE = "true";
  };

  # Shell hooks
  enterShell = ''
    echo "🚀 MCP Sunsama Development Environment"
    echo "📦 Node.js $(node --version)"
    echo "📦 npm $(npm --version)"
    echo ""
    echo "Available commands:"
    echo "  npm install      - Install dependencies"
    echo "  npm run dev      - Run development server"
    echo "  npm test         - Run tests"
    echo "  npm run build    - Build project"
    echo ""
  '';

  # Git hooks for code quality
  git-hooks.hooks = {
    # TypeScript type checking
    tsc = {
      enable = true;
      name = "TypeScript type check";
      entry = "${pkgs.nodejs_20}/bin/npx tsc --noEmit";
      files = "\\.(ts|tsx)$";
    };
  };
}
