import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components';

export default function Welcome({ businessName }: { businessName: string }) {
  return (
    <Html>
      <Head />
      <Preview>Ekibin hazır — KOBİ Kaptanı seni bekliyor</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#0f0f10', color: '#fafafa', margin: 0 }}>
        <Container style={{ padding: '40px 24px', maxWidth: 600 }}>
          <Heading style={{ color: '#10b981' }}>Hoş geldin, {businessName}! ⚓</Heading>
          <Text>
            Bugünden itibaren 5 sanal asistanın işini kolaylaştıracak:
          </Text>
          <Text>🔍 SEO Ajanı — başlıklarını optimize eder</Text>
          <Text>📢 Pazarlama Ajanı — sosyal medya içeriği üretir</Text>
          <Text>💰 Fiyat Ajanı — rakip fiyatlarını takip eder</Text>
          <Text>💬 Yorum Ajanı — müşteri yorumlarını analiz eder</Text>
          <Text>📊 Nakit Akışı Ajanı — finansal sağlığı izler</Text>
          <Text style={{ marginTop: 24 }}>Hazır olduğunda dashboard'a giriş yap.</Text>
        </Container>
      </Body>
    </Html>
  );
}
