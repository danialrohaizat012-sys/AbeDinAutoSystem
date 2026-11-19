// The main dashboard profile is the only source of Sewa privileges.
export function mappedSewaRole(mainRole: string): 'owner' | 'staf' {
  return mainRole === 'owner' ? 'owner' : 'staf';
}
