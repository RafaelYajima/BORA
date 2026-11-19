-- BORA 2.0 — correções de fluxo de criação e semântica do mural restrito

-- O criador precisa poder ler o grupo recém-inserido: o RETURNING do INSERT
-- acontece antes do trigger que o torna membro administrador.
drop policy if exists "membros leem seus grupos" on public.grupos;
create policy "criador ou membro lê o grupo" on public.grupos
  for select to authenticated using (
    criador_id = auth.uid() or public.is_grupo_membro(id)
  );

-- "Mural restrito" passa a significar: só administradores enviam,
-- mas todos os membros continuam lendo.
drop policy if exists "membros enviam mensagens" on public.mensagens;
create policy "envio de mensagens respeita mural restrito" on public.mensagens
  for insert to authenticated with check (
    usuario_id = auth.uid()
    and public.is_grupo_membro(grupo_id)
    and (
      not coalesce((select chat_restrito from public.grupos where id = grupo_id), false)
      or public.is_grupo_admin(grupo_id)
    )
  );
