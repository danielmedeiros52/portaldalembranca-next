# Database Migrations - PostgreSQL

Este diretório contém o schema e migrations do banco de dados PostgreSQL usando Drizzle ORM.

## Estrutura

- `schema.ts` - Definição das tabelas e tipos do banco de dados
- `migrations/` - Arquivos de migration gerados automaticamente
- `relations.ts` - Relações entre tabelas (se necessário)

## Comandos Disponíveis

### Gerar nova migration
```bash
npm run db:generate
```

### Aplicar migrations
```bash
npm run db:migrate
```

### Push schema direto (desenvolvimento)
```bash
npm run db:push
```

### Abrir Drizzle Studio
```bash
npm run db:studio
```

## Configuração para Vercel

### Vercel Postgres

1. Crie um banco de dados PostgreSQL no dashboard da Vercel
2. Copie a connection string
3. Adicione como variável de ambiente:
   ```
   DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require
   ```

### Neon Database (Alternativa)

1. Crie uma conta em [Neon](https://neon.tech)
2. Crie um novo projeto
3. Copie a connection string
4. Adicione como variável de ambiente:
   ```
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

## Aplicar Migrations em Produção

As migrations devem ser aplicadas automaticamente durante o deploy na Vercel através do build command ou usando Vercel CLI:

```bash
vercel env pull .env.local
npm run db:migrate
```

## Schema Overview

### Tabelas Principais

- **users** - Usuários autenticados via OAuth
- **funeral_homes** - Funerárias parceiras
- **family_users** - Membros da família gerenciando memoriais
- **memorials** - Memoriais dos falecidos
- **descendants** - Descendentes (filhos, netos, etc)
- **photos** - Galeria de fotos dos memoriais
- **dedications** - Mensagens e homenagens

## Migrando de MySQL para PostgreSQL

Este projeto foi migrado de MySQL para PostgreSQL. Principais mudanças:

1. **Auto-increment**: `int().autoincrement()` → `serial()`
2. **Enums**: `mysqlEnum()` → `pgEnum()`
3. **Upsert**: `onDuplicateKeyUpdate()` → `onConflictDoUpdate()`
4. **Driver**: `mysql2` → `postgres`
5. **Connection**: Pool connection com SSL para produção
