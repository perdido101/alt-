import { Link } from '@/i18n/navigation';

export function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="ΑΛΤ!">
      ΑΛΤ<span className="bang">!</span>
    </Link>
  );
}
