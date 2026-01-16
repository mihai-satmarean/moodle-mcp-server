# Deployment Scripts

## 🚀 Manual Deployment

If GitHub Actions CI/CD fails or you need immediate deployment:

```bash
./scripts/deploy-manual.sh
```

**Requirements:**
- Docker with buildx support
- kubectl configured with access to the cluster
- Permissions to push to `ghcr.io/mihai-satmarean/moodle-mcp-server`

**What it does:**
1. ✅ Builds multi-arch Docker image (amd64, arm64)
2. ✅ Pushes to GitHub Container Registry
3. ✅ Triggers Kubernetes rollout restart in `obot-mcp` namespace
4. ✅ Watches deployment status until complete
5. ✅ Shows pod status

**Estimated time:** 8-12 minutes

---

## 🔄 Quick Restart (Without Rebuild)

If Docker image is already built and you just need to restart:

```bash
kubectl rollout restart deployment -n obot-mcp -l app.kubernetes.io/name=moodle-mcp-server
kubectl rollout status deployment -n obot-mcp -l app.kubernetes.io/name=moodle-mcp-server
```

**Estimated time:** 1-2 minutes

---

## 🔍 Check Status

### GitHub Actions Status
```bash
gh run list --repo mihai-satmarean/moodle-mcp-server --limit 5
```

Or visit: https://github.com/mihai-satmarean/moodle-mcp-server/actions

### Kubernetes Status
```bash
kubectl get pods -n obot-mcp -l app.kubernetes.io/name=moodle-mcp-server
kubectl logs -n obot-mcp -l app.kubernetes.io/name=moodle-mcp-server --tail=50
```

### Docker Image Status
```bash
docker manifest inspect ghcr.io/mihai-satmarean/moodle-mcp-server:latest
```

---

## 🧪 Test After Deployment

Ask the bot:

```
Ce tools noi ai disponibile pentru quiz results?
```

Expected response should include:
- ✅ `tutor_get_student_all_quiz_results`
- ✅ `tutor_get_quiz_leaderboard`
- ✅ `tutor_get_course_quiz_completion`
- ✅ `tutor_get_student_quiz_attempts`
- ✅ `tutor_compare_students_quiz_performance`

Then test with real data:

```
Pentru studentul Sorin Stan (ID 21648) arată-mi toate rezultatele la quiz-urile din cursul 1301
```

---

## 🐛 Troubleshooting

### Build fails with "permission denied"
Login to GitHub Container Registry:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Kubernetes connection fails
Check kubeconfig:
```bash
kubectl config current-context
kubectl get ns obot-mcp
```

### Pod stuck in "ImagePullBackOff"
Check image exists:
```bash
docker pull ghcr.io/mihai-satmarean/moodle-mcp-server:latest
```

Check pod events:
```bash
kubectl describe pod -n obot-mcp -l app.kubernetes.io/name=moodle-mcp-server
```

### Bot still shows old tools
1. Check pod is using new image:
   ```bash
   kubectl get pods -n obot-mcp -l app.kubernetes.io/name=moodle-mcp-server -o jsonpath='{.items[*].spec.containers[*].image}'
   ```

2. Force pod recreation:
   ```bash
   kubectl delete pods -n obot-mcp -l app.kubernetes.io/name=moodle-mcp-server
   ```

3. Check logs for errors:
   ```bash
   kubectl logs -n obot-mcp -l app.kubernetes.io/name=moodle-mcp-server --tail=100
   ```
