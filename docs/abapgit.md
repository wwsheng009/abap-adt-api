# abapGit 集成

本文档介绍如何使用 abap-adt-api 管理系统中的 abapGit 集成。

## 概述

abapGit 集成功能包括：

- 列出 abapGit 仓库
- 创建新仓库
- 克隆外部仓库
- 拉取更改
- 提交和推送
- 管理仓库状态

## GitRepo

abapGit 仓库结构。

```typescript
interface GitRepo {
  key: string
  sapPackage: string
  url: string
  branch_name: string
  created_by: string
  created_at: Date
  created_email?: string
  deserialized_by?: string
  deserialized_email?: string
  deserialized_at?: Date
  status?: string
  status_text?: string
  links: GitLink[]
}

interface GitLink {
  href: string
  rel: string
  type?: "pull_link" | "stage_link" | "push_link" | "check_link" | "status_link" | "log_link" | string
}
```

## 列出仓库

### gitRepos

获取所有 abapGit 仓库。

```typescript
const repos = await client.gitRepos(): Promise<GitRepo[]>
```

**示例:**

```typescript
const repos = await client.gitRepos()

console.log(`找到 ${repos.length} 个 abapGit 仓库:`)

repos.forEach(repo => {
  console.log(`\n仓库: ${repo.key}`)
  console.log(`  SAP 包: ${repo.sapPackage}`)
  console.log(`  URL: ${repo.url}`)
  console.log(`  分支: ${repo.branch_name}`)
  console.log(`  创建者: ${repo.created_by}`)
  console.log(`  创建时间: ${repo.created_at.toISOString()}`)

  if (repo.status) {
    console.log(`  状态: ${repo.status} - ${repo.status_text}`)
  }

  console.log(`  可用操作: ${repo.links.map(l => l.rel).join(", ")}`)
})
```

## 外部仓库信息

### gitExternalRepoInfo

获取外部 Git 仓库信息。

```typescript
const externalInfo = await client.gitExternalRepoInfo(
  repourl: string,
  user: string = "",
  password: string = ""
): Promise<GitExternalInfo>
```

**GitExternalInfo 结构:**

```typescript
interface GitExternalInfo {
  access_mode: "PUBLIC" | "PRIVATE"
  branches: GitBranch[]
}

interface GitBranch {
  sha1: string
  name: string
  type: string
  is_head: boolean
  display_name: string
}
```

**示例:**

```typescript
const info = await client.gitExternalRepoInfo(
  "https://github.com/user/repo.git",
  "git-user",
  "git-pass"
)

console.log("外部仓库信息:")
console.log(`  访问模式: ${info.access_mode}`)
console.log(`  分支数: ${info.branches.length}`)

info.branches.forEach(branch => {
  const indicator = branch.is_head ? " (HEAD)" : ""
  console.log(`  ${branch.name}${indicator}`)
  console.log(`    SHA: ${branch.sha1}`)
  console.log(`    显示名: ${branch.display_name}`)
  console.log(`    类型: ${branch.type}`)
})
```

## 创建仓库

### gitCreateRepo

创建新的 abapGit 仓库。

```typescript
await client.gitCreateRepo(
  packageName: string,
  repourl: string,
  branch = "refs/heads/master",
  transport = "",
  user = "",
  password = ""
)
```

**示例:**

```typescript
await client.gitCreateRepo(
  "$TMP",                              // SAP 包
  "https://github.com/user/repo.git", // Git 仓库 URL
  "refs/heads/master",                // 分支
  "",                                 // 传输号（可选）
  "git-user",                         // Git 用户名（如果是私有仓库）
  "git-password"                      // Git 密码（如果是私有仓库）
)

console.log("abapGit 仓库创建成功")
```

## 拉取更改

### gitPullRepo

从远程仓库拉取更改。

```typescript
await client.gitPullRepo(
  repoId: string,
  branch = "refs/heads/master",
  transport = "",
  user = "",
  password = ""
)
```

**示例:**

```typescript
// 先获取仓库列表
const repos = await client.gitRepos()

if (repos.length > 0) {
  const repo = repos[0]

  console.log(`从 ${repo.url} 拉取更改...`)

  await client.gitPullRepo(
    repo.key,
    "refs/heads/master",
    "",     // 传输号
    "user", // Git 用户名（如需要）
    "pass"  // Git 密码（如需要）
  )

  console.log("拉取完成")
}
```

## 提交和推送

### stageRepo

暂存更改以便提交。

```typescript
const staging = await client.stageRepo(
  repo: GitRepo,
  user = "",
  password = ""
): Promise<GitStaging>
```

**GitStaging 结构:**

```typescript
interface GitStaging {
  staged: GitStagingObject[]
  unstaged: GitStagingObject[]
  ignored: GitStagingObject[]
  comment: string
  author: GitUser
  committer: GitUser
}

interface GitStagingObject {
  wbkey: string
  uri: string
  type: string
  name: string
  abapGitFiles: GitStagingFile[]
}

interface GitStagingFile {
  name: string
  path: string
  localState: string
  links: GitLink[]
}

interface GitUser {
  name: string
  email: string
}
```

**示例:**

```typescript
const repos = await client.gitRepos()
const repo = repos[0]

console.log(`获取暂存信息: ${repo.key}`)

const staging = await client.stageRepo(
  repo,
  "",     // Git 用户
  ""      // Git 密码
)

console.log(`\n暂存的文件: ${staging.staged.length}`)
staging.staged.forEach(obj => {
  console.log(`  ${obj.name} (${obj.type})`)
  obj.abapGitFiles.forEach(file => {
    console.log(`    - ${file.name}: ${file.localState}`)
  })
})

console.log(`\n未暂存的文件: ${staging.unstaged.length}`)
staging.unstaged.forEach(obj => {
  console.log(`  ${obj.name} (${obj.type})`)
})

console.log(`\n忽略的文件: ${staging.ignored.length}`)
```

### pushRepo

推送暂存的更改。

```typescript
await client.pushRepo(
  repo: GitRepo,
  staging: GitStaging,
  user = "",
  password = ""
)
```

**示例:**

```typescript
async function commitAndPush(
  client: ADTClient,
  repoKey: string,
  commitMessage: string
) {
  // 1. 获取仓库
  const repos = await client.gitRepos()
  const repo = repos.find(r => r.key === repoKey)

  if (!repo) {
    throw new Error("仓库未找到")
  }

  // 2. 暂存更改
  console.log("暂存更改...")
  const staging = await client.stageRepo(repo, "username", "password")

  // 3. 设置提交消息
  staging.comment = commitMessage

  // 4. 推送
  console.log("推送到远程仓库...")
  await client.pushRepo(repo, staging, "username", "password")

  console.log("推送成功!")
}

// 使用
await commitAndPush(client, "repo-key-123", "更新了 ABAP 对象")
```

## 切换分支

### switchRepoBranch

切换仓库分支或创建新分支。

```typescript
await client.switchRepoBranch(
  repo: GitRepo,
  branch: string,
  create = false,
  user = "",
  password = ""
)
```

**示例:**

```typescript
const repos = await client.gitRepos()
const repo = repos[0]

// 切换到现有分支
console.log(`切换到分支: feature-branch`)
await client.switchRepoBranch(
  repo,
  "refs/heads/feature-branch",
  false,  // 不创建新分支
  "",     // Git 用户
  ""      // Git 密码
)

// 创建并切换到新分支
console.log(`创建并切换到新分支: feature-new`)
await client.switchRepoBranch(
  repo,
  "refs/heads/feature-new",
  true,   // 创建新分支
  "",
  ""
)
```

## 检查仓库状态

### checkRepo

检查仓库状态。

```typescript
const status = await client.checkRepo(
  repo: GitRepo,
  user = "",
  password = ""
)
```

**示例:**

```typescript
const repos = await client.gitRepos()
const repo = repos[0]

console.log("检查仓库状态...")
const status = await client.checkRepo(repo)

console.log("仓库状态:")
console.log(JSON.stringify(status, null, 2))
```

## 删除仓库

### gitUnlinkRepo

删除与远程仓库的链接（不删除本地包）。

```typescript
await client.gitUnlinkRepo(repoId: string)
```

**示例:**

```typescript
// 删除仓库链接
await client.gitUnlinkRepo("repo-key-123")

console.log("仓库链接已删除")
```

## 完整示例：完整的 Git 工作流

```typescript
import { ADTClient } from "abap-adt-api"

async function gitWorkflow(
  client: ADTClient,
  packageUrl: string,
  gitUrl: string
) {
  console.log("=== abapGit 工作流 ===\n")

  // 1. 列出现有仓库
  console.log("1. 列出现有仓库...")
  const existingRepos = await client.gitRepos()

  if (existingRepos.length > 0) {
    console.log(`  找到 ${existingRepos.length} 个现有仓库`)

    existingRepos.forEach(repo => {
      console.log(`    - ${repo.sapPackage}: ${repo.url}`)
    })
  } else {
    console.log("  没有现有仓库")
  }

  // 2. 获取外部仓库信息
  console.log("\n2. 获取外部仓库信息...")
  const externalInfo = await client.gitExternalRepoInfo(gitUrl, "", "")

  console.log(`  访问模式: ${externalInfo.access_mode}`)
  console.log(`  可用分支: ${externalInfo.branches.map(b => b.name).join(", ")}`)

  // 3. 检查是否已存在相同仓库
  const existingRepo = existingRepos.find(
    r => r.url === gitUrl
  )

  let repoKey: string

  if (existingRepo) {
    console.log(`\n3. 仓库已存在，使用现有仓库: ${existingRepo.key}`)
    repoKey = existingRepo.key
  } else {
    // 4. 创建新仓库
    console.log("\n4. 创建新仓库...")

    const packageName = packageUrl.split("/").pop() || "$TMP"

    await client.gitCreateRepo(
      packageName,
      gitUrl,
      "refs/heads/master",
      "",
      "",  // 用户
      ""   // 密码
    )

    console.log("  仓库创建成功")

    // 重新获取仓库列表以获取 key
    const updatedRepos = await client.gitRepos()
    const newRepo = updatedRepos.find(r => r.url === gitUrl)!

    repoKey = newRepo.key
  }

  // 5. 获取仓库对象
  const repos = await client.gitRepos()
  const repo = repos.find(r => r.key === repoKey)!

  console.log(`\n5. 当前仓库: ${repo.key}`)
  console.log(`  SAP 包: ${repo.sapPackage}`)
  console.log(`  分支: ${repo.branch_name}`)

  // 6. 拉取更改
  console.log("\n6. 拉取远程更改...")
  await client.gitPullRepo(repo.key, "refs/heads/master")
  console.log("  拉取完成")

  // 7. 暂存本地更改
  console.log("\n7. 检查本地更改...")
  const staging = await client.stageRepo(repo)

  console.log(`  暂存: ${staging.staged.length} 个对象`)
  console.log(`  未暂存: ${staging.unstaged.length} 个对象`)

  if (staging.staged.length > 0) {
    console.log("\n8. 有本地更改，准备提交...")

    // 显示暂存的文件
    console.log("  暂存的文件:")
    staging.staged.forEach(obj => {
      console.log(`    ${obj.name}:`)
      obj.abapGitFiles.forEach(file => {
        console.log(`      - ${file.name}`)
      })
    })

    // 9. 提交并推送
    console.log("\n9. 推送更改到远程...")
    staging.comment = `abapGit API 更新 ${new Date().toISOString()}`

    await client.pushRepo(repo, staging)
    console.log("  推送成功")
  } else {
    console.log("\n8. 没有本地更改，无需推送")
  }

  // 10. 检查状态
  console.log("\n10. 检查仓库状态...")
  const status = await client.checkRepo(repo)
  console.log("  状态检查完成")

  return {
    repoKey: repo.key,
    package: repo.sapPackage,
    hasChanges: staging.staged.length > 0
  }
}

// 使用
const client = new ADTClient(
  "http://vhcalnplci.local:8000",
  "developer",
  "password"
)

await client.login()

const result = await gitWorkflow(
  client,
  "/sap/bc/adt/packages/$tmp",
  "https://github.com/user/abap-repo.git"
)

console.log("\n=== 工作流完成 ===")
console.log(JSON.stringify(result, null, 2))
```

## 批量操作

```typescript
async function batchPullRepos(
  client: ADTClient,
  repoKeys: string[]
) {
  const results: {
    key: string
    success: boolean
    message: string
  }[] = []

  for (const key of repoKeys) {
    console.log(`拉取仓库: ${key}`)

    try {
      await client.gitPullRepo(key)
      results.push({
        key,
        success: true,
        message: "拉取成功"
      })
    } catch (error) {
      results.push({
        key,
        success: false,
        message: error.message
      })
    }
  }

  // 汇总
  const successCount = results.filter(r => r.success).length
  console.log(`\n完成: ${successCount}/${results.length} 成功`)

  return results
}

// 使用
const repos = await client.gitRepos()
const repoKeys = repos.map(r => r.key)

await batchPullRepos(client, repoKeys)
```

## 分支管理

```typescript
async function manageBranches(
  client: ADTClient,
  repoKey: string
) {
  const repos = await client.gitRepos()
  const repo = repos.find(r => r.key === repoKey)!

  // 获取外部仓库信息以了解可用分支
  const externalInfo = await client.gitExternalRepoInfo(repo.url, "", "")

  console.log("可用分支:")
  externalInfo.branches.forEach(branch => {
    const current = branch.is_head ? " [当前]" : ""
    console.log(`  - ${branch.display_name}${current}`)
  })

  // 切换到主分支
  console.log("\n切换到主分支...")
  await client.switchRepoBranch(
    repo,
    "refs/heads/master",
    false
  )

  // 拉取切换后的分支
  await client.gitPullRepo(repo.key)

  console.log("分支切换和拉取完成")
}

// 使用
await manageBranches(client, "repo-key-123")
```
