# 极速购 AI 客服系统

## 一、项目介绍

## 二、功能扩展

### 1. 依赖变更

#### (1) 前端依赖

- chart.js 图表库（KPI sparkline/柱状图/环形图）
- chartjs-adapter-date-fns 日期适配（sparkline时间轴，可选）

### (2) 后端依赖

- multer （multipart/form-data）文件上传中间件
- @langchain/community （PGVectorStore + 各种loader）
- @langchain/langgraph-checkpoint-postgres LangGraph 持久化（PostgresSaver checkpointer）
- pdf-parse 轻量 PDF 解析
- mammoth .docx -> 纯文本

## 三、Docker PostgreSQL + pgvector 数据生命周期管理手册

### 1. 核心概念：为什么数据删不掉？

- ‌容器层（Ephemeral）‌：容器内部的文件系统是临时的。如果没挂载卷，docker rm 后数据确实没了。
- ‌数据卷/挂载点（Persistent）‌：为了保存数据库数据，我们通常使用 -v 挂载宿主机目录或命名卷。‌删除容器不等于删除数据卷‌。这是 Docker 的设计特性，防止误删数据。

### 2. 场景一：标准启动与数据持久化（推荐开发/生产使用）

> 如果希望数据在容器重启后保留，但想在需要时“重置”数据库，请遵循此流程。

- 步骤 A：启动容器（带数据卷）

```bash
# 1. 创建命名卷 (可选，Docker也会自动创建)
docker volume create pg_vector_data

# 2. 启动 pgvector 容器
docker run -d \
  --name pgvector_db \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=rag_db \
  -p 5432:5432 \
  -v pg_vector_data:/var/lib/postgresql/data \
  pgvector/pgvector:pg16
```

此时，所有数据都存储在名为 pg_vector_data 的卷中。

- 步骤 B：正常删除容器（数据保留）

```bash
# 停止并删除容器，但数据卷 pg_vector_data 依然存在于系统中
docker stop pgvector_db
docker rm pgvector_db
```

再次运行步骤 A 的命令，数据会原样恢复。

- 步骤 C：彻底重置数据（清除污染）
  如果你想从头开始，必须‌显式删除数据卷‌。

```bash
# 1. 确保容器已删除
docker rm -f pgvector_db

# 2. 删除关联的数据卷 (关键步骤！)
docker volume rm pg_vector_data

# 3. 重新启动容器 (此时是一个全新的空数据库)
docker run -d \
  --name pgvector_db \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=rag_db \
  -p 5432:5432 \
  -v pg_vector_data:/var/lib/postgresql/data \
  pgvector/pgvector:pg16

```

### 3. 场景二：临时测试（不保留任何数据）

> 如果你只是做一次性测试，不需要数据持久化，可以使用‌匿名卷‌或‌tmpfs‌，或者在删除时强制清理。

- 方法 A：使用 --rm 参数（最简单）
  加上 --rm 标志，容器停止后会自动删除容器本身及其关联的‌匿名‌卷。

```bash
docker run -d \
  --name pgvector_temp \
  --rm \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  pgvector/pgvector:pg16

```

注意：如果你显式指定了 -v my_vol:/path，--rm 不会删除 named volume my_vol，只会删除匿名卷。

- 方法 B：删除容器时连带删除匿名卷
  如果你之前启动时没有指定卷名（例如 -v /var/lib/postgresql/data 这种匿名绑定或自动生成的匿名卷），可以使用 -v 标志删除容器。

```bash
docker stop pgvector_temp
docker rm -v pgvector_temp  # -v 标志会删除与该容器关联的匿名卷

```

- 场景三：使用绑定挂载（Bind Mount）的情况
  如果你在 Windows/Mac/Linux 上直接映射宿主机文件夹（如 -v ./pgdata:/var/lib/postgresql/data），数据就存在你的当前目录 ./pgdata 下。
  - ‌清除方法：- 停止并删除容器：

        ```bash
        docker stop pgvector_db
        docker rm pgvector_db
        ```

        - ‌手动删除宿主机文件夹‌：
          - Windows‌: 删除项目目录下的 pgdata 文件夹。
          - Linux/Mac‌: rm -rf ./pgdata

    只要这个文件夹还在，下次挂载它，数据就会回来。

- 终极清理命令大全（慎用！）

  > 当你觉得 Docker 环境太乱，想要‌彻底清空‌所有未使用的资源（包括所有孤立的数据卷、镜像、容器）时，可以使用以下命令。
  > ⚠️ 警告：这将删除所有未被正在运行容器使用的数据卷，导致数据永久丢失！

  ```bash
  # 1. 停止所有运行中的容器
  docker stop $(docker ps -q)

  # 2. 删除所有容器
  docker rm $(docker ps -aq)

  # 3. 删除所有悬空镜像 (Untagged images)
  docker image prune -f

  # 4. 【关键】删除所有未被使用的数据卷 (这会清除你的数据库数据！)
  docker volume prune -f

  # 5. 或者使用一键系统清理 (包含上述大部分操作)
  # -a: 清理所有未使用镜像，不仅仅是悬空的
  # --volumes: 同时清理未使用的数据卷
  docker system prune -a --volumes -f
  ```

- 针对 pgvector 开发的最佳实践建议

  > 为了避免“数据污染”困扰，建议在开发 RAG 应用时采用以下策略：
  - ‌使用 Docker Compose‌：

    > 编写 docker-compose.yml，管理更清晰。

    ```yaml
    version: "3.8"
    services:
    db:
      image: pgvector/pgvector:pg16
      environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: rag_db
      ports:
        - "5432:5432"
      volumes:
        - pgdata:/var/lib/postgresql/data

    volumes:
    pgdata: # 定义命名卷
    ```

    - 重置数据‌：只需运行 docker compose down -v。
      - down: 停止并移除容器、网络。
      - -v: ‌同时移除定义在 volumes 字段下的命名卷‌。这是最优雅的重置方式。

  - 初始化脚本
    > 如果需要每次重置后自动创建扩展和表，可以将 SQL 文件挂载到 /docker-entrypoint-initdb.d/。
    ```yaml
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ```
    注意：init.sql 只有在数据目录为空（首次初始化）时才会执行。如果你不清除卷，这个脚本不会被再次执行。
  - 检查端口占用‌
    > 如果删除容器后无法启动新容器，检查端口是否被占用：
    - Windows: netstat -ano | findstr :5432
    - Linux/Mac: lsof -i :5432
