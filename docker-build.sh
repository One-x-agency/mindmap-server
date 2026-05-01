docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t yashchauhan008/mindflow-backend:latest \
  --push .
