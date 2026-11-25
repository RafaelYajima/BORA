-- BORA 2.0 — refinamentos: prazo de enquetes e autoria dos itens de evento

alter table public.enquetes
  add column if not exists encerra_em timestamptz;

alter table public.evento_itens
  add column if not exists sugerido_por uuid references public.profiles (id) on delete set null;

create index if not exists enquetes_encerra_em_idx
  on public.enquetes (encerra_em)
  where encerra_em is not null and not encerrada;

-- Quem sugeriu um item livre também pode retirá-lo antes que outra pessoa assuma.
drop policy if exists "membro sugere item" on public.evento_itens;
create policy "membro sugere item" on public.evento_itens
  for insert to authenticated with check (
    (usuario_id is null or usuario_id = auth.uid())
    and (sugerido_por is null or sugerido_por = auth.uid())
    and public.is_evento_grupo_membro(evento_id)
  );

drop policy if exists "responsável ou admin remove item" on public.evento_itens;
create policy "sugeridor, responsável ou admin remove item" on public.evento_itens
  for delete to authenticated using (
    usuario_id = auth.uid()
    or sugerido_por = auth.uid()
    or public.is_evento_grupo_admin(evento_id)
  );

-- Fechamento automático das enquetes cujo prazo passou.
create or replace function public.encerrar_enquetes_expiradas()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_total integer;
begin
  update public.enquetes
  set encerrada = true
  where not encerrada
    and encerra_em is not null
    and encerra_em <= now();
  get diagnostics v_total = row_count;
  return v_total;
end;
$$;
