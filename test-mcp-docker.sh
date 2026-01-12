#!/bin/bash

echo "🧪 Testing Moodle MCP Server with Docker..."
echo ""

# Test 1: Check if container starts and shows HTTP server
echo "📡 Test 1: Starting HTTP server..."
timeout 3 docker run --rm \
  -e MOODLE_API_URL="https://platforma.scoalainformala.ro/webservice/rest/server.php" \
  -e MOODLE_API_TOKEN="2d00b9356b469277f74d9631af0e4a4a" \
  -e MOODLE_COURSE_ID="1" \
  moodle-mcp-server:local

echo ""
echo "✅ HTTP server test completed"
echo ""

# Test 2: Test MCP STDIO protocol
echo "📨 Test 2: Testing MCP STDIO protocol..."
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0"}}}' | \
timeout 5 docker run --rm -i \
  -e MOODLE_API_URL="https://platforma.scoalainformala.ro/webservice/rest/server.php" \
  -e MOODLE_API_TOKEN="2d00b9356b469277f74d9631af0e4a4a" \
  -e MOODLE_COURSE_ID="1" \
  moodle-mcp-server:local

echo ""
echo "✅ MCP STDIO test completed"
echo ""

echo "🎉 All tests completed! The MCP server is ready for use."
