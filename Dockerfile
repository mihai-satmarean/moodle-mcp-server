# Production image using obot's base
FROM ghcr.io/obot-platform/mcp-images-phat:main

# Copy the pre-built application (build locally first)
COPY build/index.js ./moodle-mcp-server

USER root

# Make executable
RUN chmod +x ./moodle-mcp-server

RUN cat > nanobot.yaml <<'EOF'
publish:
  mcpServers: [server]

mcpServers:
  server:
    command: ./moodle-mcp-server
    args: [stdio]
    env:
      MOODLE_API_URL: ${MOODLE_API_URL}
      MOODLE_API_TOKEN: ${MOODLE_API_TOKEN}
      MOODLE_COURSE_ID: ${MOODLE_COURSE_ID}
EOF

RUN chown 1000 nanobot.yaml

# Set default PORT if not provided
ENV PORT=3000

ENTRYPOINT ["sh", "-c"]

CMD ["nanobot run --listen-address :${PORT} -e MOODLE_API_URL -e MOODLE_API_TOKEN -e MOODLE_COURSE_ID ./nanobot.yaml"]

USER 1000
