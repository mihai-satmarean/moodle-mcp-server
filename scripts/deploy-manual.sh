#!/bin/bash
set -e

echo "🚀 Manual Deployment Script for Moodle MCP Server"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

NAMESPACE="obot-mcp"
DEPLOYMENT_LABEL="app.kubernetes.io/name=moodle-mcp-server"
IMAGE_REGISTRY="ghcr.io"
IMAGE_NAME="mihai-satmarean/moodle-mcp-server"

echo ""
echo "📦 Step 1: Building Docker Image..."
echo "-----------------------------------"
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.nanobot \
  -t ${IMAGE_REGISTRY}/${IMAGE_NAME}:latest \
  --push \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Docker image built and pushed successfully!${NC}"
else
  echo -e "${RED}❌ Docker build failed!${NC}"
  exit 1
fi

echo ""
echo "♻️  Step 2: Restarting Kubernetes Deployment..."
echo "------------------------------------------------"
kubectl rollout restart deployment \
  -n ${NAMESPACE} \
  -l ${DEPLOYMENT_LABEL}

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Kubernetes restart triggered!${NC}"
else
  echo -e "${YELLOW}⚠️  Kubernetes restart failed (might be already running)${NC}"
fi

echo ""
echo "🔍 Step 3: Watching Deployment Status..."
echo "-----------------------------------------"
kubectl rollout status deployment \
  -n ${NAMESPACE} \
  -l ${DEPLOYMENT_LABEL} \
  --timeout=5m

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
else
  echo -e "${RED}❌ Deployment timed out or failed!${NC}"
  exit 1
fi

echo ""
echo "📊 Step 4: Checking Pod Status..."
echo "----------------------------------"
kubectl get pods -n ${NAMESPACE} -l ${DEPLOYMENT_LABEL}

echo ""
echo -e "${GREEN}🎉 Deployment complete! Test the bot now!${NC}"
echo ""
echo "Test command for bot:"
echo "  Pentru studentul Sorin Stan (ID 21648) arată-mi toate rezultatele la quiz-urile din cursul 1301"
