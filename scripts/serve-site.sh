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
  echo " start.command / open.command 를 실행해 빌드를 완료해 주세요."
  pause_on_error
  exit 1
fi

BUILD_STAMP="$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$SERVE_DIR/index.html" 2>/dev/null || date '+%Y-%m-%d %H:%M:%S')"
# Cache-bust so the browser does not reuse an old tab document
OPEN_URL="${URL}/?v=$(date +%s)"

is_meetflow_up() {
  curl -fsS --connect-timeout 1 "$URL/" 2>/dev/null | grep -q "MeetFlow"
}

free_port() {
  local pids
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "  포트 $PORT 기존 프로세스 종료 중..."
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.4
    pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
      sleep 0.3
    fi
  fi
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
  echo " open.command 를 다시 실행해 주세요."
  pause_on_error
  exit 1
}

echo ""
echo " MeetFlow — 브라우저에서 열기"
echo " ─────────────────────────"
echo "  빌드 시각: $BUILD_STAMP"
echo ""

free_port

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
for _ in $(seq 1 40); do
  if is_meetflow_up; then
    READY=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    break
  fi
  sleep 0.25
done

if [ "$READY" -eq 1 ]; then
  echo "  $URL"
  echo "  (새 탭: $OPEN_URL)"
  echo ""
  echo "  종료: Ctrl+C"
  echo ""
  open "$OPEN_URL"
  wait "$SERVER_PID"
  exit 0
fi

echo ""
echo " 서버 시작에 실패했습니다."
kill "$SERVER_PID" 2>/dev/null || true
pause_on_error
exit 1
