#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting PlanPilot deployment process...${NC}"

# Build client
echo -e "${YELLOW}Building client application...${NC}"
cd client
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Client build failed!${NC}"
  exit 1
fi
echo -e "${GREEN}Client build successful!${NC}"

# Copy client build to server's public directory
echo -e "${YELLOW}Copying client build to server public directory...${NC}"
cd ../server
rm -rf public
mkdir -p public
cp -r ../client/build/* public/
echo -e "${GREEN}Copy complete!${NC}"

# Setup for deployment
echo -e "${YELLOW}Setting up for deployment...${NC}"
cd ..
git add .
git status

echo -e "${GREEN}Deployment preparation complete!${NC}"
echo -e "${YELLOW}Ready to commit and push to deploy to Render.${NC}"
echo -e "Run the following commands to deploy:"
echo -e "${GREEN}git commit -m \"Deploy update with Telegram WebApp support\"${NC}"
echo -e "${GREEN}git push${NC}" 