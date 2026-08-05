# 报错记录

## 一、项目环境运行报错

### 1. 启动 PostgreSQL + pgvector

#### docker 创建并启动容器

- 服务启动时报错
  - 前提：先把本地之前安装的PostgreSQL服务临时关掉，避免5432端口冲突，然后执行这条Docker指令，启动完成后，你项目里的数据库连接配置直接填
    - net stop postgresql-x64-16
- 清除已创建的容器
  - 污染新创建的docker容器
    - docker rm -f 容器名称
    - 删除vector扩展本身
      - 进入pgvector容器的psql交互界面
        - docker exec -it pgvector-jisu psql -U postgres -d jisu_ai
      - 基础删除命令，适合没有任何依赖对象的场景
        - DROP EXTENSION IF EXISTS vector;
      - 如果项目里已经创建了带vector类型的字段，直接执行上面的命令会报错，此时需要加上CASCADE参数，自动删除所有依赖vector扩展的表、字段和索引
        - DROP EXTENSION IF EXISTS vector CASCADE;
    - 删除pgvector存储的向量数据
      - 删除单条指定向量记录
        - DELETE FROM 你的向量表名 WHERE id = 要删除的记录ID;
      - 清空整张向量表的所有数据
        - TRUNCATE 你的向量表名;
      - 只删除某条记录里向量字段的指定值，保留其他字段内容
        - UPDATE 你的向量表名 SET 向量字段名 = array_remove(向量字段名, '要移除的向量值') WHERE 筛选条件;
    - 完全删除整个pgvector容器和数据卷
      - 如果想要彻底重置整个环境，从零开始部署，可以执行以下命令
        - 停止并删除运行中的容器
          - docker stop pgvector-jisu && docker rm pgvector-jisu
        - 删除持久化数据卷，清空所有数据库数据
          - docker volume rm pgvector-jisu-data
- 创建本地数据库
  - 切换到postgres系统用户，登录数据库
    - psql -U postgres
  - 创建项目指定的jisu_ai数据库
    - CREATE DATABASE jisu_ai;
  - 进入新建的数据库，启用pgvector向量扩展
    - \c jisu_ai
    - CREATE EXTENSION IF NOT EXISTS vector;

## 二、项目环境准备问题

### 1. Docker 安装问题

- Docker Desktop 准备工作
  - Docker官方安装包：https://github.com/tech-shrimp/docker_installer
  - docker pull nginx
