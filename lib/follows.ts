import type { SupabaseClient } from "@supabase/supabase-js";

export type FollowStatus = {
  /** The signed-in user's id, or null when nobody is signed in. */
  viewerId: string | null;
  isFollowing: boolean;
};

/**
 * Reads whether the signed-in user follows `profileId`.
 * Signed-out viewers get `{ viewerId: null, isFollowing: false }`.
 */
export async function getFollowStatus(
  supabase: SupabaseClient,
  profileId: string,
): Promise<FollowStatus> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { viewerId: null, isFollowing: false };
  }

  const viewerId = authData.user.id;
  if (viewerId === profileId) {
    return { viewerId, isFollowing: false };
  }

  const { data, error } = await supabase
    .from("follows")
    .select("followed_id")
    .eq("follower_id", viewerId)
    .eq("followed_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load follow status.");
  }

  return { viewerId, isFollowing: Boolean(data) };
}

/**
 * Creates or removes the follows row for `followerId` -> `followedId`.
 * Throws with the Supabase message on failure so callers can surface it.
 */
export async function setFollowing(
  supabase: SupabaseClient,
  followerId: string,
  followedId: string,
  follow: boolean,
): Promise<void> {
  if (followerId === followedId) {
    throw new Error("You can't follow yourself.");
  }

  if (follow) {
    const { error } = await supabase
      .from("follows")
      .upsert(
        { follower_id: followerId, followed_id: followedId },
        { onConflict: "follower_id,followed_id", ignoreDuplicates: true },
      );
    if (error) {
      throw new Error(error.message || "Failed to follow this user.");
    }
    return;
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("followed_id", followedId);
  if (error) {
    throw new Error(error.message || "Failed to unfollow this user.");
  }
}
