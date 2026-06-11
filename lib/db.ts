// Este arquivo só deve ser usado no servidor!
const mysql = require("mysql2/promise")

const DB_HOST = process.env.DB_HOST || "localhost"
const DB_USER = process.env.DB_USER || "root"
const DB_PASSWORD = process.env.DB_PASSWORD || ""
const DB_NAME = process.env.DB_NAME || "sistema_chamados"
const DB_PORT = parseInt(process.env.DB_PORT || "3306")

let pool: any = null

export function getConnectionPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getConnectionPool()
  const [rows] = await pool.execute(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await query<T>(sql, params)
  return results.length > 0 ? results[0] : null
}

export async function insert(table: string, data: Record<string, any>): Promise<string> {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map(() => "?").join(", ")

  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`
  const pool = getConnectionPool()
  const [result] = await pool.execute(sql, values) as any

  // Se tiver id no data, retorna ele, senão retorna o insertId
  if (data.id) return data.id
  return result.insertId
}

export async function update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<void> {
  const setClauses = Object.keys(data).map(key => `${key} = ?`).join(", ")
  const whereClauses = Object.keys(where).map(key => `${key} = ?`).join(" AND ")
  const values = [...Object.values(data), ...Object.values(where)]

  const sql = `UPDATE ${table} SET ${setClauses} WHERE ${whereClauses}`
  const pool = getConnectionPool()
  await pool.execute(sql, values)
}

export async function deleteRow(table: string, where: Record<string, any>): Promise<void> {
  const whereClauses = Object.keys(where).map(key => `${key} = ?`).join(" AND ")
  const values = Object.values(where)

  const sql = `DELETE FROM ${table} WHERE ${whereClauses}`
  const pool = getConnectionPool()
  await pool.execute(sql, values)
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
