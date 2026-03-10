# Enterprise DuckDB Deployment Guide

## Overview
Kuantra uses DuckDB as an embedded high-performance analytical engine. This guide covers deployment considerations for maximum performance and stability.

## Infrastructure Requirements

### 1. Memory Configuration
DuckDB operates in-process. Memory management is critical.

- **Environment Variable**: `DUCKDB_MEMORY_LIMIT`
- **Recommended**: Set to `60%` or `70%` of container/VM RAM.
  - Example: `DUCKDB_MEMORY_LIMIT=4GB` (Fixed)
  - Example: `DUCKDB_MEMORY_LIMIT=60%` (Relative)
- **Rationale**: Leave RAM for OS, Python process, and web server overhead.

### 2. Storage
- **Main Database**: `data/warehouse.duckdb`
  - Needs fast I/O (NVMe preferred).
  - Persistence required (Persistent Volume in K8s).
- **Temp Directory**: `DUCKDB_TEMP_DIR` (default: `data/duckdb_temp`)
  - Used for spilling to disk when memory is full.
  - MUST have sufficient space (2x dataset size recommended).
  - Use ephemeral high-speed storage (e.g., AWS Instance Store, Kubernetes `emptyDir`).

### 3. CPU
- **Threads**: `DUCKDB_THREADS` (default: 4)
- Set to `CPU_CORES - 1` to prevent starvation of the web server loop.

## Cloud Deployment Specifics

### AWS ECS / Fargate
- Use `EFS` for the main database if persistence across task restarts is required, but note simple EFS can be slow for OLAP.
- **Better**: Use an EBS volume attached to EC2 instance (not Fargate) or use S3 + local cache if read-only.
- **For Kuantra (Read/Write)**: dedicated EC2 or stateful set on EKS with EBS GP3.

### Kubernetes (Helm/Kustomize)
```yaml
env:
  - name: DUCKDB_MEMORY_LIMIT
    value: "60%"
  - name: DUCKDB_THREADS
    value: "4"
volumeMounts:
  - name: data-volume
    mountPath: /app/data
  - name: temp-volume
    mountPath: /app/data/duckdb_temp
volumes:
  - name: data-volume
    persistentVolumeClaim:
      claimName: kuantra-pvc
  - name: temp-volume
    emptyDir: {}
```

## Health Checks
Configure your load balancer or orchestrator to monitor:
- Liveness: `/health`
- Readiness: `/health/duckdb` (ensures DB is accessible)
