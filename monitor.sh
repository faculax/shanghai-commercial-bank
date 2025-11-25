#!/bin/bash

# Fund Smith Monitor Script
# Monitors Render.com services by sending HTTP GET requests and tracking response times
# Designed to run every 4 minutes with dynamic sleep time based on request duration

# Set log file
LOG_FILE="monitor_log.txt"
INTERVAL=240 # 4 minutes in seconds

# Log to both console and file
log() {
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $1"
  echo "[$timestamp] $1" >> $LOG_FILE
}

log "Starting Fund Smith monitoring service"
log "Will monitor the following endpoints:"
log "- https://fund-smith.onrender.com/"
log "- https://fund-smith-gateway.onrender.com/api/trades"
log "- https://fund-smith-backend.onrender.com/api/trades"
log "==================================================="

# Main monitoring loop
while true; do
  start_time=$(date +%s)
  log "Starting monitoring cycle at $(date)"
  
  # Array of URLs to monitor
  urls=(
    "https://fund-smith.onrender.com/"
    "https://fund-smith-gateway.onrender.com/api/trades"
    "https://fund-smith-backend.onrender.com/api/trades"
  )
  
  # Track total request time
  total_request_time=0
  
  # Monitor each URL
  for url in "${urls[@]}"; do
    request_start=$(date +%s.%N)
    
    # Make the request with a timeout of 30 seconds
    # -s for silent mode, -w for custom output format, -o /dev/null to discard the response body
    # Store output in a variable for parsing
    result=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" -m 30 "$url" 2>/dev/null)
    
    # Check if curl command failed
    if [ $? -ne 0 ]; then
      http_code="ERROR"
      time_taken="30.000" # Default to timeout value
    else
      # Parse the output
      http_code=$(echo $result | cut -d',' -f1)
      time_taken=$(echo $result | cut -d',' -f2)
    fi
    
    request_end=$(date +%s.%N)
    
    # Calculate actual time taken for the whole operation
    operation_time=$(echo "$request_end - $request_start" | bc)
    total_request_time=$(echo "$total_request_time + $operation_time" | bc)
    
    # Format output
    if [ "$http_code" == "ERROR" ]; then
      log "❌ $url - Failed to connect (timeout or error) - ${time_taken}s"
    elif [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
      log "✅ $url - Status: $http_code - Response time: ${time_taken}s"
    elif [ "$http_code" -ge 300 ] && [ "$http_code" -lt 400 ]; then
      log "↩️ $url - Status: $http_code (Redirect) - Response time: ${time_taken}s"
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
      log "⚠️ $url - Status: $http_code (Client Error) - Response time: ${time_taken}s"
    elif [ "$http_code" -ge 500 ]; then
      log "🔥 $url - Status: $http_code (Server Error) - Response time: ${time_taken}s"
    else
      log "❓ $url - Status: $http_code (Unknown) - Response time: ${time_taken}s"
    fi
    
    # Small pause between requests to avoid overwhelming the server
    sleep 1
  done
  
  end_time=$(date +%s)
  cycle_duration=$(echo "$end_time - $start_time" | bc)
  
  log "Monitoring cycle completed in ${cycle_duration} seconds"
  
  # Calculate how long to wait until next cycle
  # Ensure we wait at least 5 seconds, even if the requests took longer than expected
  wait_time=$(echo "$INTERVAL - $cycle_duration" | bc)
  if (( $(echo "$wait_time < 5" | bc -l) )); then
    wait_time=5
  fi
  
  log "Starting countdown for ${wait_time} seconds until next monitoring cycle..."
  
  # Create countdown
  for (( countdown=$wait_time; countdown>0; countdown-- ))
  do
    # Clear the previous line if not the first iteration
    if [ $countdown -lt $wait_time ]; then
      printf "\r" # Carriage return to beginning of line
    fi
    
    # Print countdown with spinner animation
    spinner_char="⏱️"
    case $(( countdown % 4 )) in
      0) spinner_char="⏱️";;
      1) spinner_char="⏲️";;
      2) spinner_char="🕰️";;
      3) spinner_char="⏰";;
    esac
    
    # Format remaining time nicely
    if [ $countdown -ge 60 ]; then
      mins=$(( countdown / 60 ))
      secs=$(( countdown % 60 ))
      printf "$spinner_char Waiting: %02d:%02d remaining (%d seconds)..." $mins $secs $countdown
    else
      printf "$spinner_char Waiting: %02d seconds remaining..." $countdown
    fi
    
    # Sleep for one second
    sleep 1
  done
  
  # Print newline after countdown completes
  printf "\n"
  log "==================================================="
done