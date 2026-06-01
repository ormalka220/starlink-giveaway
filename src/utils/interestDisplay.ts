import type { InterestArea, Participant } from '../types';

export const STANDARD_INTERESTS: readonly InterestArea[] = [
  'Forti SASE',
  'Perception Point',
  'Starlink',
  'פתרונות סייבר',
  'אחר',
];

export function getInterestDisplay(p: Pick<Participant, 'interest' | 'interestOther'>): {
  primary: string;
  detail?: string;
} {
  const other = (p.interestOther ?? '').trim();

  if (p.interest === 'אחר') {
    return other ? { primary: 'אחר', detail: other } : { primary: 'אחר' };
  }

  if (!STANDARD_INTERESTS.includes(p.interest as InterestArea)) {
    return { primary: 'אחר', detail: String(p.interest).trim() };
  }

  return { primary: p.interest };
}

export function interestDisplayText(p: Pick<Participant, 'interest' | 'interestOther'>): string {
  const { primary, detail } = getInterestDisplay(p);
  return detail ? `${primary} · ${detail}` : primary;
}

export function matchesInterestFilter(
  p: Pick<Participant, 'interest' | 'interestOther'>,
  filter: string,
): boolean {
  if (filter === 'הכל') return true;
  if (filter === 'אחר') return getInterestDisplay(p).primary === 'אחר';
  return p.interest === filter;
}
