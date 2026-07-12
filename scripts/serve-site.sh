#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-8080}"
SERVE_DIR="${SERVE_DIR:-site}"
URL="http://127.0.0.1:$PORT"
LISTEN="tcp://127.0.0.1:$PORT"

ARCH=$(uname -m)
[ "$ARCH" = "arm64" ] && NODE_ARCH="arm64" || NODE_ARCH="x64"
NODE_DIR="$ROOT/.tools/node-v22.17.0-darwin-$NODE_ARCH"

if [ -f "$NODE_DIR/bin/node" ]; then
  export PATH="$NODE_DIR/bin:$PATH"
fi

pause_on_error() {
  echo ""
  read -r -p " 엔터를 누르면 종료합니다..."
}

if [ ! -f "$SERVE_DIR/index.html" ]; then
  echo ""
  echo " 정적 파일이 없습니다."
  echo " start.command 를 실행해 빌드를 완료해 주세요."
  pause_on_error
  exit 1
fi

is_meetflow_up() {
  curl -fsS --connect-timeout 1 "$URL/" 2>/dev/null | grep -q "MeetFlow"
}

start_server() {
  if command -v npx >/dev/null 2>&1; then
    echo "  Node.js 서버로 시작합니다..."
    exec npx --yes serve "$SERVE_DIR" -l "$LISTEN" --no-clipboard --no-port-switching
  fi

  if command -v python3 >/dev/null 2>&1; then
    echo "  Python 서버로 시작합니다..."
    exec python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$SERVE_DIR"
  fi

  echo ""
  echo " 서버를 시작할 수 없습니다."
  echo " start.command 를 다시 실행해 주세요."
  pause_on_error
  exit 1
}

echo ""
echo " MeetFlow — 브라우저에서 열기"
echo " ─────────────────────────"
echo ""

if is_meetflow_up; then
  echo "  기존 서버를 재시작합니다..."
  lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
  sleep 0.5
fi

if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "  포트 $PORT 가 다른 프로그램에서 사용 중입니다."
  echo "  아래 명령으로 종료 후 다시 시도하세요:"
  echo "  lsof -i :$PORT"
  pause_on_error
  exit 1
fi

echo "  서버 시작 중..."
start_server &
SERVER_PID=$!

READY=0
for _ in $(seq 1 30); do
  if is_meetflow_up; then
    READY=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    break
  fi
  sleep 0.3
done

if [ "$READY" -eq 1 ]; then
  echo "  $URL"
  echo ""
  echo "  종료: Ctrl+C"
  echo ""
  open "$URL"
  wait "$SERVER_PID"
  exit 0
fi

echo ""
echo " 서버 시작에 실패했습니다."
kill "$SERVER_PID" 2>/dev/null || true
pause_on_error
exit 1
