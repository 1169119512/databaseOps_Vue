import fs from 'fs'
import path from 'path'

/**
 * Vite插件：配置文件管理
 * 提供API接口读写 connections.json 文件
 */
export default function configManagerPlugin() {
  const configFile = path.resolve(process.cwd(), 'connections.json')

  return {
    name: 'config-manager',
    
    configureServer(server) {
      // 添加自定义API路由
      server.middlewares.use('/config-api', (req, res, next) => {
        // 设置CORS
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        
        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }

        // 注意：使用 use('/config-api') 时，req.url 已经去掉了 /config-api 前缀
        const url = new URL(req.url, `http://${req.headers.host}`)
        
        // GET /connections - 读取所有连接
        if (req.method === 'GET' && url.pathname === '/connections') {
          try {
            const data = fs.readFileSync(configFile, 'utf-8')
            const config = JSON.parse(data)
            
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({
              code: 200,
              message: 'success',
              data: config.connections
            }))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({
              code: 500,
              message: error.message
            }))
          }
          return
        }

        // POST /connections - 添加连接
        if (req.method === 'POST' && url.pathname === '/connections') {
          let body = ''
          
          req.on('data', chunk => {
            body += chunk.toString()
          })
          
          req.on('end', () => {
            try {
              const newConnection = JSON.parse(body)
              const data = fs.readFileSync(configFile, 'utf-8')
              const config = JSON.parse(data)
              
              config.connections.push(newConnection)
              
              fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
              
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 201
              res.end(JSON.stringify({
                code: 201,
                message: '添加成功',
                data: newConnection
              }))
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({
                code: 500,
                message: error.message
              }))
            }
          })
          return
        }

        // PUT /connections/:id - 更新连接
        if (req.method === 'PUT' && url.pathname.startsWith('/connections/')) {
          const id = url.pathname.split('/').pop()
          let body = ''
          
          req.on('data', chunk => {
            body += chunk.toString()
          })
          
          req.on('end', () => {
            try {
              const updates = JSON.parse(body)
              const data = fs.readFileSync(configFile, 'utf-8')
              const config = JSON.parse(data)
              
              const index = config.connections.findIndex(c => c.id === id)
              if (index !== -1) {
                config.connections[index] = {
                  ...config.connections[index],
                  ...updates
                }
                
                fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
                
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({
                  code: 200,
                  message: '更新成功',
                  data: config.connections[index]
                }))
              } else {
                res.statusCode = 404
                res.end(JSON.stringify({
                  code: 404,
                  message: '连接不存在'
                }))
              }
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({
                code: 500,
                message: error.message
              }))
            }
          })
          return
        }

        // DELETE /connections/:id - 删除连接
        if (req.method === 'DELETE' && url.pathname.startsWith('/connections/')) {
          const id = url.pathname.split('/').pop()
          
          try {
            const data = fs.readFileSync(configFile, 'utf-8')
            const config = JSON.parse(data)
            
            const index = config.connections.findIndex(c => c.id === id)
            if (index !== -1) {
              config.connections.splice(index, 1)
              
              fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
              
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(JSON.stringify({
                code: 200,
                message: '删除成功'
              }))
            } else {
              res.statusCode = 404
              res.end(JSON.stringify({
                code: 404,
                message: '连接不存在'
              }))
            }
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({
              code: 500,
              message: error.message
            }))
          }
          return
        }

        // POST /connections/batch - 批量导入
        if (req.method === 'POST' && url.pathname === '/connections/batch') {
          let body = ''
          
          req.on('data', chunk => {
            body += chunk.toString()
          })
          
          req.on('end', () => {
            try {
              const newConnections = JSON.parse(body)
              const data = fs.readFileSync(configFile, 'utf-8')
              const config = JSON.parse(data)
              
              config.connections.push(...newConnections)
              
              fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
              
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(JSON.stringify({
                code: 200,
                message: '批量导入成功',
                data: { count: newConnections.length }
              }))
            } catch (error) {
              console.error('[Config API] 批量导入错误:', error)
              res.statusCode = 500
              res.end(JSON.stringify({
                code: 500,
                message: error.message
              }))
            }
          })
          return
        }

        // DELETE /connections - 清空所有连接
        if (req.method === 'DELETE' && url.pathname === '/connections') {
          try {
            const config = { connections: [] }
            fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
            
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({
              code: 200,
              message: '已清空所有连接'
            }))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({
              code: 500,
              message: error.message
            }))
          }
          return
        }

        next()
      })
    }
  }
}

