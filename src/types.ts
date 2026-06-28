export type IssueStatus = 'open' | 'in-progress' | 'resolved';

export type IssueCategory =
  | 'Pothole'
  | 'Broken Streetlight'
  | 'Trash Accumulation'
  | 'Graffiti'
  | 'Water Leak'
  | 'Fallen Tree'
  | 'Illegal Parking'
  | 'Damaged Sidewalk';

export interface Issue {
  id: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  lat: number;
  lng: number;
  address: string;
  reportedBy: string;
  reportedAt: string;
  severity: number;
  confidence: number;
  aiDescription: string;
  verifications: number;
  image: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  level: number;
  reports: number;
  verifications: number;
  trend: 'up' | 'down' | 'same';
}

export interface UserProfile {
  name: string;
  handle: string;
  avatar: string;
  email: string;
  level: number;
  streetCred: number;
  nextLevelAt: number;
  reports: number;
  verifications: number;
  resolved: number;
  streak: number;
  joinDate: string;
}

export type CommunityRole = 'head' | 'maintenance' | 'resident';

export interface Community {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  center_lat: number;
  center_lng: number;
  boundary_radius: number;
  created_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string;
  role: CommunityRole;
  street_cred: number;
  joined_at: string;
}

export interface CommunityIssue {
  id: string;
  community_id: string;
  title: string;
  category: string;
  status: IssueStatus;
  lat: number;
  lng: number;
  address: string;
  reported_by: string;
  severity: number;
  confidence: number;
  ai_description: string;
  verifications: number;
  image: string;
  created_at: string;
}

export interface MapIssue {
  id: string;
  title: string;
  category: IssueCategory | string;
  status: IssueStatus;
  lat: number;
  lng: number;
  address: string;
  reportedBy: string;
  reportedAt: string;
  severity: number;
  confidence: number;
  aiDescription: string;
  verifications: number;
  image: string;
}

export function toMapIssue(i: Issue): MapIssue {
  return { ...i };
}

export function communityIssueToMapIssue(i: CommunityIssue): MapIssue {
  return {
    id: i.id,
    title: i.title,
    category: i.category,
    status: i.status,
    lat: i.lat,
    lng: i.lng,
    address: i.address,
    reportedBy: i.reported_by,
    reportedAt: i.created_at,
    severity: i.severity,
    confidence: i.confidence,
    aiDescription: i.ai_description,
    verifications: i.verifications,
    image: i.image,
  };
}
