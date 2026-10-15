import { palette } from '@alt/tokens';
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

const font = "'Commissioner', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Shared email frame: wordmark, content, and the never-asks line. Colours come from @alt/tokens. */
export function EmailLayout({ lang, preview, footer, children }: { lang: string; preview: string; footer: string; children: ReactNode }) {
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: palette.ground, fontFamily: font, color: palette.ink, margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: palette.white, borderRadius: 20, padding: 32, maxWidth: 560, border: `1px solid ${palette.line}` }}>
          <Text style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2, color: palette.teal700, margin: '0 0 16px' }}>
            ΑΛΤ<span style={{ color: palette.ember }}>!</span>
          </Text>
          {children}
          <Text style={{ fontSize: 14, color: palette.inkSoft, borderTop: `1px solid ${palette.line}`, paddingTop: 16, marginTop: 32 }}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const H = ({ children }: { children: ReactNode }) => <Heading style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px', color: palette.ink }}>{children}</Heading>;
export const P = ({ children }: { children: ReactNode }) => <Text style={{ fontSize: 17, lineHeight: '26px', margin: '0 0 12px' }}>{children}</Text>;
export const Code = ({ children }: { children: ReactNode }) => (
  <Section style={{ backgroundColor: palette.teal50, borderRadius: 16, padding: 20, textAlign: 'center', margin: '16px 0' }}>
    <Text style={{ fontSize: 28, fontWeight: 800, letterSpacing: 3, margin: 0, color: palette.teal900 }}>{children}</Text>
  </Section>
);
export const Cta = ({ href, children }: { href: string; children: ReactNode }) => (
  <Button href={href} style={{ backgroundColor: palette.teal700, color: palette.white, borderRadius: 16, padding: '14px 24px', fontSize: 17, fontWeight: 600 }}>
    {children}
  </Button>
);
