#!/bin/sh

# Function to replace environment variables in JavaScript files
replace_env_vars() {
    echo "Replacing environment variables in built files..."
    
    # Get the API_BASE_URL from environment or use default
    API_URL=${REACT_APP_API_BASE_URL:-"https://fxtrading-gateway-fnhnhybfhzdubycz.uksouth-01.azurewebsites.net/api"}
    echo "Using REACT_APP_API_BASE_URL: $API_URL"
    
    # Find all JavaScript files in the build directory
    find /usr/share/nginx/html -name "*.js" -type f | while read file; do
        # Replace the API_BASE_URL placeholder with actual value
        sed -i "s|http://localhost:8081/api|$API_URL|g" "$file"
    done
    
    echo "Environment variable substitution complete"
}

# Function to update version endpoint with build information
update_version_endpoint() {
    echo "Updating version endpoint with build information..."
    
    # Get build information
    BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    BUILD_TIMESTAMP=$(date +%s)
    VERSION=${REACT_APP_VERSION:-"1.0.0"}
    ENVIRONMENT=${NODE_ENV:-"production"}
    API_URL=${REACT_APP_API_BASE_URL:-"https://fxtrading-gateway-fnhnhybfhzdubycz.uksouth-01.azurewebsites.net/api"}
    
    echo "Build Time: $BUILD_TIME"
    echo "Build Timestamp: $BUILD_TIMESTAMP"
    echo "Version: $VERSION"
    echo "Environment: $ENVIRONMENT"
    echo "API Base URL: $API_URL"
    
    # Update the version.json file
    sed -i "s|BUILD_TIME_PLACEHOLDER|$BUILD_TIME|g" /usr/share/nginx/html/api/version.json
    sed -i "s|BUILD_TIMESTAMP_PLACEHOLDER|$BUILD_TIMESTAMP|g" /usr/share/nginx/html/api/version.json
    sed -i "s|VERSION_PLACEHOLDER|$VERSION|g" /usr/share/nginx/html/api/version.json
    sed -i "s|ENVIRONMENT_PLACEHOLDER|$ENVIRONMENT|g" /usr/share/nginx/html/api/version.json
    sed -i "s|API_BASE_URL_PLACEHOLDER|$API_URL|g" /usr/share/nginx/html/api/version.json
    
    echo "Version endpoint updated successfully"
}

# Run the replacement functions
replace_env_vars
update_version_endpoint

# Execute the main command
exec "$@"

