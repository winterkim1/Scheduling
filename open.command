#!/bin/bash
cd "$(dirname "$0")"

ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  NODE_ARCH="arm64"
else
  NODE_ARCH="x64"
fi

NODE_VER="v22.17.0"
NODE_DIR=".tools/node-$NODE_VER-darwin-$NODE_ARCH"

if [ ! -f "$NODE_DIR/bin/node" ]; then
  echo ""
  echo " Node.js 설치 중 (최초 1회)..."
  mkdir -p .tools
  curl -fsSL "https://nodejs.org/dist/$NODE_VER/node-$NODE_VER-darwin-$NODE_ARCH.tar.gz" -o .tools/node.tar.gz
  tar -xzf .tools/node.tar.gz -C .tools
  rm .tools/node.tar.gz
fi

export PATH="$(pwd)/$NODE_DIR/bin:$PATH"

if [ ! -d "node_modules" ]; then
  echo ""
  echo " 패키지 설치 중..."
  npm install
fi

echo ""
echo " 최신 변경사항 반영 중..."
npm run build:static

chmod +x ./scripts/serve-site.sh
exec ./scripts/serve-site.sh
