#!/bin/bash
cd "$(dirname "$0")"
if [ -f logs/server.pid ]; then
  PID=$(cat logs/server.pid)
  kill $PID 2>/dev/null && echo "Server stopped (PID $PID)." || echo "Server was not running."
  rm logs/server.pid
else
  echo "No running server found."
fi
