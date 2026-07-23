create or replace function public.recover_cabinet_ai_history()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  linked_user_ids uuid[] := array[
    'e06383fe-7c9f-4a51-b4b3-7d44a877c86d'::uuid,
    'e635eaef-bb3a-4be2-b640-e7ce30cd7f1b'::uuid
  ];
  conversations_before integer := 0;
  conversations_moved integer := 0;
  messages_moved integer := 0;
  folders_moved integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not current_user_id = any(linked_user_ids) then
    raise exception 'Not allowed';
  end if;

  if not public.has_role(current_user_id, 'admin') then
    raise exception 'Not allowed';
  end if;

  select count(*) into conversations_before
  from public.ai_conversations
  where user_id = current_user_id;

  if conversations_before > 0 then
    return jsonb_build_object(
      'recovered', false,
      'reason', 'history_already_present',
      'conversations', conversations_before,
      'messages_moved', 0,
      'folders_moved', 0
    );
  end if;

  update public.ai_conversation_folders
  set user_id = current_user_id
  where user_id = any(linked_user_ids)
    and user_id <> current_user_id;
  get diagnostics folders_moved = row_count;

  update public.ai_conversations
  set user_id = current_user_id
  where user_id = any(linked_user_ids)
    and user_id <> current_user_id;
  get diagnostics conversations_moved = row_count;

  update public.ai_messages
  set user_id = current_user_id
  where user_id = any(linked_user_ids)
    and user_id <> current_user_id;
  get diagnostics messages_moved = row_count;

  return jsonb_build_object(
    'recovered', conversations_moved > 0 or messages_moved > 0 or folders_moved > 0,
    'conversations_moved', conversations_moved,
    'messages_moved', messages_moved,
    'folders_moved', folders_moved
  );
end;
$$;

grant execute on function public.recover_cabinet_ai_history() to authenticated;
revoke execute on function public.recover_cabinet_ai_history() from anon;