import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components';

interface VerifyEmailProps {
  businessName: string;
  verifyUrl: string;
}

export default function VerifyEmail({ businessName, verifyUrl }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>KOBİ Kaptanı'na hoş geldin — e-postanı doğrula</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#0f0f10', color: '#fafafa', margin: 0 }}>
        <Container style={{ padding: '40px 24px', maxWidth: 600 }}>
          <Heading style={{ color: '#10b981' }}>⚓ KOBİ Kaptanı</Heading>
          <Text>Merhaba {businessName},</Text>
          <Text>
            5 sanal asistanından oluşan ekibin sana hoş geldin diyor.
            Devam etmek için e-posta adresini doğrula:
          </Text>
          <Button
            href={verifyUrl}
            style={{
              background: '#10b981',
              color: '#0f0f10',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            E-postamı Doğrula
          </Button>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 32 }}>
            Bu e-postayı sen istemediysen yok say.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
