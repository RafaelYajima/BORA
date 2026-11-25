-- BORA 2.0 — impede que novos eventos sejam agendados no passado.

create or replace function public.validar_data_evento()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.data_evento < current_date
    or (new.data_evento = current_date and new.hora_evento <= localtime) then
    raise exception 'Escolha uma data e um horário futuros para o evento.';
  end if;
  return new;
end;
$$;

drop trigger if exists evento_data_futura on public.eventos;
create trigger evento_data_futura
  before insert or update of data_evento, hora_evento on public.eventos
  for each row execute function public.validar_data_evento();
