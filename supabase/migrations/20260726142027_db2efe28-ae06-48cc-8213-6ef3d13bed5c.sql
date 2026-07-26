create or replace function public.can_access_linked_cabinet_ai_owner(_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = any(array[
      'e06383fe-7c9f-4a51-b4b3-7d44a877c86d'::uuid,
      'e635eaef-bb3a-4be2-b640-e7ce30cd7f1b'::uuid
    ])
    and _owner_id = any(array[
      'e06383fe-7c9f-4a51-b4b3-7d44a877c86d'::uuid,
      'e635eaef-bb3a-4be2-b640-e7ce30cd7f1b'::uuid
    ])
    and public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

create or replace function public.can_access_linked_cabinet_ai_storage_owner(_owner_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = any(array[
      'e06383fe-7c9f-4a51-b4b3-7d44a877c86d'::uuid,
      'e635eaef-bb3a-4be2-b640-e7ce30cd7f1b'::uuid
    ])
    and _owner_id = any(array[
      'e06383fe-7c9f-4a51-b4b3-7d44a877c86d',
      'e635eaef-bb3a-4be2-b640-e7ce30cd7f1b'
    ])
    and public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

grant execute on function public.can_access_linked_cabinet_ai_owner(uuid) to authenticated;
grant execute on function public.can_access_linked_cabinet_ai_storage_owner(text) to authenticated;

drop policy if exists "linked_admins_manage_cabinet_folders" on public.ai_conversation_folders;
create policy "linked_admins_manage_cabinet_folders"
  on public.ai_conversation_folders
  for all
  to authenticated
  using (public.can_access_linked_cabinet_ai_owner(user_id))
  with check (public.can_access_linked_cabinet_ai_owner(user_id));

drop policy if exists "linked_admins_manage_cabinet_conversations" on public.ai_conversations;
create policy "linked_admins_manage_cabinet_conversations"
  on public.ai_conversations
  for all
  to authenticated
  using (public.can_access_linked_cabinet_ai_owner(user_id))
  with check (public.can_access_linked_cabinet_ai_owner(user_id));

drop policy if exists "linked_admins_manage_cabinet_messages" on public.ai_messages;
create policy "linked_admins_manage_cabinet_messages"
  on public.ai_messages
  for all
  to authenticated
  using (public.can_access_linked_cabinet_ai_owner(user_id))
  with check (public.can_access_linked_cabinet_ai_owner(user_id));

drop policy if exists "linked_admins_select_chat_attachments" on storage.objects;
create policy "linked_admins_select_chat_attachments"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and public.can_access_linked_cabinet_ai_storage_owner((storage.foldername(name))[1])
  );

drop policy if exists "linked_admins_select_generated_images" on storage.objects;
create policy "linked_admins_select_generated_images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'generated-images'
    and public.can_access_linked_cabinet_ai_storage_owner((storage.foldername(name))[1])
  );

create or replace function public.recover_cabinet_ai_history()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  visible_conversations integer := 0;
  visible_messages integer := 0;
  visible_folders integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_access_linked_cabinet_ai_owner(current_user_id) then
    raise exception 'Not allowed';
  end if;

  select count(*) into visible_conversations
  from public.ai_conversations
  where public.can_access_linked_cabinet_ai_owner(user_id);

  select count(*) into visible_messages
  from public.ai_messages
  where public.can_access_linked_cabinet_ai_owner(user_id);

  select count(*) into visible_folders
  from public.ai_conversation_folders
  where public.can_access_linked_cabinet_ai_owner(user_id);

  return jsonb_build_object(
    'recovered', false,
    'reason', 'linked_admin_history_visible_without_ownership_move',
    'conversations', visible_conversations,
    'messages', visible_messages,
    'folders', visible_folders
  );
end;
$$;

grant execute on function public.recover_cabinet_ai_history() to authenticated;
revoke execute on function public.recover_cabinet_ai_history() from anon;