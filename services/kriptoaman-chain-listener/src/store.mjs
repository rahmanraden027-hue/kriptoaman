import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export class IntelligenceStore {
  constructor(path) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS blocks (
        block_number INTEGER PRIMARY KEY,
        block_hash TEXT NOT NULL,
        parent_hash TEXT NOT NULL,
        block_timestamp INTEGER NOT NULL,
        received_at TEXT NOT NULL,
        indexed_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'included'
      );
      CREATE TABLE IF NOT EXISTS contracts (
        address TEXT PRIMARY KEY,
        creator TEXT,
        tx_hash TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        code_hash TEXT,
        detected_at TEXT NOT NULL,
        source TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tokens (
        address TEXT PRIMARY KEY,
        name TEXT,
        symbol TEXT,
        decimals INTEGER,
        total_supply TEXT,
        creator TEXT,
        tx_hash TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        detected_at TEXT NOT NULL,
        indexed_at TEXT NOT NULL,
        source TEXT NOT NULL,
        passport_status TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pools (
        address TEXT PRIMARY KEY,
        factory TEXT NOT NULL,
        token0 TEXT NOT NULL,
        token1 TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        detected_at TEXT NOT NULL,
        indexed_at TEXT NOT NULL,
        source TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        block_number INTEGER,
        tx_hash TEXT,
        subject TEXT,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS events_block_idx ON events(block_number DESC);
      CREATE INDEX IF NOT EXISTS events_kind_idx ON events(kind, id DESC);
    `);
  }

  lastBlock() {
    return this.db.prepare('SELECT * FROM blocks ORDER BY block_number DESC LIMIT 1').get() || null;
  }

  block(number) {
    return this.db.prepare('SELECT * FROM blocks WHERE block_number=?').get(number) || null;
  }

  upsertBlock(block) {
    this.db.prepare(`
      INSERT INTO blocks(block_number,block_hash,parent_hash,block_timestamp,received_at,indexed_at,status)
      VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(block_number) DO UPDATE SET
        block_hash=excluded.block_hash,parent_hash=excluded.parent_hash,
        block_timestamp=excluded.block_timestamp,received_at=excluded.received_at,
        indexed_at=excluded.indexed_at,status=excluded.status
    `).run(block.blockNumber, block.hash, block.parentHash, block.timestamp, block.receivedAt, block.indexedAt, block.status || 'included');
  }

  finalizeThrough(number) {
    if (number < 0) return;
    this.db.prepare("UPDATE blocks SET status='final' WHERE block_number<=? AND status!='final'").run(number);
  }

  rewindFrom(number) {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM events WHERE block_number>=?').run(number);
      this.db.prepare('DELETE FROM pools WHERE block_number>=?').run(number);
      this.db.prepare('DELETE FROM tokens WHERE block_number>=?').run(number);
      this.db.prepare('DELETE FROM contracts WHERE block_number>=?').run(number);
      this.db.prepare('DELETE FROM blocks WHERE block_number>=?').run(number);
    });
    tx();
  }

  recordContract(row) {
    this.db.prepare(`
      INSERT OR REPLACE INTO contracts(address,creator,tx_hash,block_number,code_hash,detected_at,source)
      VALUES(?,?,?,?,?,?,?)
    `).run(row.address, row.creator, row.txHash, row.blockNumber, row.codeHash || null, row.detectedAt, row.source);
  }

  recordToken(row) {
    this.db.prepare(`
      INSERT OR REPLACE INTO tokens(address,name,symbol,decimals,total_supply,creator,tx_hash,block_number,detected_at,indexed_at,source,passport_status)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(row.address, row.name, row.symbol, row.decimals, row.totalSupply, row.creator, row.txHash, row.blockNumber, row.detectedAt, row.indexedAt, row.source, row.passportStatus);
  }

  recordPool(row) {
    this.db.prepare(`
      INSERT OR REPLACE INTO pools(address,factory,token0,token1,tx_hash,block_number,detected_at,indexed_at,source)
      VALUES(?,?,?,?,?,?,?,?,?)
    `).run(row.address, row.factory, row.token0, row.token1, row.txHash, row.blockNumber, row.detectedAt, row.indexedAt, row.source);
  }

  recordEvent(kind, { blockNumber = null, txHash = null, subject = null, payload = {} } = {}) {
    const createdAt = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT INTO events(kind,block_number,tx_hash,subject,payload,created_at)
      VALUES(?,?,?,?,?,?)
    `).run(kind, blockNumber, txHash, subject, JSON.stringify(payload), createdAt);
    return { id: Number(result.lastInsertRowid), kind, blockNumber, txHash, subject, payload, createdAt };
  }

  listTokens(limit = 100) {
    return this.db.prepare('SELECT * FROM tokens ORDER BY block_number DESC LIMIT ?').all(limit);
  }

  token(address) {
    return this.db.prepare('SELECT * FROM tokens WHERE address=?').get(String(address).toLowerCase()) || null;
  }

  listPools(limit = 100) {
    return this.db.prepare('SELECT * FROM pools ORDER BY block_number DESC LIMIT ?').all(limit);
  }

  listEvents(limit = 200) {
    return this.db.prepare('SELECT * FROM events ORDER BY id DESC LIMIT ?').all(limit)
      .map((row) => ({ ...row, payload: JSON.parse(row.payload) }));
  }

  counts() {
    const one = (table) => Number(this.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n);
    return { blocks: one('blocks'), contracts: one('contracts'), tokens: one('tokens'), pools: one('pools'), events: one('events') };
  }
}
