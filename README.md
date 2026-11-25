# BORA 2.0

Versão nova do sistema de grupos e eventos, migrada do PHP + MySQL para **Next.js 16 + TypeScript + Supabase**.

## O que mudou em relação ao PHP

| Antes (PHP) | Agora (BORA 2.0) |
| --- | --- |
| Tabelas MySQL (`usuarios`, `grupos`, `eventos`...) | Postgres no Supabase com `profiles`, `grupos`, `grupo_membros`, `eventos`, `presencas`, `mensagens` |
| Senhas bcrypt e tokens de recuperação próprios | Supabase Auth (recuperação de senha nativa) |
| Fotos em `uploads/` | Supabase Storage (bucket público `avatars`) |
| Chat via polling AJAX | Realtime do Supabase |
| Sessão PHP | Sessão JWT do Supabase no navegador |
| SQL sem permissões | Row Level Security (RLS) em todas as tabelas |
| CSS próprio | Tailwind CSS + tema claro/escuro |

## Funcionalidades

- Cadastro/login e recuperação de senha.
- Criação de grupos com código de convite; entrada por código; administradores podem promover/remover/banir membros, gerar novo código, editar e excluir o grupo.
- Eventos com data, hora, endereço e ponto no mapa (Leaflet/OpenStreetMap); criação, edição e exclusão.
- Confirmação de presença (vou / não vou) com contagem.
- Cronograma com próximos eventos e histórico.
- Gamificação leve: pontos por criar evento, confirmar presença (bônus de antecedência) e participar do mural, com selos e ranking dentro de cada grupo.
- Mural de mensagens em tempo real, com opção de restringir o envio a administradores (a leitura permanece aberta a todos os membros).
- Perfil com nome, tag, foto e resumo de participação.
- Convite para grupos por link/código, com compartilhamento nativo, WhatsApp e cópia rápida; o link já preenche o código na tela de entrada.
- Eventos exportáveis para calendário (.ics) com lembretes 1 dia e 1 hora antes, além de compartilhamento do convite com local e data.
- Interface responsiva (navbar no desktop, bottom nav no mobile) e modo escuro persistente.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Supabase: Auth, Postgres (RLS), Storage e Realtime
- Leaflet para mapas, Nominatim/OpenStreetMap para autocomplete e geocodificação reversa, e ViaCEP para buscar endereços brasileiros pelo CEP (sem chave de API)
- lucide-react para ícones

> **Nota de arquitetura:** as consultas ao Supabase acontecem no navegador (`@supabase/ssr` + `createBrowserClient`). Assim o app funciona em qualquer host sem precisar de um backend intermediary, e as regras de acesso ficam no RLS do banco. Para adicionar pagamentos depois (Stripe/Asaas), crie route handlers em `src/app/api/` com a chave secreta apenas no servidor; os webhooks podem usar o cliente de serviço do Supabase para dar acesso ao comprador.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com URL e chave publishable do seu projeto
npm run dev
```

Abra http://localhost:3000.

Scripts: `npm run build`, `npm run lint`, `npx tsc --noEmit`.

## Banco de dados

As migrações estão em `supabase/migrations/`:
- `0001_init.sql` — tabelas, triggers, RLS inicial, Storage e realtime;
- `0002_security.sql` — perfis visíveis só para o próprio usuário e companheiros de grupo, grupos visíveis só para membros e RPC `buscar_grupo_por_codigo` para entrar sem expor a tabela;
- `0003_grupos_mensagens.sql` — corrige a leitura do grupo recém-criado pelo criador e faz o “mural restrito” limitar envio a administradores (todos os membros continuam lendo).

Para aplicar em outro projeto Supabase, rode os arquivos em ordem no SQL Editor (ou via `supabase db push`).

O projeto atual foi criado com:
- cadastro sem confirmação de e-mail (`mailer_autoconfirm = true`);
- bucket `avatars` público;
- tabela `mensagens` publicada no realtime;
- redirect URLs permitidas para localhost e para o host do preview.

Para produção, configure um SMTP próprio no Supabase (Authentication → SMTP), desative `autoconfirm` e ajuste Site URL/Redirect URLs para o domínio final.

## Estrutura

```
src/app/(auth)/       login, cadastro, recuperação e nova senha
src/app/(app)/        dashboard, grupos, cronograma, perfil
src/app/auth/callback troca de código/token do Supabase no navegador
src/components/       shell, cards, formulários, chat, mapa, lista de eventos
src/lib/supabase/     cliente browser do Supabase
supabase/migrations/  schema + RLS + Storage
```

O projeto PHP original continua no repositório `RafaelYajima/BORA`, intacto.
