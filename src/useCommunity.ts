import { useState, useCallback, useEffect } from 'react';
import { supabase } from './supabase';
import type { Community, CommunityMember, CommunityIssue, CommunityRole } from './types';
import type { AuthUser } from './auth';

interface CommunityState {
  currentCommunity: Community | null;
  members: CommunityMember[];
  issues: CommunityIssue[];
  loading: boolean;
  error: string | null;
}

export function useCommunity(user: AuthUser | null) {
  const [state, setState] = useState<CommunityState>({
    currentCommunity: null,
    members: [],
    issues: [],
    loading: false,
    error: null,
  });

  const loadUserCommunity = useCallback(async () => {
    if (!user) {
      setState({ currentCommunity: null, members: [], issues: [], loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const { data: membership, error: memberError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_email', user.email)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!membership) {
        setState({ currentCommunity: null, members: [], issues: [], loading: false, error: null });
        return;
      }

      const { data: community, error: commError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', membership.community_id)
        .maybeSingle();

      if (commError) throw commError;

      const { data: members, error: membersError } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', membership.community_id)
        .order('street_cred', { ascending: false });

      if (membersError) throw membersError;

      const { data: issues, error: issuesError } = await supabase
        .from('community_issues')
        .select('*')
        .eq('community_id', membership.community_id)
        .order('created_at', { ascending: false });

      if (issuesError) throw issuesError;

      setState({
        currentCommunity: community as Community,
        members: (members as CommunityMember[]) || [],
        issues: (issues as CommunityIssue[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load community',
      }));
    }
  }, [user]);

  useEffect(() => {
    loadUserCommunity();
  }, [loadUserCommunity]);

  const joinCommunity = useCallback(
    async (inviteCode: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Not authenticated' };

      try {
        const { data: community, error: findError } = await supabase
          .from('communities')
          .select('*')
          .eq('invite_code', inviteCode.toUpperCase())
          .maybeSingle();

        if (findError) throw findError;
        if (!community) return { success: false, error: 'Invalid invite code' };

        const { data: existing } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', community.id)
          .eq('user_email', user.email)
          .maybeSingle();

        if (existing) {
          return { success: false, error: 'You are already a member of this community' };
        }

        const { error: insertError } = await supabase
          .from('community_members')
          .insert({
            community_id: community.id,
            user_name: user.name,
            user_email: user.email,
            user_avatar: user.avatar,
            role: 'resident' as CommunityRole,
            street_cred: 0,
          });

        if (insertError) throw insertError;

        await loadUserCommunity();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to join community',
        };
      }
    },
    [user, loadUserCommunity]
  );

  const createCommunity = useCallback(
    async (name: string, description: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Not authenticated' };

      try {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }

        const { data: community, error: createError } = await supabase
          .from('communities')
          .insert({
            name,
            description,
            invite_code: code,
            center_lat: 12.9716,
            center_lng: 77.5946,
            boundary_radius: 800,
          })
          .select('*')
          .single();

        if (createError) throw createError;

        const { error: memberError } = await supabase
          .from('community_members')
          .insert({
            community_id: community.id,
            user_name: user.name,
            user_email: user.email,
            user_avatar: user.avatar,
            role: 'head' as CommunityRole,
            street_cred: 100,
          });

        if (memberError) throw memberError;

        await loadUserCommunity();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to create community',
        };
      }
    },
    [user, loadUserCommunity]
  );

  const leaveCommunity = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !state.currentCommunity) return { success: false, error: 'No community' };

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', state.currentCommunity.id)
        .eq('user_email', user.email);

      if (error) throw error;

      await loadUserCommunity();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to leave community',
      };
    }
  }, [user, state.currentCommunity, loadUserCommunity]);

  const deleteCommunity = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !state.currentCommunity) return { success: false, error: 'No community' };

    try {
      const { error: membersError } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', state.currentCommunity.id);

      if (membersError) throw membersError;

      const { error: issuesError } = await supabase
        .from('community_issues')
        .delete()
        .eq('community_id', state.currentCommunity.id);

      if (issuesError) throw issuesError;

      const { error: commError } = await supabase
        .from('communities')
        .delete()
        .eq('id', state.currentCommunity.id);

      if (commError) throw commError;

      await loadUserCommunity();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete community',
      };
    }
  }, [user, state.currentCommunity, loadUserCommunity]);

  return {
    ...state,
    refresh: loadUserCommunity,
    joinCommunity,
    createCommunity,
    leaveCommunity,
    deleteCommunity,
  };
}
