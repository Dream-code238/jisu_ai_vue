#!/bin/bash
# init-database.sh
# 极速购 AI 客服系统 — 数据库一键初始化脚本
# 用法: bash init-database.sh
# 前提: Docker 已安装并运行

set -e

echo "=========================================="
echo "  极速购 AI 客服系统 — 数据库初始化"
echo "=========================================="

CONTAINER_NAME="pgvector-jisu"
DB_NAME="jisu_ai"
DB_USER="postgres"
MIGRATIONS_DIR="server/src/db/migrations"

# ─── 第一步: 启动 Docker 容器 ───
echo ""
echo "[1/5] 检查 Docker 容器..."

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "  ✓ 容器 ${CONTAINER_NAME} 已在运行"
else
  echo "  → 启动容器..."
  docker compose up -d
  echo "  等待 PostgreSQL 就绪..."
  sleep 3
  docker exec ${CONTAINER_NAME} pg_isready -U ${DB_USER} -d ${DB_NAME}
fi

# ─── 第二步: 启用扩展 ───
echo ""
echo "[2/5] 启用 PostgreSQL 扩展..."

docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} \
  -c "CREATE EXTENSION IF NOT EXISTS vector;" \
  -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

echo "  ✓ vector (向量类型) 已启用"
echo "  ✓ pgcrypto (UUID 生成) 已启用"

# ─── 第三步: 执行迁移脚本 ───
echo ""
echo "[3/5] 执行数据库迁移脚本..."

MIGRATION_FILES=(
  "001_conversations.sql"
  "002_messages.sql"
  "003_guardrail_logs.sql"
  "004_cost_records.sql"
  "005_cache_entries.sql"
  "006_kb_documents.sql"
)

for file in "${MIGRATION_FILES[@]}"; do
  FILE_PATH="${MIGRATIONS_DIR}/${file}"
  if [ -f "$FILE_PATH" ]; then
    echo "  → 执行 ${file}..."
    docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} < "$FILE_PATH"
  else
    echo "  ✗ 文件不存在: ${FILE_PATH}"
    exit 1
  fi
done

# ─── 第四步: 验证 ───
echo ""
echo "[4/5] 验证数据库状态..."

TABLE_COUNT=$(docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "  → 数据表数量: ${TABLE_COUNT}"
echo ""
echo "  数据表列表:"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "\dt"

echo "  已安装扩展:"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "\dx"

# ─── 第五步: 提示下一步 ───
echo ""
echo "[5/5] 数据库初始化完成!"
echo ""
echo "  下一步操作:"
echo "    1. 进入 server 目录:  cd server"
echo "    2. 安装依赖:          npm install"
echo "    3. 知识库入库(可选):   npm run ingest"
echo "    4. 启动后端服务:      npm run dev"
echo ""
echo "  连接信息:"
echo "    Host:     localhost"
echo "    Port:     5432"
echo "    User:     postgres"
echo "    Password: 123456"
echo "    Database: jisu_ai"
echo ""
