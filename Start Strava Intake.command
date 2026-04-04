#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
nohup uvicorn app.main:app --reload --port 8000 > logs/server.log 2>&1 &
echo "Server started. PID: $!"
echo $! > logs/server.pid
echo ""
echo "App running at http://localhost:8000"
echo "Log: $(pwd)/logs/server.log"
echo ""
echo "To stop the server, run Stop Strava Intake.command"
echo ""
echo "This window can be closed."
